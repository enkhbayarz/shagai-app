# Chapter 4: Authentication with Clerk

Authentication means "proving who you are." Your app needs to know **which user** is using it so it can show them their data and keep it private.

---

## Why Not Build Auth Yourself?

```
  BUILDING AUTH YOURSELF:              USING CLERK:
  ──────────────────────               ────────────

  - Hash passwords safely              - Just add <SignInButton>
  - Handle "forgot password"           - Clerk does ALL of this
  - Handle email verification          - OAuth (Google, GitHub) built in
  - Handle OAuth (Google, GitHub)      - Secure by default
  - Prevent brute force attacks        - Takes 15 minutes, not weeks
  - Handle sessions and tokens
  - Handle two-factor auth
  - Keep up with security updates

  Weeks of work                        15 minutes
```

Clerk is an authentication **service**. They handle all the hard security stuff. You just plug it into your app.

---

## How Clerk Works

```
  YOUR APP                           CLERK'S SERVERS
  ────────                           ───────────────

  User clicks "Sign In"
         │
         └───────────────────────►  Clerk shows a sign-in
                                    modal (email + password,
                                    or Google, or GitHub)

                                    User enters credentials
                                    Clerk verifies them

         ◄───────────────────────  Clerk sends back a
                                    secure token (JWT)

  Your app now knows:
    - user.id
    - user.email
    - user.fullName
    - user.imageUrl

  This info is available on
  EVERY page via hooks.
```

---

## Step 1: Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign in
2. Click **"Create Application"**
3. Give it a name (e.g., "My App")
4. Choose sign-in methods:
   - **Email** (always good to have)
   - **Google** (most users prefer this)
   - **GitHub** (great for developer tools)
5. Click **"Create"**

---

## Step 2: Get Your API Keys

In the Clerk Dashboard, go to **API Keys**. You'll see two keys:

```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_abc123...
  CLERK_SECRET_KEY                  = sk_test_xyz789...
```

- **Publishable key** (`pk_`): Safe to expose. Used in browser code.
- **Secret key** (`sk_`): Must NEVER be exposed. Server-side only.

---

## Step 3: Install Clerk

```bash
bun add @clerk/nextjs
```

---

## Step 4: Create Your .env.local File

In the root of your project (next to `package.json`), create a file called `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

**What is .env.local?**
- A file that stores **secret configuration** (API keys, passwords)
- It's automatically **excluded from Git** (listed in `.gitignore`)
- Your secrets stay on YOUR computer, never uploaded to GitHub
- Next.js automatically reads it when you run `bun dev`

> **Common mistake:** Committing `.env.local` to GitHub. If you accidentally do this, your keys are exposed. Immediately rotate them in the Clerk Dashboard.

---

## Step 5: Add ClerkProvider to Your Root Layout

Open `app/layout.tsx` and wrap everything in `<ClerkProvider>`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**What does ClerkProvider do?** It makes authentication available to your entire app. Any component can now use Clerk's hooks and components.

```
  ┌─── ClerkProvider ──────────────────────────┐
  │                                            │
  │  Makes auth available EVERYWHERE inside:   │
  │                                            │
  │  ┌─── html ─────────────────────────────┐  │
  │  │  ┌─── body ───────────────────────┐  │  │
  │  │  │                                │  │  │
  │  │  │  All your pages can now use:   │  │  │
  │  │  │   - useUser()                  │  │  │
  │  │  │   - useAuth()                  │  │  │
  │  │  │   - <SignInButton>             │  │  │
  │  │  │   - <SignedIn> / <SignedOut>   │  │  │
  │  │  │                                │  │  │
  │  │  └────────────────────────────────┘  │  │
  │  └──────────────────────────────────────┘  │
  └────────────────────────────────────────────┘
```

---

## Step 6: Add Sign-In and Sign-Up Buttons

Now let's show different content based on whether the user is signed in:

```tsx
"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* Show this when user is NOT signed in */}
      <SignedOut>
        <h1 className="text-4xl font-bold mb-8">Welcome to My App</h1>
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="border px-6 py-3 rounded-lg">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>

      {/* Show this when user IS signed in */}
      <SignedIn>
        <h1 className="text-4xl font-bold mb-4">You're signed in!</h1>
        <UserButton />  {/* Shows avatar with dropdown menu */}
      </SignedIn>
    </div>
  );
}
```

**How it works:**
- `<SignedOut>` -- only renders its children when the user is NOT signed in
- `<SignedIn>` -- only renders its children when the user IS signed in
- `<SignInButton mode="modal">` -- clicking opens a Clerk sign-in popup
- `<UserButton />` -- shows the user's avatar with a dropdown (sign out, manage account)

---

## Step 7: Access User Data in Your Code

```tsx
"use client";

import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Hello, {user.fullName}!</h1>
      <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
      <img src={user.imageUrl} alt="Avatar" />
    </div>
  );
}
```

---

> **In our Shagai project...**
>
> In `app/layout.tsx`, ClerkProvider wraps the entire app. Inside that, ConvexClientProvider provides the database. The `LayoutWrapper` component then handles layout routing:
>
> ```tsx
> <ClerkProvider>
>   <html lang="mn">
>     <body>
>       <ConvexClientProvider>
>         <LayoutWrapper>{children}</LayoutWrapper>
>       </ConvexClientProvider>
>     </body>
>   </html>
> </ClerkProvider>
> ```
>
> In `components/layout/LayoutWrapper.tsx`, we check if the user is signed in:
> - **Signed out**: Show a landing page with sign-in / sign-up buttons
> - **Signed in**: Show the app with a sidebar navigation
>
> Clerk's UI is displayed in Mongolian language to match our app.

---

## Checkpoint

1. See a "Sign In" button on your page
2. Click it -- Clerk's modal opens
3. Sign in with email or Google
4. See your name and avatar displayed after sign-in
5. Click the avatar -- see the dropdown with "Sign Out"

> **Common mistake:** Forgetting `.env.local`. Without API keys, Clerk shows nothing and no errors appear -- the buttons just won't work.

> **Common mistake:** Using `useUser()` in a file without `"use client"` at the top. Hooks only work in Client Components.

---

**Next:** [Chapter 5: Setting Up Convex Backend](05-convex-backend.md)
