# Chapter 2: Understanding the Project Structure

This is the most important chapter. Understanding how Next.js organizes files is the foundation for everything else.

---

## The App Router -- Files Become URLs

In Next.js, **every folder inside `app/` that contains a `page.tsx` file becomes a URL** in your website. The folder structure IS your routing.

```
  FILE SYSTEM                         URL IN BROWSER
  ───────────                         ──────────────

  app/
  ├── page.tsx                   →    yoursite.com/
  │
  ├── about/
  │   └── page.tsx               →    yoursite.com/about
  │
  ├── blog/
  │   ├── page.tsx               →    yoursite.com/blog
  │   └── [slug]/
  │       └── page.tsx           →    yoursite.com/blog/any-post-title
  │
  └── settings/
      └── page.tsx               →    yoursite.com/settings

  RULE: folder + page.tsx = URL
```

**Try it now:** Create a file at `app/hello/page.tsx` with this content:

```tsx
export default function HelloPage() {
  return <h1>Hello from a new page!</h1>;
}
```

Visit `localhost:3000/hello` -- you'll see your new page.

---

## Layouts -- The Russian Doll Pattern

A **layout** wraps your pages. It's the frame that stays the same when you navigate between pages (like a sidebar or navigation bar).

```
  ┌─── app/layout.tsx (ROOT LAYOUT) ─────────────────┐
  │                                                   │
  │  <html>                                           │
  │   <body>                                          │
  │    ┌─── app/dashboard/layout.tsx (NESTED) ──────┐ │
  │    │                                            │ │
  │    │  <Sidebar>                                 │ │
  │    │    ┌─── page.tsx ────────────────────────┐  │ │
  │    │    │                                    │  │ │
  │    │    │  The actual page content changes   │  │ │
  │    │    │  but the sidebar stays!            │  │ │
  │    │    │                                    │  │ │
  │    │    └────────────────────────────────────┘  │ │
  │    │  </Sidebar>                                │ │
  │    │                                            │ │
  │    └────────────────────────────────────────────┘ │
  │   </body>                                         │
  │  </html>                                          │
  └───────────────────────────────────────────────────┘

  Layouts NEST inside each other like Russian dolls.
  The root layout (app/layout.tsx) wraps EVERY page.
  Nested layouts only wrap pages in their folder.
```

**The root layout** (`app/layout.tsx`) is required. It must contain `<html>` and `<body>` tags. Every page in your app is rendered inside this layout.

```tsx
// app/layout.tsx -- the ROOT layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

The `children` prop is whatever page or nested layout is being displayed. When you visit `/about`, `children` becomes the content of `app/about/page.tsx`.

---

## Special Files

Next.js looks for these specific filenames inside `app/` folders:

```
  app/
  ├── layout.tsx      ← Wraps pages. Shared UI (nav, sidebar).
  │                     Does NOT re-render on navigation.
  │
  ├── page.tsx        ← The actual page content. This is what
  │                     the user sees at that URL.
  │
  ├── loading.tsx     ← Shown while the page is loading.
  │                     Next.js shows this automatically.
  │
  ├── error.tsx       ← Shown if the page crashes. A safety net.
  │
  ├── not-found.tsx   ← Custom 404 page. Shown when a URL
  │                     doesn't match any page.
  │
  └── globals.css     ← Global CSS. Imported once in root layout.
                        Applies to every page.
```

You don't need all of these. Only `layout.tsx` (root) and `page.tsx` files are required.

---

## The components/ Folder

Components are reusable building blocks. They live in `components/`, NOT in `app/`.

```
  components/
  ├── ui/              ← Generic, reusable (Button, Card, Input)
  │                      from shadcn/ui
  │
  ├── series/          ← Feature-specific components
  │                      (things only used in one feature)
  │
  └── providers/       ← Context providers (wrap the whole app
                         to share data with all pages)

  RULE: Pages go in app/. Components go in components/.
  Pages are specific URLs. Components are reusable pieces.
```

---

## "use client" vs Server Components

This is a concept unique to Next.js 13+ (App Router). By default, all components are **Server Components**.

```
  ┌────────────────────────────┐    ┌─────────────────────────────┐
  │   SERVER COMPONENT         │    │   CLIENT COMPONENT          │
  │   (default -- no keyword)  │    │   ("use client" at top)     │
  │                            │    │                             │
  │  - Runs on the server      │    │  - Runs in the browser      │
  │  - CANNOT use useState     │    │  - CAN use useState         │
  │  - CANNOT use onClick      │    │  - CAN use onClick          │
  │  - CANNOT use useEffect    │    │  - CAN use useEffect        │
  │  - Faster first page load  │    │  - Interactive (buttons,    │
  │  - Can access databases    │    │    forms, animations)       │
  │    directly                │    │  - Needed for most UI       │
  └────────────────────────────┘    └─────────────────────────────┘
```

**When do you add `"use client"`?**

Add it at the very top of a file when your component needs:
- `useState`, `useEffect`, or any React hook
- `onClick`, `onChange`, or any event handler
- A browser-only library (Framer Motion, html2canvas, etc.)
- Convex hooks (`useQuery`, `useMutation`)

```tsx
"use client";  // ← This line makes it a Client Component

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

**If you don't need any of those things, leave it as a Server Component** (no keyword needed). Server Components are faster because they don't send JavaScript to the browser.

---

## Dynamic Routes -- the [id] Pattern

When you wrap a folder name in square brackets, it becomes a **variable** that matches any value:

```
  app/series/game/[id]/page.tsx

  This matches:
    /series/game/abc123    →  id = "abc123"
    /series/game/xyz789    →  id = "xyz789"
    /series/game/anything  →  id = "anything"
```

Inside the page, you access the value with `useParams`:

```tsx
"use client";
import { useParams } from "next/navigation";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id; // "abc123", "xyz789", etc.

  return <h1>Game: {gameId}</h1>;
}
```

---

## Path Aliases -- the @/ Shortcut

Instead of writing long relative paths with `../../../`:

```tsx
// Without alias (ugly, fragile)
import { Button } from "../../../components/ui/button";

// With @/ alias (clean, always works)
import { Button } from "@/components/ui/button";
```

The `@/` always means **"the root of your project"**. This is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Use `@/` for all your imports. It works from any file, no matter how deeply nested.

---

> **In our Shagai project...**
>
> Our app has many routes:
> ```
> app/
> ├── page.tsx                    →  / (dashboard + leaderboard)
> ├── series/setup/page.tsx       →  /series/setup (player setup)
> ├── series/game/[id]/page.tsx   →  /series/game/abc123 (active game)
> ├── team/setup/page.tsx         →  /team/setup (team game setup)
> ├── team/game/[id]/page.tsx     →  /team/game/xyz789 (team game)
> ├── profile/[username]/page.tsx →  /profile/john (player profile)
> ├── live/page.tsx               →  /live (live games browser)
> ├── s/[id]/page.tsx             →  /s/abc123 (public share page)
> └── teams/join/[code]/page.tsx  →  /teams/join/XY12 (join via code)
> ```
>
> We also use a `LayoutWrapper` component that checks the current URL and decides which layout to show:
> - **Full screen** (no sidebar): share pages `/s/`, `/team/s/`
> - **Collapsed sidebar**: game pages `/series/game`, `/team/game`
> - **Full sidebar**: everything else
>
> See `components/layout/LayoutWrapper.tsx` for the implementation.

---

## Checkpoint

You should be able to:
1. Create a new file `app/test/page.tsx` with a simple component
2. Visit `localhost:3000/test` and see it
3. Delete the file and see the page disappear

If that works, you understand the core concept: **file = URL**.

> **Common mistake:** Naming a file `Page.tsx` instead of `page.tsx`. The filename must be **lowercase** `page.tsx`. Next.js is case-sensitive.

> **Common mistake:** Forgetting `export default`. Your page component must be the **default export** of the file, or Next.js won't find it.

---

**Next:** [Chapter 3: Styling with Tailwind CSS + shadcn/ui](03-tailwind-shadcn.md)
