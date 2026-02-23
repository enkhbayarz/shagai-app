# Chapter 10: Deploying Convex to Production

Your Next.js app is on Vercel, but your Convex backend also needs a **production deployment**. Development and production are completely separate.

---

## Development vs Production in Convex

```
  DEVELOPMENT                          PRODUCTION
  ───────────                          ──────────

  ┌──────────────────────┐             ┌──────────────────────┐
  │  npx convex dev      │             │  npx convex deploy   │
  │                      │             │                      │
  │  • Hot reload (auto- │             │  • Stable             │
  │    deploys on save)  │             │  • Manual deploy      │
  │  • Dev database      │             │  • Production database│
  │  • Test data         │             │  • Real user data     │
  │  • For YOUR laptop   │             │  • For the internet   │
  │                      │             │                      │
  │  URL: xxx-dev.cloud  │             │  URL: xxx-prod.cloud  │
  └──────────────────────┘             └──────────────────────┘

  Two completely separate databases.
  Changes in dev do NOT affect production.
  Changes in production do NOT affect dev.
```

---

## Step 1: Deploy to Production

Make sure all your Convex code is saved and working in dev mode. Then run:

```bash
npx convex deploy
```

**The first time**, it will:
1. Ask you to select or create a production deployment
2. Push all your `convex/` functions to production
3. Apply your schema to the production database
4. Give you a production URL

```
  ✓ Deployed to https://your-project-prod.convex.cloud
```

---

## Step 2: Set Production Environment Variables

Your production Convex deployment needs the same environment variables:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
```

**Important:** This command might prompt you to select which deployment (dev or prod). Choose production.

You can also set it explicitly for production:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev --prod
```

---

## Step 3: Update Vercel's NEXT_PUBLIC_CONVEX_URL

In Vercel Dashboard > Your Project > Settings > Environment Variables:

Update `NEXT_PUBLIC_CONVEX_URL` to point to your **production** Convex URL:

```
  NEXT_PUBLIC_CONVEX_URL = https://your-project-prod.convex.cloud
```

Then redeploy (push a commit, or click "Redeploy" in Vercel).

---

## Step 4: Verify in the Convex Dashboard

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Switch to your **Production** deployment (dropdown at the top)
3. Verify:
   - Tables are listed with correct schema
   - Environment variables are set (Settings > Environment Variables)
   - Functions are deployed (Functions tab)

---

## Deploying Updates

Whenever you change Convex functions or schema:

```bash
# Test locally first
npx convex dev          # Make sure it works

# Then deploy to production
npx convex deploy       # Push changes to production
```

This is a manual step. Unlike Vercel (which auto-deploys on git push), Convex requires you to explicitly run `npx convex deploy`.

```
  WORKFLOW:
  1. Edit convex/ files
  2. npx convex dev  ─── test locally
  3. Everything works? ──► npx convex deploy
  4. Push to git     ──► Vercel auto-deploys frontend
```

---

> **In our Shagai project...**
>
> We have two Convex deployments:
> - **Development**: Used during `npx convex dev`, has test data
> - **Production**: Deployed via `npx convex deploy`, has real user data
>
> Both use the same schema and functions, but completely different databases. When we add a new table or modify the schema, we deploy to production and the migration is handled automatically by Convex.

---

## Checkpoint

1. Visit [dashboard.convex.dev](https://dashboard.convex.dev)
2. Switch to the Production deployment
3. See your tables and functions listed
4. Visit your Vercel URL -- data should load from the production Convex backend

> **Common mistake:** Using the development Convex URL in Vercel. Your production app would read from the dev database (test data, not real user data).

> **Common mistake:** Forgetting to set `CLERK_JWT_ISSUER_DOMAIN` on production. Auth will silently fail -- users can sign in via Clerk, but Convex won't recognize them.

> **Common mistake:** Deploying schema changes that break existing data. Test thoroughly in dev first. Convex will warn you about incompatible schema changes.

---

**Next:** [Chapter 11: Custom Domain Setup](11-custom-domain.md)
