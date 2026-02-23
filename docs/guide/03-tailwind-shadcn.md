# Chapter 3: Styling with Tailwind CSS + shadcn/ui

Time to make your app look good. We'll use **Tailwind CSS** for styling and **shadcn/ui** for pre-built components.

---

## What is Tailwind CSS?

Instead of writing CSS in separate files, Tailwind lets you style things by adding class names directly in your code:

```
  TRADITIONAL CSS:                       TAILWIND CSS:
  ─────────────────                      ──────────────

  /* styles.css */                       No separate file needed!
  .card {
    background: white;                   <div className="
    border-radius: 12px;                   bg-white
    padding: 24px;                         rounded-xl
    box-shadow: 0 4px 6px rgba...          p-6
  }                                        shadow-lg
                                         ">
  <div className="card">                   Hello
  </div>                                 </div>
```

**Why Tailwind?**
- No switching between files (CSS + HTML)
- Class names are descriptive (`bg-white` = white background)
- Impossible to have name conflicts
- Very easy to make responsive designs

---

## Tailwind is Already Set Up

When you created your app with `create-next-app` and chose "Yes" for Tailwind, it was already configured. You can verify by looking at:

**`postcss.config.mjs`:**
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**`app/globals.css`** (top of the file):
```css
@import "tailwindcss";
```

That's it. Tailwind CSS 4 uses this minimal setup.

---

## Tailwind Cheat Sheet

Here are the most common class names you'll use:

```
  SPACING:
    p-4      → padding: 16px (all sides)
    px-6     → padding: 24px (left + right)
    py-2     → padding: 8px (top + bottom)
    m-4      → margin: 16px
    gap-4    → gap: 16px (between flex/grid children)

  SIZING:
    w-full   → width: 100%
    h-14     → height: 56px
    max-w-md → max-width: 448px

  COLORS:
    bg-white         → white background
    bg-blue-500      → medium blue background
    text-gray-700    → dark gray text
    border-gray-200  → light gray border

  TYPOGRAPHY:
    text-lg    → large text (18px)
    text-sm    → small text (14px)
    font-bold  → bold text
    text-center → centered text

  LAYOUT:
    flex            → display: flex
    flex-col        → flex-direction: column
    items-center    → align-items: center
    justify-between → justify-content: space-between
    grid            → display: grid
    grid-cols-2     → 2 columns

  BORDERS & CORNERS:
    rounded-lg   → border-radius: 8px
    rounded-xl   → border-radius: 12px
    rounded-full → fully round (circle)
    border       → 1px border

  EFFECTS:
    shadow-lg   → large shadow
    opacity-50  → 50% transparent
```

**Example -- a card component:**

```tsx
<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
  <h2 className="text-xl font-bold mb-2">Card Title</h2>
  <p className="text-gray-600">Some description text here.</p>
</div>
```

---

## What is shadcn/ui?

shadcn/ui is **not** a normal library. Instead of installing it as a package, it **copies component code directly into your project**. You own the code and can customize it.

```
  NORMAL LIBRARY:                    SHADCN/UI:
  ──────────────                     ─────────

  You install it:                    You copy it:
  bun add some-library               bunx shadcn@latest add button

  Code lives in                      Code lives in YOUR project:
  node_modules/ (hidden)             components/ui/button.tsx (visible)

  Can't change it                    You OWN the code
  easily                             Change anything you want

  ┌─────────────────┐               ┌─────────────────┐
  │  node_modules/  │               │  components/ui/  │
  │  (black box)    │               │  button.tsx  ←── YOU CAN EDIT │
  │                 │               │  card.tsx        │
  └─────────────────┘               │  dialog.tsx      │
                                    │  input.tsx       │
                                    └─────────────────┘
```

**Under the hood:** shadcn/ui components are built with:
- **Radix UI** -- handles accessibility (keyboard navigation, screen readers)
- **Tailwind CSS** -- handles styling

---

## Step 1: Initialize shadcn/ui

```bash
bunx shadcn@latest init
```

When prompted:
- **Style:** New York
- **Base color:** Neutral
- **CSS variables for theming:** Yes

This creates:
- `components.json` -- configuration file for shadcn
- `lib/utils.ts` -- the `cn()` helper function

---

## Step 2: Add components

Each component is added separately. Add the ones you need:

```bash
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add input
bunx shadcn@latest add dialog
bunx shadcn@latest add badge
bunx shadcn@latest add skeleton
```

Each command creates a file in `components/ui/`. For example, `button` creates `components/ui/button.tsx`.

---

## Step 3: Use a component

```tsx
import { Button } from "@/components/ui/button";

export default function MyPage() {
  return (
    <div className="p-8">
      <Button>Default Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="destructive" size="lg">Big Red Button</Button>
    </div>
  );
}
```

The `variant` and `size` props are pre-configured with different styles. Check the component file (`components/ui/button.tsx`) to see all available options.

---

## The cn() Helper

shadcn/ui creates a `lib/utils.ts` file with this function:

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**What it does:** Merges Tailwind class names safely. If you pass conflicting classes, it picks the last one:

```tsx
cn("bg-red-500", "bg-blue-500")
// Result: "bg-blue-500" (blue wins because it came last)

cn("p-4", isLarge && "p-8")
// Result: "p-8" if isLarge is true, "p-4" if false
```

Use `cn()` whenever you conditionally apply classes.

---

## CSS Variables for Theming

`app/globals.css` defines CSS variables that shadcn/ui components use:

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #171717;
  --primary-foreground: #fafafa;
  --destructive: #ef4444;
  /* ... more variables */
}
```

To change your app's color scheme, you modify these variables. Every shadcn/ui component automatically picks up the changes.

---

## Custom Fonts

To add custom fonts, use Google Fonts in your `app/layout.tsx`:

```tsx
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";

const display = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const body = DM_Sans({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"] });
```

Then apply them via CSS classes or CSS variables.

> **In our Shagai project...**
>
> We use three custom fonts:
> ```
>   Bebas Neue   (.font-display)  →  Big headings: "ШАГАЙ ХАРВАА"
>   DM Sans      (body default)   →  All regular text
>   JetBrains Mono (.font-score)  →  Numbers and scores: "17/20"
> ```
>
> We also define custom CSS variables for game-specific colors in `app/globals.css`:
> ```css
> :root {
>   --hit: #22c55e;         /* Green for hits */
>   --miss: #ef4444;        /* Red for misses */
>   --active-glow: #f59e0b; /* Amber for active player */
>   --empty: #d4d4d8;       /* Gray for unshot */
> }
> ```
>
> **Important constraint:** We use hex colors only (no `oklab` or `oklch`) because the html2canvas library (used to generate shareable screenshot images) doesn't support modern color formats.

---

## Checkpoint

You should be able to:
1. Import and render a `<Button>` from `@/components/ui/button`
2. Apply Tailwind classes like `className="bg-blue-500 text-white p-4 rounded-lg"`
3. See styled components at `localhost:3000`

> **Common mistake:** Running `bunx shadcn@latest add button` before `bunx shadcn@latest init`. Initialize first, then add components.

> **Common mistake:** Importing from the wrong path. It's `@/components/ui/button` (with `@/`), not `components/ui/button`.

---

**Next:** [Chapter 4: Authentication with Clerk](04-clerk-auth.md)
