# Chapter 8: Database Design Basics

How do you decide what tables to create and how to structure your data? This chapter teaches you to think about data design.

---

## From Idea to Schema

```
  YOUR IDEA                  TABLE DESIGN               CONVEX SCHEMA
  ─────────                  ────────────               ─────────────

  "I want to track           users table                defineTable({
   users who play   ──►     ┌────────────┐    ──►        email: v.string(),
   archery games"           │ email      │               fullName: v.string(),
                            │ fullName   │               username: v.string(),
                            │ username   │             })
                            │ createdAt  │
                            └────────────┘
```

**Think of each table as a spreadsheet:**
- Each **row** is one item (one user, one game, one task)
- Each **column** is a property of that item (name, email, score)
- The **schema** defines what columns exist and their types

---

## The Convex Validator Cheat Sheet

Every field in your schema needs a **validator** that defines its type:

```
  VALIDATOR                    ACCEPTS                  EXAMPLE
  ─────────                    ───────                  ───────
  v.string()                   any text                 "hello"
  v.number()                   any number               42, 3.14
  v.boolean()                  true or false             true
  v.null()                     null only                 null

  v.optional(v.string())       string OR missing         "hi" or omitted
  v.array(v.number())          list of numbers           [1, 2, 3]
  v.object({                   nested object             { name: "John",
    name: v.string(),                                      age: 30 }
    age: v.number()
  })

  v.union(                     one of several types      "a" or "b"
    v.literal("a"),
    v.literal("b")
  )

  v.id("users")               reference to another      "jh76b..."
                               table's row               (auto-generated ID)
```

---

## Indexes -- Making Queries Fast

Without an index, Convex checks every row to find what you need. With an index, it jumps directly to the answer.

```
  WITHOUT INDEX:                     WITH INDEX:
  ──────────────                     ───────────

  "Find user with email              "Find user with email
   john@test.com"                     john@test.com"

  Check row 1... no                  Jump directly
  Check row 2... no                  to the right row!
  Check row 3... no
  Check row 4... YES!                ┌─────────────┐
                                     │ INDEX:      │
  Slow. Checks                       │ by_email    │
  EVERY row.                         │             │
                                     │ john@.. → 4 │
  Like reading                       │ ann@..  → 2 │
  every page of                      │ bob@..  → 1 │
  a book to find                     └─────────────┘
  one sentence.
                                     Like using the
                                     index at the back
                                     of a textbook.
```

**Add an index for every field you search by:**

```typescript
users: defineTable({
  clerkId: v.optional(v.string()),
  email: v.string(),
  username: v.string(),
})
  .index("by_clerk_id", ["clerkId"])  // Find user by Clerk ID
  .index("by_email", ["email"])       // Find user by email
  .index("by_username", ["username"]) // Find user by username
```

**Use indexes in queries:**

```typescript
// Fast: uses the "by_email" index
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", "john@test.com"))
  .first();

// Slow: scans all rows (no index)
const allUsers = await ctx.db.query("users").collect();
const user = allUsers.find(u => u.email === "john@test.com");
```

---

## Relationships Between Tables

Tables connect to each other using **IDs**.

```
  ONE-TO-MANY: One user creates many games

  users                          games
  ┌──────────┐                  ┌──────────────┐
  │ _id      │◄────────────────│ creatorId    │
  │ fullName │   "created by"  │ playerCount  │
  │ email    │                 │ isFinished   │
  └──────────┘                 └──────────────┘

  One user → many games.
  Each game → one creator.
  Link: games.creatorId = v.id("users")
```

```
  MANY-TO-MANY: Users belong to many teams, teams have many users

  users              clanMembers (join table)     clans
  ┌───────┐          ┌──────────────┐            ┌───────┐
  │ _id   │◄────────│ userId       │            │ _id   │
  │ name  │          │ clanId       │───────────►│ name  │
  └───────┘          │ role         │            │ tag   │
                     │ joinedAt     │            └───────┘
                     └──────────────┘

  The "join table" (clanMembers) connects the two.
  Each row says: "this user belongs to this team with this role."
```

In Convex schema:

```typescript
games: defineTable({
  creatorId: v.id("users"),     // Links to users table
  playerCount: v.number(),
  isFinished: v.boolean(),
})
  .index("by_creator", ["creatorId"]),

clanMembers: defineTable({
  clanId: v.id("clans"),        // Links to clans table
  userId: v.id("users"),        // Links to users table
  role: v.union(v.literal("leader"), v.literal("member")),
  joinedAt: v.number(),
})
  .index("by_clan", ["clanId"])
  .index("by_user", ["userId"])
  .index("by_clan_and_user", ["clanId", "userId"]),
```

---

## Common Design Patterns

### Timestamps

Always store timestamps as numbers (`Date.now()`):

```typescript
defineTable({
  createdAt: v.number(),                // When created
  updatedAt: v.number(),                // When last modified
  finishedAt: v.optional(v.number()),   // Optional: when completed
})
```

### Status Fields

Use `v.union` with `v.literal` for fixed status values:

```typescript
defineTable({
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("finished")
  ),
})
```

### Embedding Data vs Separate Tables

Sometimes it's better to **embed data in the same row** instead of creating a separate table:

```typescript
// EMBEDDED: Shots stored inside the game (good when always read together)
games: defineTable({
  players: v.array(v.object({
    name: v.string(),
    shots: v.array(v.union(v.boolean(), v.null())),
  })),
})

// SEPARATE TABLE: Stats updated independently (good for separate access)
playerStats: defineTable({
  userId: v.id("users"),
  totalGames: v.number(),
  rating: v.number(),
})
```

**Rule of thumb:** If you always read the data together, embed it. If you access it independently or it grows unbounded, use a separate table.

### Precomputed Stats

Instead of counting records every time, store the count:

```typescript
// BAD: Count all games every time (slow as data grows)
const games = await ctx.db.query("games").collect();
const wins = games.filter(g => g.winnerId === userId).length;

// GOOD: Precomputed stats (fast, always O(1))
const stats = await ctx.db.query("playerStats")
  .withIndex("by_user", q => q.eq("userId", userId))
  .first();
const wins = stats?.totalWins ?? 0;
```

Update the precomputed stats whenever the source data changes (e.g., on game finish).

---

> **In our Shagai project...**
>
> Our schema (`convex/schema.ts`) has 14 tables. Key design decisions:
>
> **Shots are embedded in games**, not stored separately:
> ```typescript
> players: v.array(v.object({
>   name: v.string(),
>   shots: v.array(v.union(v.boolean(), v.null())),
>   // true = hit, false = miss, null = not yet shot
> }))
> ```
> This works because shots are always read with the game. You never query "all shots across all games."
>
> **Stats are precomputed** in a `playerStats` table:
> ```typescript
> playerStats: defineTable({
>   userId: v.id("users"),
>   totalGames: v.number(),
>   totalWins: v.number(),
>   avgAccuracy: v.number(),
>   rating: v.number(),      // ELO rating, starts at 1500
>   ratingDeviation: v.number(), // Glicko-2 uncertainty
> })
> ```
> Updated asynchronously via `ctx.scheduler.runAfter()` when a game finishes.
>
> **Compound index** for checking if a user is in a clan:
> ```typescript
> .index("by_clan_and_user", ["clanId", "userId"])
> ```
> This lets us quickly check: "Is user X a member of clan Y?"

---

## Checkpoint

You should be able to:
1. Design a schema with 2+ tables that relate to each other
2. Add indexes for fields you query by
3. Use `v.id("otherTable")` to create relationships between tables
4. Choose between embedding data and using separate tables

> **Common mistake:** Forgetting indexes. Your queries will still work but get slower as your data grows. Add indexes early.

> **Common mistake:** Using `v.string()` for IDs. Use `v.id("tableName")` for references to other tables. Convex validates that the ID actually exists.

---

**Next:** [Chapter 9: Deploy to Vercel](09-deploy-vercel.md)
