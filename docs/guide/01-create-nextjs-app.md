# Chapter 1: Creating Your Next.js App

Time to create your first project. By the end of this chapter, you'll have a working website running on your computer.

## What is Next.js?

```
  ┌───────────────────────────────────────────────────┐
  │                    NEXT.JS                        │
  │                                                   │
  │  Your Code (.tsx files)                           │
  │       │                                           │
  │       ▼                                           │
  │  ┌──────────────────┐                             │
  │  │   Build Machine  │  Compiles, optimizes,       │
  │  │                  │  bundles your code           │
  │  └────────┬─────────┘                             │
  │           ▼                                       │
  │  A fast, production-ready website                 │
  │  (HTML + CSS + JavaScript)                        │
  └───────────────────────────────────────────────────┘

  Think of Next.js as a FACTORY:
  - You feed it simple code files
  - It turns them into a fast, optimized website
  - It handles routing (URLs), optimization, and serving
```

**What is React?** React is a library for building user interfaces out of reusable "building blocks" called **components**. A button is a component. A card is a component. A whole page is a component made of smaller components.

**Next.js is built ON TOP of React.** It adds features that React alone doesn't have: page routing, server-side rendering, image optimization, and more.

---

## Step 1: Open your Terminal and go to where you want the project

```bash
# See where you currently are
pwd

# Go to your Desktop (or wherever you keep projects)
cd ~/Desktop

# Create a projects folder if you want (optional)
mkdir my-projects
cd my-projects
```

**What these commands mean:**

- `pwd` = "Print Working Directory" -- shows your current location
- `cd` = "Change Directory" -- moves you into a folder
- `mkdir` = "Make Directory" -- creates a new folder
- `~` = your home folder (e.g., `/Users/yourname` on Mac)

---

## Step 2: Create the app

```bash
bunx create-next-app@latest my-app
```

**What each word means:**

- `bunx` = "Run a package temporarily without permanently installing it"
- `create-next-app` = The official Next.js project generator
- `@latest` = Use the newest version available
- `my-app` = The name of your project folder (you can pick any name)

---

## Step 3: Answer the prompts

The generator asks you questions. Here's what to choose:

```
  ┌──────────────────────────────────────────────────┐
  │  Would you like to use TypeScript?        → Yes  │
  │  Would you like to use ESLint?            → Yes  │
  │  Would you like to use Tailwind CSS?      → Yes  │
  │  Would you like a `src/` directory?       → No   │
  │  Would you like to use App Router?        → Yes  │
  │  Would you like to customize import alias → Yes  │
  │  What import alias would you like?        → @/*  │
  └──────────────────────────────────────────────────┘
```

**Why these choices?**

- **TypeScript: Yes** -- Catches bugs before you run your code. Like spell-check for programming.
- **ESLint: Yes** -- Warns you about common mistakes in your code.
- **Tailwind CSS: Yes** -- Makes styling easy (more in Chapter 3).
- **src/ directory: No** -- Simpler folder structure. Less nesting.
- **App Router: Yes** -- The modern way Next.js handles pages. The older "Pages Router" is being phased out.
- **Turbopack: Yes** -- Makes the development server start faster.
- **Import alias @/\*: Yes** -- Lets you write clean imports like `@/components/Button` instead of `../../../components/Button`.

---

## Step 4: Enter the project and start the development server

```bash
cd my-app
bun dev
```

You should see output like:

```
  ▲ Next.js 16.1.6
  - Local:   http://localhost:3000

  ✓ Starting...
  ✓ Ready in 1.2s
```

Now open your web browser and go to: **http://localhost:3000**

You should see the default Next.js welcome page with a big Next.js logo.

> **What is localhost:3000?** "localhost" means "this computer". ":3000" is the port number (like a door number on a building). So you're visiting a website running on your own computer, on door 3000.

---

## Step 5: What just happened?

The `create-next-app` command created this folder structure for you:

```
  my-app/
  ├── app/                  ← Your pages and styles live here
  │   ├── layout.tsx        ← The "frame" around every page
  │   ├── page.tsx          ← The home page (what you see at /)
  │   └── globals.css       ← Global styles for the whole app
  │
  ├── public/               ← Static files (images, icons)
  │
  ├── package.json          ← List of all packages your project uses
  ├── tsconfig.json         ← TypeScript configuration
  ├── next.config.ts        ← Next.js configuration
  ├── postcss.config.mjs    ← CSS processing configuration
  │
  ├── node_modules/         ← All downloaded packages (DO NOT EDIT)
  ├── .gitignore            ← Tells Git which files to ignore
  └── bun.lock              ← Exact versions of all packages
```

The most important file right now is **`app/page.tsx`** -- that's what you see in your browser. Try editing it:

1. Open `my-app/` in VS Code: `code .` (or File > Open Folder)
2. Open `app/page.tsx`
3. Change the text inside to: `<h1>Hello World!</h1>`
4. Save the file (Cmd+S or Ctrl+S)
5. Look at your browser -- it updated automatically!

> **In our Shagai project...**
> We ran `bunx create-next-app@latest shagai` with the exact same options. The project lives in the `shagai/` directory. Our `package.json` lists all the dependencies we've added since creation: Convex, Clerk, Framer Motion, shadcn/ui, Recharts, and more.

---

## Checkpoint

If you see your changes live at `localhost:3000` without refreshing the browser, you're on track. This is called **Hot Module Replacement (HMR)** -- the development server watches your files and instantly updates the browser when you save.

> **Common mistake:** Running `bun dev` from the wrong folder. If you see errors, make sure you're inside `my-app/` (the folder with `package.json`). Use `pwd` to check where you are.

> **Common mistake:** Port 3000 already in use. If another app is using port 3000, you'll see an error. Either close that other app, or run: `bun dev --port 3001`

---

**Next:** [Chapter 2: Understanding the Project Structure](02-project-structure.md)
