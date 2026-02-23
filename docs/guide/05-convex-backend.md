# Chapter 5: Setting Up Convex (Your Backend + Database)

Your app needs a place to **store data** (a database) and **run logic** (a backend). Convex handles both.

---

## What is a Backend?

```
  ┌───────────────┐                    ┌───────────────┐
  │   FRONTEND    │                    │   BACKEND     │
  │   (Browser)   │                    │   (Server)    │
  │               │                    │               │
  │  What users   │   HTTP requests    │  Where data   │
  │  SEE and      │ ◄────────────────► │  LIVES and    │
  │  interact     │                    │  logic RUNS   │
  │  with         │                    │               │
  └───────────────┘                    └───────────────┘

  Frontend: buttons, forms, colors, text
  Backend: database, user accounts, game scores, calculations
```

Traditionally, you'd build a backend yourself (write a server with Express or Django, set up a database like PostgreSQL). With Convex, you just **write TypeScript functions** and Convex handles everything else: hosting, database, real-time sync.

---

## What Makes Convex Special?

```
  TRADITIONAL API (REST):              CONVEX:
  ──────────────────────               ──────

  1. User A adds a score              1. User A adds a score
  2. Server saves it                   2. Convex saves it
  3. User B's page is stale            3. User B's page updates
  4. User B must REFRESH               INSTANTLY. Automatic.
     to see the new score
                                       No refresh button needed.
                                       Data flows like a live stream.
```

Convex uses **live queries**. When data changes in the database, every connected browser that's looking at that data gets updated automatically. No polling. No manual refreshing.

---

## Step 1: Install Convex

```bash
bun add convex
```

---

## Step 2: Start the Convex Development Server

```bash
npx convex dev
```

**The first time you run this**, it will:
1. Open your browser to sign in to Convex
2. Ask you to create a new project (or select an existing one)
3. Generate files in `convex/_generated/`
4. Start watching your `convex/` folder for changes

You'll see something like:

```
  ✓ Connected to https://your-project-123.convex.cloud
  ✓ Convex functions ready! (0.8s)
```

**Keep this terminal running.** It watches your files and re-deploys your Convex functions every time you save. Open a **second terminal** for other commands.

It also creates a `.env.local` entry:

```
NEXT_PUBLIC_CONVEX_URL=https://your-project-123.convex.cloud
```

---

## Step 3: Understand the convex/ Folder

```
  convex/
  ├── _generated/           ← AUTO-GENERATED. Do NOT edit these!
  │   ├── api.js            ← The API object you import in frontend
  │   ├── api.d.ts          ← TypeScript types for your API
  │   ├── dataModel.d.ts    ← Types for your database tables
  │   └── server.js         ← Utilities for defining functions
  │
  ├── schema.ts             ← YOU write this: database table definitions
  ├── tasks.ts              ← YOU write this: functions for "tasks" table
  └── auth.config.ts        ← YOU write this: auth provider config
```

The `_generated/` folder is rebuilt every time you save a file in `convex/`. Never edit it manually.

---

## Step 4: Define Your Schema

The schema describes what your database tables look like. Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // "tasks" is the table name
  tasks: defineTable({
    text: v.string(),         // text must be a string
    isCompleted: v.boolean(), // isCompleted must be true or false
    createdAt: v.number(),    // createdAt must be a number (timestamp)
  }),
});
```

**Think of a schema as a blueprint.** It tells Convex: "My tasks table has rows with these columns and these types."

The `v.` validators ensure your data is always the right type:

```
  v.string()                  "hello", "world"
  v.number()                  42, 3.14, Date.now()
  v.boolean()                 true, false
  v.null()                    null
  v.optional(v.string())      "hello" or the field can be missing
  v.array(v.number())         [1, 2, 3]
  v.object({ name: v.string() })   { name: "John" }
  v.id("tasks")               a reference to a row in the "tasks" table
```

---

## Step 5: Write Your First Query

A **query** reads data from the database. Create `convex/tasks.ts`:

```typescript
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")     // read from "tasks" table
      .order("desc")      // newest first
      .take(20);          // limit to 20 rows
  },
});
```

**What each part means:**
- `query` -- this function READS data (cannot write)
- `args: {}` -- this function takes no arguments
- `ctx` -- "context", gives you access to the database (`ctx.db`)
- `ctx.db.query("tasks")` -- start a query on the "tasks" table

---

## Step 6: Write Your First Mutation

A **mutation** writes data to the database. Add to `convex/tasks.ts`:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ... list query from above ...

export const create = mutation({
  args: {
    text: v.string(),   // caller MUST provide a text string
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", {
      text: args.text,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: {
    id: v.id("tasks"),   // caller provides a task ID
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;
    await ctx.db.patch(args.id, {
      isCompleted: !task.isCompleted,
    });
  },
});
```

**Key database operations:**
- `ctx.db.insert("table", data)` -- create a new row
- `ctx.db.get(id)` -- get one row by ID
- `ctx.db.patch(id, updates)` -- update specific fields
- `ctx.db.delete(id)` -- delete a row

---

## Step 7: Use in Your Frontend

Now connect your frontend to these Convex functions:

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TasksPage() {
  // QUERY: reads tasks, auto-updates when data changes
  const tasks = useQuery(api.tasks.list);

  // MUTATIONS: functions that modify data
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);

  // Loading state
  if (tasks === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <button onClick={() => createTask({ text: "New task" })}>
        Add Task
      </button>

      {tasks.map((task) => (
        <div key={task._id} onClick={() => toggleTask({ id: task._id })}>
          {task.isCompleted ? "✓" : "○"} {task.text}
        </div>
      ))}
    </div>
  );
}
```

Here's how data flows:

```
  YOUR PAGE                            CONVEX CLOUD
  ─────────                            ────────────

  useQuery(api.tasks.list)
       │                               ┌─────────────┐
       └──── subscribes ──────────────►│  Database    │
                                       │  ┌────────┐  │
       ◄──── live data ───────────────│  │ tasks  │  │
                                       │  └────────┘  │
  createTask({ text: "New task" })     │              │
       │                               │              │
       └──── sends data ─────────────►│  (inserts)   │
                                       │              │
       ◄──── auto-updates! ──────────│  (notifies   │
             (no refresh needed)       │   all subs)  │
                                       └─────────────┘
```

**The magic:** When you call `createTask()`, Convex:
1. Inserts the row in the database
2. Detects that the `list` query is affected
3. Pushes the updated results to ALL connected browsers
4. React re-renders the component with the new data

---

## Queries vs Mutations vs Actions

```
  QUERY           MUTATION          ACTION
  ─────           ────────          ──────
  READS data      WRITES data       SIDE EFFECTS

  Cannot modify   Can insert,       Can call external
  the database    update, delete    APIs (send email,
                                    fetch from web)

  useQuery()      useMutation()     useAction()

  Runs every      Runs once when    Runs once when
  time data       you call it       you call it
  changes
```

---

> **In our Shagai project...**
>
> Our Convex backend has 12 modules:
>
> ```
> convex/
> ├── schema.ts        ← 14 tables (users, games, teamGames, clans, etc.)
> ├── games.ts         ← Series game: create, recordShot, editShot
> ├── teamGames.ts     ← Team game logic (~2000 lines)
> ├── users.ts         ← User CRUD, search, quickAdd
> ├── stats.ts         ← ELO rating calculation (internal mutation)
> ├── teams.ts         ← Clan management (create, invite, join)
> ├── dashboard.ts     ← Leaderboard + live stats
> ├── profiles.ts      ← Player profile (rating history, accuracy)
> └── auth.ts          ← Auth helper functions
> ```
>
> We use `ctx.scheduler.runAfter()` to run expensive calculations asynchronously:
> ```typescript
> // In games.ts recordShot mutation, when game finishes:
> if (isFinished) {
>   await ctx.scheduler.runAfter(0, internal.stats.updateStatsOnGameFinish, {
>     gameId: args.gameId,
>   });
> }
> ```
> This schedules the stats calculation to run immediately but **without blocking the user**. The player sees "Game Over!" instantly while ELO ratings update in the background.

---

## Checkpoint

1. Your terminal running `npx convex dev` shows "Convex functions ready!"
2. You have a `schema.ts` with at least one table
3. You can call `useQuery` and see data appear in your browser
4. Adding data with `useMutation` updates the UI without refreshing

> **Common mistake:** Not running `npx convex dev`. Your functions won't be deployed, and `useQuery` will return `undefined` forever.

> **Common mistake:** Editing files in `convex/_generated/`. They get overwritten every time you save a file in `convex/`.

> **Common mistake:** Using `query` when you need `mutation`. Queries are read-only. If your function needs to insert or update data, use `mutation`.

---

**Next:** [Chapter 6: Connecting Clerk + Convex](06-clerk-convex-integration.md)
