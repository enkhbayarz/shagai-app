# Chapter 0: Prerequisites -- Getting Your Computer Ready

Before you write a single line of code, you need to set up your computer with the right tools. Think of it like setting up a workshop before building furniture.

```
  ┌─────────────────────────────────────────────┐
  │              YOUR COMPUTER                  │
  │                                             │
  │  ┌───────────┐    ┌──────────────────────┐  │
  │  │ Terminal   │    │ Code Editor          │  │
  │  │           │    │ (VS Code)            │  │
  │  │ You type   │    │ Where you write      │  │
  │  │ commands   │    │ and edit code         │  │
  │  │ here       │    │                      │  │
  │  └───────────┘    └──────────────────────┘  │
  │                                             │
  │  ┌───────────┐    ┌──────────────────────┐  │
  │  │ Node.js   │    │ Git                  │  │
  │  │           │    │                      │  │
  │  │ Runs your │    │ Saves versions of    │  │
  │  │ JavaScript│    │ your code (like      │  │
  │  │ code      │    │ "undo" on steroids)  │  │
  │  └───────────┘    └──────────────────────┘  │
  │                                             │
  │  ┌───────────┐                              │
  │  │ Bun       │                              │
  │  │           │                              │
  │  │ Installs  │                              │
  │  │ packages  │                              │
  │  │ (code     │                              │
  │  │ libraries)│                              │
  │  └───────────┘                              │
  └─────────────────────────────────────────────┘
```

---

## What is a Terminal?

A terminal is a text-based way to talk to your computer. Instead of clicking buttons and icons, you **type commands** and press Enter.

```
  ┌───── Terminal ─────────────────────────────┐
  │                                            │
  │  $ node --version                          │
  │  v22.0.0                                   │
  │                                            │
  │  $ _  (cursor blinks here, waiting for     │
  │        your next command)                   │
  │                                            │
  └────────────────────────────────────────────┘
```

**How to open the Terminal:**

- **Mac:** Press `Cmd + Space`, type "Terminal", press Enter
- **Windows:** Press `Win` key, type "PowerShell", press Enter
- **Linux:** Press `Ctrl + Alt + T`

---

## Step 1: Install Node.js

**What is Node.js?** It's a program that lets your computer run JavaScript code. JavaScript is the programming language that powers almost all websites.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Click the big green **LTS** button (LTS = Long Term Support = the stable version)
3. Run the installer, click "Next" through everything
4. Open your Terminal and type:

```bash
node --version
```

You should see something like:

```
v22.12.0
```

The exact number doesn't matter, as long as it's **v18 or higher**.

> **Common mistake:** If you see "command not found", close your terminal completely and open a new one. Node.js needs a fresh terminal to be recognized.

---

## Step 2: Install Bun

**What is Bun?** It's a tool that downloads and manages code libraries (called "packages") that other people wrote. Instead of writing everything from scratch, you use packages. Bun is like an app store for code.

**Why Bun instead of npm?** npm comes with Node.js and does the same thing, but Bun is **much faster**. For a project with 50+ packages, Bun can save you minutes of waiting.

**Mac / Linux:**

```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows (PowerShell as Administrator):**

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

After installing, **close and reopen your terminal**, then verify:

```bash
bun --version
```

You should see something like:

```
1.1.38
```

> **In our Shagai project...**
> We use Bun for all commands: `bun dev` to run the app, `bun run build` to build for production, `bun add <package>` to install new packages. See `shagai/package.json` for the full list of packages we use.

---

## Step 3: Install Git

**What is Git?** It tracks every change you make to your code. Think of it like an unlimited "undo" button that remembers every version of every file you've ever saved. It also lets you upload your code to GitHub, which you'll need for deployment.

**Mac:** Git usually comes pre-installed. Check:

```bash
git --version
```

If not installed, it will prompt you to install Xcode Command Line Tools. Click "Install".

**Windows:** Download from [https://git-scm.com](https://git-scm.com) and run the installer. Use all default options.

**After installing**, set your name and email (Git uses this to label your changes):

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## Step 4: Install VS Code

**What is VS Code?** A free code editor made by Microsoft. It's where you'll write and edit all your code. You can use any editor, but VS Code is the most popular and has the best support for the tools we'll use.

1. Go to [https://code.visualstudio.com](https://code.visualstudio.com)
2. Download and install
3. Open VS Code
4. Install these extensions (click the square icon in the left sidebar, then search):
   - **Tailwind CSS IntelliSense** -- auto-completes Tailwind class names
   - **Prettier** -- auto-formats your code to look clean
   - **ES7+ React/Redux Snippets** -- shortcuts for writing React code

---

## Step 5: Create Accounts

You'll need accounts on these four services. All have **free tiers** that are more than enough.

| Service    | URL                              | What it does                                    |
| ---------- | -------------------------------- | ----------------------------------------------- |
| **GitHub** | [github.com](https://github.com) | Stores your code online. Needed for deployment. |
| **Clerk**  | [clerk.com](https://clerk.com)   | Handles user sign-in / sign-up for your app.    |
| **Convex** | [convex.dev](https://convex.dev) | Your database and backend (stores data).        |
| **Vercel** | [vercel.com](https://vercel.com) | Hosts your app on the internet.                 |

Sign up for each one now. You can use "Sign in with GitHub" on Clerk, Convex, and Vercel to make it easier.

---

## Checkpoint

Run these four commands in your terminal. If all show version numbers, you're ready for Chapter 1:

```bash
node --version     # Should show v18+ or v22+
bun --version      # Should show 1.x
git --version      # Should show 2.x
code --version     # Should show 1.x (if VS Code is in PATH)
```

> **Common mistake:** On Mac, `code --version` might not work. Open VS Code, press `Cmd + Shift + P`, type "shell command", and click "Install 'code' command in PATH".

---

**Next:** [Chapter 1: Create Your Next.js App](01-create-nextjs-app.md)
