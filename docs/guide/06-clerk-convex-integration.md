# Chapter 6: Connecting Clerk + Convex Together

You have Clerk (auth) and Convex (database) set up separately. Now you need to connect them so Convex knows **which user** is making requests.

---

## Why Do They Need to Be Connected?

```
  WITHOUT CONNECTION:                  WITH CONNECTION:
  ──────────────────                   ────────────────

  Clerk: "User is John"               Clerk: "User is John"
  Convex: "I have no idea                    │
           who is talking to me"              │  JWT Token (proof)
                                              ▼
  User signs in via Clerk ──► OK       Convex: "I verified the token.
  User saves data to Convex ──► ???     This is John. He can
  Convex: "WHO ARE YOU?"                save his data."
```

The connection uses **JWT (JSON Web Tokens)**:
1. Clerk creates a signed token that says "this is John, verified by Clerk"
2. Convex checks the token's signature to verify it really came from YOUR Clerk app
3. If valid, Convex knows who the user is

---

## The Three Pieces You Need

```
  PIECE 1                    PIECE 2                    PIECE 3
  ────────                   ────────                   ────────
  convex/auth.config.ts      ConvexClientProvider.tsx    Environment Variable

  ┌──────────────────┐       ┌──────────────────────┐   ┌──────────────────┐
  │ Tell Convex to   │       │ Pass Clerk's useAuth  │   │ CLERK_JWT_ISSUER │
  │ TRUST tokens     │       │ hook to the Convex    │   │ _DOMAIN          │
  │ from your Clerk  │       │ client so it can      │   │                  │
  │ domain           │       │ send tokens with      │   │ The actual URL   │
  └──────────────────┘       │ every request         │   │ of your Clerk    │
                             └──────────────────────┘   └──────────────────┘
```

---

## Step 1: Create convex/auth.config.ts

This file tells Convex: "Trust JWT tokens signed by this Clerk domain."

```typescript
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
};
```

- `domain` -- your Clerk issuer URL (set as an environment variable)
- `applicationID: "convex"` -- a standard identifier used by the Clerk-Convex integration

---

## Step 2: Create the ConvexClientProvider

Create `components/providers/ConvexClientProvider.tsx`:

```tsx
"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

// Create a Convex client that connects to your Convex deployment
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

**What each import does:**
- `ConvexProviderWithClerk` -- the bridge between Clerk and Convex
- `ConvexReactClient` -- creates a connection to your Convex backend
- `useAuth` -- Clerk's hook that provides the JWT token

`ConvexProviderWithClerk` automatically attaches the Clerk token to every Convex request. Convex verifies it using the config from Step 1.

---

## Step 3: Wire It Into layout.tsx

**The order of providers matters.** ClerkProvider must be **outside** ConvexClientProvider because Convex needs to read Clerk's auth state.

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

Here's the full nesting:

```
  ┌─── ClerkProvider ─────────────────────────────┐
  │  Provides: useAuth(), useUser()               │
  │                                               │
  │  ┌─── ConvexClientProvider ─────────────────┐ │
  │  │  Uses useAuth() from Clerk               │ │
  │  │  Attaches JWT token to Convex requests   │ │
  │  │  Provides: useQuery(), useMutation()     │ │
  │  │                                          │ │
  │  │  ┌─── Your App ──────────────────────┐   │ │
  │  │  │                                   │   │ │
  │  │  │  Can use BOTH Clerk AND Convex:   │   │ │
  │  │  │   - useUser() (who am I?)         │   │ │
  │  │  │   - useQuery() (read database)    │   │ │
  │  │  │   - useMutation() (write database)│   │ │
  │  │  │                                   │   │ │
  │  │  │  Convex knows who the user is!    │   │ │
  │  │  └───────────────────────────────────┘   │ │
  │  └──────────────────────────────────────────┘ │
  └───────────────────────────────────────────────┘

  ORDER: ClerkProvider (outer) > ConvexClientProvider (inner)
  If reversed, Convex cannot read auth state → errors!
```

---

## Step 4: Set the Clerk JWT Issuer Domain

Tell Convex where your Clerk domain is. Run this in your terminal:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
```

**Where to find your domain:** Clerk Dashboard > API Keys > look for the "Issuer" URL. It looks like `https://stirred-sole-81.clerk.accounts.dev` (your subdomain will be different).

---

## Step 5: Access Auth in Convex Functions

Now your Convex functions can check who is calling them:

```typescript
import { query, mutation } from "./_generated/server";

export const getMyData = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user's identity
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      // Not signed in
      return null;
    }

    // identity.subject = Clerk user ID
    // identity.email = user's email
    console.log("User ID:", identity.subject);

    return { userId: identity.subject };
  },
});
```

---

## Step 6: Create Auth Helper Functions

Instead of repeating `ctx.auth.getUserIdentity()` in every function, create a helper. Add `convex/auth.ts`:

```typescript
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Throws if not authenticated
export async function getAuthUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found. Please sign in again.");
  }

  return user;
}

// Returns null if not authenticated (no error)
export async function getOptionalAuthUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}
```

Now use it in any function:

```typescript
import { getAuthUser } from "./auth";

export const mySecureFunction = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    // user._id, user.fullName, user.email are available
  },
});
```

---

## Step 7: Auto-Create Users on First Sign-In

Clerk handles authentication, but you need a matching **user record in your Convex database**. Create a provider that syncs them.

Add a `createOrGetUser` mutation to `convex/users.ts`:

```typescript
export const createOrGetUser = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user already exists in Convex
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) return existing._id;

    // First time: create a new user record
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: args.email,
      fullName: args.fullName,
      username: args.username,
      createdAt: Date.now(),
    });
  },
});
```

Then create `components/providers/UserSyncProvider.tsx`:

```tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const createOrGetUser = useMutation(api.users.createOrGetUser);

  useEffect(() => {
    if (!isLoaded || !user) return;

    createOrGetUser({
      email: user.emailAddresses[0]?.emailAddress ?? "",
      fullName: user.fullName ?? "",
      username: user.username ?? user.firstName ?? "",
    });
  }, [isLoaded, user, createOrGetUser]);

  return <>{children}</>;
}
```

Here's the flow:

```
  FIRST SIGN-IN:
  ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
  │    CLERK     │     │  UserSync     │     │   CONVEX    │
  │              │     │  Provider     │     │             │
  │ User signs   │────►│ Detects new   │────►│ Creates new │
  │ in for the   │     │ Clerk user.   │     │ user record │
  │ first time   │     │ Calls         │     │ in database │
  │              │     │ createOrGetUser│     │             │
  └─────────────┘     └───────────────┘     └─────────────┘

  SECOND SIGN-IN:
  ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
  │    CLERK     │     │  UserSync     │     │   CONVEX    │
  │              │     │  Provider     │     │             │
  │ User signs   │────►│ Calls         │────►│ Finds       │
  │ in again     │     │ createOrGetUser│     │ existing    │
  │              │     │               │     │ record. Done│
  └─────────────┘     └───────────────┘     └─────────────┘
```

---

> **In our Shagai project...**
>
> We also have a `requireAdmin` helper in `convex/auth.ts`:
> ```typescript
> export async function requireAdmin(ctx) {
>   const user = await getAuthUser(ctx);
>   if (user.role !== "admin") {
>     throw new Error("Admin access required");
>   }
>   return user;
> }
> ```
> This is used in the admin panel to restrict access. Only users with `role: "admin"` in the database can use admin functions.
>
> Our `UserSyncProvider` wraps the app inside the `LayoutWrapper`, so it only runs for signed-in users (inside `<SignedIn>`).

---

## Checkpoint

1. Sign in via Clerk
2. Open the Convex Dashboard (dashboard.convex.dev)
3. Look at the `users` table -- you should see your user record
4. Call a Convex mutation that uses `getAuthUser(ctx)` -- it should return your user

> **Common mistake:** Wrapping providers in the wrong order. `ClerkProvider` must be **outside** `ConvexClientProvider`.

> **Common mistake:** Forgetting to run `npx convex env set CLERK_JWT_ISSUER_DOMAIN ...`. Without this, `ctx.auth.getUserIdentity()` returns null even for signed-in users.

> **Common mistake:** Using the wrong domain URL. It must include `https://` and be the exact issuer domain from your Clerk dashboard.

---

**Next:** [Chapter 7: Building Your First Page](07-first-page.md)
