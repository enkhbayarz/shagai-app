# Chapter 12: Environment Variables -- Managing Secrets Safely

Environment variables are how you store **secret keys** and **configuration** without putting them in your code.

---

## The Problem

```
  BAD (secret in code):

  const clerkKey = "sk_live_abc123xyz789";   // NEVER DO THIS!

  If you push this to GitHub:
  - Anyone can see your secret key
  - Bots scan GitHub for exposed keys
  - Your account could be compromised
  - In minutes.
```

```
  GOOD (secret in environment variable):

  const clerkKey = process.env.CLERK_SECRET_KEY;

  The actual value lives in .env.local (not in code)
  .env.local is git-ignored (never pushed to GitHub)
  The code just says "read from the environment"
```

---

## How It Works

```
  YOUR CODE:                           .env.local FILE:
  ──────────                           ────────────────

  process.env.MY_SECRET        ◄────   MY_SECRET=super_secret_value

  Your code says:                      The actual value lives
  "read the value of MY_SECRET         in this file, separate
  from the environment"                from your code

  Pushed to GitHub: YES                Pushed to GitHub: NO
  (no secrets in code)                 (listed in .gitignore)
```

When you run `bun dev`, Next.js automatically reads `.env.local` and makes those values available via `process.env.VARIABLE_NAME`.

---

## The NEXT_PUBLIC_ Rule

This is the most important rule about environment variables in Next.js:

```
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  NEXT_PUBLIC_SOMETHING = "value"                     │
  │  ────────────────────────────────                    │
  │  The NEXT_PUBLIC_ prefix means:                      │
  │  This value is sent to the BROWSER.                  │
  │  Anyone can see it in your page source.              │
  │  OK for: publishable keys (pk_), public URLs         │
  │                                                      │
  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                  │
  │                                                      │
  │  SOMETHING_SECRET = "value"                          │
  │  ──────────────────────────                          │
  │  NO prefix means:                                    │
  │  This value stays on the SERVER only.                │
  │  The browser NEVER sees it.                          │
  │  Required for: secret keys (sk_), API secrets        │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

---

## All the Environment Variables You Need

Your project has three places where environment variables live:

### 1. `.env.local` (Your Computer -- for development)

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-dev-project.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123...
CLERK_SECRET_KEY=sk_test_xyz789...
```

### 2. Convex Environment Variables (set via CLI)

```bash
# For development:
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev

# For production:
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev --prod
```

### 3. Vercel Environment Variables (for production)

Set in Vercel Dashboard > Settings > Environment Variables:

```
  NEXT_PUBLIC_CONVEX_URL              = https://your-prod-project.convex.cloud
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   = pk_live_abc123...
  CLERK_SECRET_KEY                    = sk_live_xyz789...
```

---

## Dev vs Production Keys

```
  DEVELOPMENT                        PRODUCTION
  ───────────                        ──────────

  pk_test_...                        pk_live_...
  sk_test_...                        sk_live_...
  xxx-dev.convex.cloud               xxx-prod.convex.cloud

  CLERK TEST MODE:                   CLERK LIVE MODE:
  ──────────────                     ───────────────
  • Free, no limits                  • Real users
  • Fake OAuth                       • Real OAuth (Google, GitHub)
  • Users are test accounts          • Users are real people
  • Dashboard shows "Test mode"      • Dashboard shows "Live mode"
```

**Switch Clerk to live mode:**
1. Clerk Dashboard > your app
2. Toggle "Development" to "Production" (or create a production instance)
3. Copy the new live keys (`pk_live_`, `sk_live_`)

---

## Setting Convex Environment Variables

Convex functions run on Convex's servers, not on Vercel. They need their own environment variables:

```bash
# List current env vars
npx convex env list

# Set a new env var (development)
npx convex env set MY_VARIABLE "my_value"

# Set a new env var (production)
npx convex env set MY_VARIABLE "my_value" --prod

# Remove an env var
npx convex env unset MY_VARIABLE
```

These are separate from your `.env.local` file. They're stored on Convex's servers and available in your `convex/` functions via `process.env.MY_VARIABLE`.

---

## The Complete Picture

```
  ┌──────────────────────────────────────────────────────────────┐
  │  YOUR COMPUTER (development)                                 │
  │                                                              │
  │  .env.local                  npx convex env set ...          │
  │  ┌────────────────────┐      ┌────────────────────┐          │
  │  │ NEXT_PUBLIC_CONVEX_ │      │ CLERK_JWT_ISSUER_  │          │
  │  │ URL (dev)           │      │ DOMAIN (dev)       │          │
  │  │ CLERK keys (test)   │      │                    │          │
  │  └────────┬───────────┘      └────────┬───────────┘          │
  │           │                           │                      │
  │           ▼                           ▼                      │
  │    Next.js dev server          Convex dev server             │
  │    (bun dev)                   (npx convex dev)              │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  THE INTERNET (production)                                   │
  │                                                              │
  │  Vercel env vars             Convex prod env vars            │
  │  ┌────────────────────┐      ┌────────────────────┐          │
  │  │ NEXT_PUBLIC_CONVEX_ │      │ CLERK_JWT_ISSUER_  │          │
  │  │ URL (prod)          │      │ DOMAIN (prod)      │          │
  │  │ CLERK keys (live)   │      │                    │          │
  │  └────────┬───────────┘      └────────┬───────────┘          │
  │           │                           │                      │
  │           ▼                           ▼                      │
  │    Vercel (hosts Next.js)      Convex Cloud (hosts backend)  │
  │    your-app.vercel.app         your-project.convex.cloud     │
  └──────────────────────────────────────────────────────────────┘
```

---

## Security Checklist

Before going live, verify:

- [ ] `.env.local` is in `.gitignore` (check with `git status`)
- [ ] No secrets hardcoded in any `.ts` or `.tsx` file
- [ ] `NEXT_PUBLIC_` prefix only on non-secret values
- [ ] Production uses **live** Clerk keys (`pk_live_`, `sk_live_`)
- [ ] Production Convex URL points to the **production** deployment
- [ ] `CLERK_JWT_ISSUER_DOMAIN` is set on Convex **production**
- [ ] `.env.local` is never committed to Git

---

> **In our Shagai project...**
>
> We use four environment variables total:
>
> | Variable | Where | Purpose |
> |----------|-------|---------|
> | `NEXT_PUBLIC_CONVEX_URL` | `.env.local` + Vercel | Convex backend URL |
> | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.env.local` + Vercel | Clerk public key |
> | `CLERK_SECRET_KEY` | `.env.local` + Vercel | Clerk secret key |
> | `CLERK_JWT_ISSUER_DOMAIN` | Convex env vars | Clerk domain for JWT verification |
>
> The `convex/auth.config.ts` reads the domain and warns if it's missing:
> ```typescript
> const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
> // Warns if not set: "Run: npx convex env set CLERK_JWT_ISSUER_DOMAIN ..."
> ```

---

## Checkpoint

1. Run `git status` -- `.env.local` should NOT appear (it's gitignored)
2. Run `bun dev` + `npx convex dev` -- no errors about missing variables
3. Your Vercel deployment works with production keys
4. Convex Dashboard (production) shows `CLERK_JWT_ISSUER_DOMAIN` in Settings

> **Common mistake:** Committing `.env.local` to Git. If this happens, immediately rotate ALL keys (generate new ones in Clerk and Convex dashboards).

> **Common mistake:** Using the same Convex URL for dev and production. Your production app would read test data. Always use the production URL in Vercel.

> **Common mistake:** Forgetting `NEXT_PUBLIC_` prefix on the Convex URL. Without it, the browser can't access the variable and Convex won't connect.

---

## You Did It!

If you followed all 12 chapters, you now have:
- A **Next.js** app with server and client components
- **Tailwind CSS** + **shadcn/ui** for beautiful styling
- **Clerk** authentication (sign in, sign up, user management)
- **Convex** real-time database (queries, mutations, auto-sync)
- Clerk and Convex **integrated** via JWT tokens
- Deployed to **Vercel** (auto-deploys from GitHub)
- Convex backend on **production**
- A **custom domain** with HTTPS
- **Environment variables** managed securely

You know enough to build real applications. Go build something!

---

**Back to:** [Guide Index](../GUIDE.md)
