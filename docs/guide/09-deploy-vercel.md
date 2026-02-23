# Chapter 9: Deploying to Vercel

Your app works on `localhost:3000`. Now let's put it on the real internet so anyone can visit it.

---

## Development vs Production

```
  DEVELOPMENT (your laptop)          PRODUCTION (the internet)
  ─────────────────────────          ────────────────────────

  localhost:3000                     yourapp.vercel.app

  Only YOU can see it                ANYONE in the world can visit

  Stops when you close               Runs 24/7, even when
  the terminal                       your laptop is off

  Uses .env.local for                Uses Vercel environment
  secret keys                        variables for secret keys

  Test data                          Real data, real users
```

---

## What is Vercel?

Vercel is the company that **makes Next.js**. They also offer free hosting for Next.js apps. When you push code to GitHub, Vercel automatically builds and deploys it.

```
  ┌────────────┐       ┌────────────┐       ┌──────────────────┐
  │   GitHub   │       │   Vercel   │       │    Internet      │
  │            │       │            │       │                  │
  │  You push  │──────►│  Detects   │──────►│  Your site is    │
  │  code      │       │  Next.js   │       │  LIVE at         │
  │            │       │  Builds    │       │  app.vercel.app  │
  │            │       │  Deploys   │       │                  │
  └────────────┘       └────────────┘       └──────────────────┘

  Every git push = automatic new deployment!
  Push to main   = production deploy
  Push to branch = preview deploy (temporary URL)
```

---

## Step 1: Push Your Code to GitHub

If you haven't already, create a GitHub repository and push your code.

### Create a repo on GitHub

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon in the top right > "New repository"
3. Name it (e.g., "my-app")
4. Keep it **Public** or **Private** (both work with Vercel)
5. Do NOT initialize with README (you already have code)
6. Click "Create repository"

### Push your local code

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit"

# Add the remote repository
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# Push to GitHub
git push -u origin main
```

> **Common mistake:** Make sure `.env.local` is in your `.gitignore` file. It should be there by default, but double-check. You should NEVER push secret keys to GitHub.

---

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use "Sign in with GitHub")
2. Click **"New Project"**
3. You'll see your GitHub repositories listed. Click **"Import"** on your repo.
4. Vercel auto-detects it's a Next.js project

---

## Step 3: Configure Build Settings

Vercel usually auto-detects everything, but verify:

```
  Framework Preset:  Next.js  (auto-detected)
  Root Directory:    ./       (or shagai/ if monorepo)
  Build Command:     next build  (or bun run build)
  Install Command:   bun install  (if using Bun)
```

If your project is inside a subfolder (like our Shagai project is in `shagai/`), set the **Root Directory** to that folder.

---

## Step 4: Set Environment Variables

This is the most important step. Click **"Environment Variables"** and add:

```
  NAME                                    VALUE
  ────                                    ─────
  NEXT_PUBLIC_CONVEX_URL                  https://your-project.convex.cloud
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY       pk_live_... (LIVE key, not test!)
  CLERK_SECRET_KEY                        sk_live_... (LIVE key, not test!)
```

**Important:**
- Use **live** keys for production (`pk_live_`, `sk_live_`), not test keys
- Find live keys in Clerk Dashboard > API Keys > Production
- The Convex URL should point to your **production** Convex deployment (see Chapter 10)

```
  ┌─────────────────────────────────────────────┐
  │  NEXT_PUBLIC_ prefix = visible in browser   │
  │  (safe for publishable keys)                │
  │                                             │
  │  NO prefix = server-only                    │
  │  (required for secret keys)                 │
  └─────────────────────────────────────────────┘
```

---

## Step 5: Deploy!

Click **"Deploy"** and wait about 1-2 minutes. Vercel will:

1. Clone your repo
2. Install dependencies (`bun install`)
3. Build the project (`next build`)
4. Deploy to their CDN (global network)
5. Give you a URL: `https://your-app.vercel.app`

Visit the URL. Your app is live!

---

## Automatic Deployments

From now on, every time you push to GitHub:

```
  git add .
  git commit -m "Add new feature"
  git push
```

Vercel automatically:
1. Detects the push
2. Builds the new version
3. Deploys it (zero downtime)

Push to `main` = production deployment
Push to any other branch = preview deployment (temporary URL for testing)

---

## The Vercel Dashboard

At [vercel.com/dashboard](https://vercel.com/dashboard) you can see:
- All your deployments (current + previous)
- Build logs (useful for debugging errors)
- Analytics (page views, performance)
- Environment variables
- Domain settings

---

> **In our Shagai project...**
>
> The project is deployed on Vercel with:
> - Bun as the package manager (`bun install` + `bun run build`)
> - A custom domain (configured in Chapter 11)
> - Production Clerk keys (live mode, real OAuth with Google)
> - Production Convex URL pointing to the production deployment

---

## Checkpoint

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. See your app running on the real internet
3. Sign in via Clerk (should work with live keys)
4. Data should load from Convex

> **Common mistake:** Forgetting environment variables. Without them, the app deploys but shows a blank page or auth errors. Check the build logs in Vercel for error details.

> **Common mistake:** Using test Clerk keys (`pk_test_`, `sk_test_`) in production. They work, but are meant for development only. Users can't use real OAuth (Google, GitHub) with test keys.

> **Common mistake:** Build errors. If the build fails, run `bun run build` locally first to see the same errors. Fix them, push, and Vercel will rebuild.

---

**Next:** [Chapter 10: Deploy Convex to Production](10-deploy-convex.md)
