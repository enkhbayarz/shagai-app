# Build a Next.js Web App from Scratch

A beginner-friendly guide to building a full-stack web application with **Next.js**, **Convex**, and **Clerk** -- the same stack used in Shagai Harvaa (Mongolian archery scoring app).

## Who is this guide for?

You. The person who has never opened a terminal, never written a line of code, or maybe wrote some HTML once in school. This guide assumes **zero** prior knowledge. Every command is explained. Every concept has a picture.

## What will you build?

By the end of this guide, you will have a **live web application** on the internet with:

- User sign-in / sign-up (authentication)
- A real-time database (data updates instantly across all browsers)
- A custom domain (yourdomain.com)

## The Tech Stack at a Glance

```
  ┌─────────────────────────────────────────────┐
  │              YOUR BROWSER                   │
  │   React 19 + Next.js 16 (the app you see)  │
  │   Tailwind CSS + shadcn/ui (styling)        │
  └────────────────────┬────────────────────────┘
                       │ HTTPS
  ┌────────────────────┴────────────────────────┐
  │              VERCEL (hosting)                │
  │   Runs your Next.js app on the internet     │
  └────────────────────┬────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────┴──────┐          ┌──────┴──────┐
   │    CLERK    │          │   CONVEX    │
   │             │          │             │
   │  Handles    │          │  Handles    │
   │  sign-in,   │          │  database,  │
   │  sign-up,   │          │  queries,   │
   │  users      │          │  real-time  │
   └─────────────┘          └─────────────┘
```

## Chapters

| #   | Chapter                   | What you will learn                                     | Link                                         |
| --- | ------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| 0   | **Prerequisites**         | Installing tools on your computer                       | [Start here](guide/00-prerequisites.md)      |
| 1   | **Create Your App**       | Running your first terminal command to create a project | [Read](guide/01-create-nextjs-app.md)        |
| 2   | **Project Structure**     | Understanding files, folders, and how pages work        | [Read](guide/02-project-structure.md)        |
| 3   | **Tailwind + shadcn**     | Making your app look beautiful                          | [Read](guide/03-tailwind-shadcn.md)          |
| 4   | **Authentication**        | Adding sign-in / sign-up with Clerk                     | [Read](guide/04-clerk-auth.md)               |
| 5   | **Backend Database**      | Setting up Convex for storing and querying data         | [Read](guide/05-convex-backend.md)           |
| 6   | **Auth + DB Integration** | Making Clerk and Convex work together                   | [Read](guide/06-clerk-convex-integration.md) |
| 7   | **Your First Page**       | Building a real page with live data                     | [Read](guide/07-first-page.md)               |
| 8   | **Database Design**       | Designing tables, indexes, and relationships            | [Read](guide/08-database-design.md)          |
| 9   | **Deploy to Vercel**      | Putting your app on the internet                        | [Read](guide/09-deploy-vercel.md)            |
| 10  | **Deploy Convex**         | Moving your backend to production                       | [Read](guide/10-deploy-convex.md)            |
| 11  | **Custom Domain**         | Getting your own .com address                           | [Read](guide/11-custom-domain.md)            |
| 12  | **Environment Variables** | Managing secrets and config safely                      | [Read](guide/12-environment-variables.md)    |

## How to use this guide

**Read in order.** Each chapter builds on the previous one. Don't skip ahead.

## Conventions used in this guide

**Terminal commands** look like this -- type them in your terminal:

```bash
bun dev
```

**"In our Shagai project..."** boxes show how the real Shagai Harvaa app does things:

> **In our Shagai project...**
> We used Bun as our package manager because it installs packages much faster than npm.
> See `shagai/package.json` for our full dependency list.

**Checkpoints** tell you if you're on the right track:

> **Checkpoint:** If you see "Ready in 1.2s" in your terminal, you're good to go.

**Common mistakes** warn you about things that trip up beginners:

> **Common mistake:** Running `bun dev` outside the project folder. Make sure you `cd` into your project first.
