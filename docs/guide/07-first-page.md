# Chapter 7: Building Your First Page with Real-Time Data

You have all the pieces: Next.js (frontend), Clerk (auth), Convex (database). Now let's build a real page that **reads and writes data in real-time**.

---

## What We'll Build

A simple task list that syncs across browser tabs instantly:

```
  ┌──────────────────────────────────────────┐
  │  MY TASKS                                │
  │                                          │
  │  ┌────────────────────────┐  ┌────────┐  │
  │  │ Buy groceries...       │  │  ADD   │  │
  │  └────────────────────────┘  └────────┘  │
  │                                          │
  │  ✓ Set up Convex                         │
  │  ✓ Learn Next.js                         │
  │  ○ Build something amazing               │
  │                                          │
  │  3 tasks, 2 completed                    │
  └──────────────────────────────────────────┘
```

---

## Step 1: Make Sure Your Backend is Ready

From Chapter 5, you should have `convex/tasks.ts` with:
- `list` query (reads all tasks)
- `create` mutation (adds a task)
- `toggle` mutation (marks complete/incomplete)

And `convex/schema.ts` with a `tasks` table.

Make sure `npx convex dev` is running.

---

## Step 2: Create the Page

Create `app/tasks/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TasksPage() {
  const [newTask, setNewTask] = useState("");

  // REACTIVE QUERY: auto-updates when data changes
  const tasks = useQuery(api.tasks.list);

  // MUTATION FUNCTIONS
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);

  // Handle form submission
  const handleAdd = async () => {
    if (!newTask.trim()) return;
    await createTask({ text: newTask.trim() });
    setNewTask(""); // Clear the input
  };

  // Loading state: useQuery returns undefined while loading
  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

      {/* Add task form */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="What needs to be done?"
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Add
        </button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-gray-400 text-center">No tasks yet. Add one above!</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task._id}
              onClick={() => toggleTask({ id: task._id })}
              className="flex items-center gap-3 p-3 rounded-lg border
                         cursor-pointer hover:bg-gray-50"
            >
              <span className="text-xl">
                {task.isCompleted ? "✓" : "○"}
              </span>
              <span className={task.isCompleted ? "line-through text-gray-400" : ""}>
                {task.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Stats */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        {tasks.length} tasks, {tasks.filter((t) => t.isCompleted).length} completed
      </p>
    </div>
  );
}
```

Visit `localhost:3000/tasks` -- you should see the task list.

---

## Understanding the Data Flow

```
  ┌─────── TasksPage Component ──────────────────────────┐
  │                                                      │
  │  const tasks = useQuery(api.tasks.list)              │
  │       │                                              │
  │       ├── undefined  →  Show "Loading tasks..."      │
  │       ├── []         →  Show "No tasks yet"          │
  │       └── [{...}]    →  Show the task list           │
  │                                                      │
  │  When you click "Add":                               │
  │  createTask({ text: "Buy milk" })                    │
  │       │                                              │
  │       └──► Convex inserts the row                    │
  │            Convex notifies useQuery                   │
  │            React re-renders with new data             │
  │            NO REFRESH NEEDED!                         │
  │                                                      │
  │  When you click a task:                              │
  │  toggleTask({ id: task._id })                        │
  │       │                                              │
  │       └──► Convex updates the row                    │
  │            Same auto-update cycle                     │
  └──────────────────────────────────────────────────────┘
```

---

## The Three States of useQuery

Every `useQuery` call goes through these states:

```
  1. LOADING (undefined):
     useQuery just started. Data hasn't arrived yet.
     Show a loading spinner or skeleton.

  2. LOADED (value):
     Data arrived! Could be an empty array [],
     a single object, or null.
     Render the actual content.

  3. UPDATED (new value):
     Something changed in the database.
     useQuery automatically gives you the new data.
     React re-renders. No code needed from you.
```

**Always handle the loading state.** If `tasks === undefined`, the data hasn't arrived yet. Don't try to call `.map()` on `undefined`.

---

## The "skip" Pattern

Sometimes you don't want a query to run until you have certain data. Use the string `"skip"`:

```tsx
const [searchQuery, setSearchQuery] = useState("");

// Only search when the user has typed 2+ characters
const results = useQuery(
  api.users.search,
  searchQuery.length >= 2
    ? { query: searchQuery }     // Run the query with these args
    : "skip"                     // Don't run the query yet
);
```

When you pass `"skip"`, the query doesn't run at all. `results` will be `undefined`. Once the condition is met, it runs automatically.

---

## Using shadcn/ui Components

Let's improve the page with shadcn/ui (from Chapter 3):

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// In your JSX:
<Card className="max-w-md mx-auto">
  <CardHeader>
    <CardTitle>My Tasks</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex gap-2 mb-6">
      <Input
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="What needs to be done?"
      />
      <Button onClick={handleAdd}>Add</Button>
    </div>
    {/* ... task list */}
  </CardContent>
</Card>
```

---

> **In our Shagai project...**
>
> The dashboard page (`app/page.tsx`) uses multiple queries in parallel:
> ```tsx
> const leaderboard = useQuery(api.dashboard.getLeaderboard, { limit: 50 });
> const liveStats = useQuery(api.dashboard.getLiveStats, {});
> ```
> Both queries auto-update. When a game finishes, the leaderboard re-sorts itself and the live stats counter updates -- instantly, across all connected browsers.
>
> The setup page (`app/series/setup/page.tsx`) uses the "skip" pattern for user search:
> ```tsx
> const searchResults = useQuery(
>   api.users.search,
>   searchQuery ? { query: searchQuery } : "skip"
> );
> ```
>
> When creating a game, we call `useMutation(api.games.create)` and navigate to the new game page:
> ```tsx
> const createGame = useMutation(api.games.create);
> const gameId = await createGame({ playerCount: 2, players: [...] });
> router.push(`/series/game/${gameId}`);
> ```

---

## Checkpoint

1. Visit `localhost:3000/tasks`
2. Add a task -- it appears in the list
3. Click a task -- it toggles complete/incomplete
4. **Open a second browser tab** to `localhost:3000/tasks`
5. Add a task in one tab -- it appears in the OTHER tab instantly

If step 5 works, you've experienced real-time data sync. This is the power of Convex.

> **Common mistake:** Forgetting `"use client"` at the top. Without it, `useState` and `useQuery` will cause errors.

> **Common mistake:** Not handling `tasks === undefined`. The first render always has `undefined` while data loads. Calling `.map()` on `undefined` crashes your app.

---

**Next:** [Chapter 8: Database Design Basics](08-database-design.md)
