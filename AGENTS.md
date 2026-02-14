# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
Шагай Харваа (Shagai Kharvaa) - A Mongolian traditional archery score tracking application. The app supports two game modes:
- **Series games** (Цуваа): Individual players shoot 20 rounds each, tracked with ELO ratings
- **Team games** (Багийн харваа): 4v4, 5v5, or 6v6 team matches with sets, phases, and golden point tiebreakers

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Backend**: Convex (real-time database)
- **Auth**: Clerk (integrated with Convex via `ConvexProviderWithClerk`)
- **UI**: Tailwind CSS 4 + shadcn/ui components
- **Package manager**: Bun (use `bun` commands, not npm)
- **Language**: The UI is in Mongolian (lang="mn")

## Development Commands
```bash
bun dev              # Start Next.js + Convex dev servers
bun build            # Production build
bun lint             # Run ESLint
npx convex dev       # Run Convex backend separately (if needed)
npx convex deploy    # Deploy Convex functions to production
```

## Architecture

### App Routes (`app/`)
- `/` - Home dashboard with live stats and top players
- `/series/setup` - Create individual series game
- `/series/game/[id]` - Active series game view
- `/team/setup` - Create team game
- `/team/game/[id]` - Active team game view
- `/live` & `/live/[id]` - Spectator views for live games
- `/s/[id]` & `/team/s/[id]` - Public share pages for finished games
- `/profile/[username]` - Player profiles with stats and achievements
- `/teams` & `/teams/[id]` - Clan management
- `/history` - Game history
- `/admin` - Admin dashboard (requires admin role)

### Convex Backend (`convex/`)
- `schema.ts` - Database schema (users, games, teamGames, playerStats, clans, achievements, etc.)
- `auth.ts` - Auth helpers: `getAuthUser`, `getOptionalAuthUser`, `requireAdmin`
- `games.ts` - Series game mutations/queries (create, recordShot, editShot)
- `teamGames.ts` - Team game logic with phases (niileg, shuvtraga, merge), sets, and golden point
- `stats.ts` - ELO rating calculation and achievement tracking (internal mutation)
- `teams.ts` - Clan/team CRUD operations

### Key Patterns
- Convex functions use `getAuthUser(ctx)` for authenticated routes, `getOptionalAuthUser(ctx)` for optional auth
- Games can be created with or without authentication (anonymous play supported)
- Player stats are computed on game finish via `ctx.scheduler.runAfter` calling `internal.stats.updateStatsOnGameFinish`
- Rating uses ELO with pairwise comparison for multiplayer games

### Team Game Phase System
Team games follow a specific phase structure based on team size:
- **4v4**: niileg → shuvtraga (repeating)
- **5v5/6v6**: niileg → shuvtraga → merge (repeating)
- Direction alternates: RTL (odd phases) / LTR (even phases)
- Each player shoots 4 times per phase appearance
- First team to 15 points wins the set; 2 sets per match with golden point tiebreaker if needed

### Components (`components/`)
- `ui/` - shadcn/ui primitives (button, card, dialog, etc.)
- `layout/` - AppShell, Sidebar, LayoutWrapper
- `providers/` - ConvexClientProvider
- `series/` - Series game UI components (GameControls, PlayerRow, ShotCircle, etc.)
- `team/` - Team game UI components (PhaseSection, TeamPlayerCard, TeamScoreHeader)
- `profile/` - Profile page components (StatsGrid, RatingChart, AchievementGrid)

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

## Tier System
Player ratings map to tiers defined in `lib/tiers.ts`:
- Сурагч (Apprentice): 0-1199
- Харваач (Archer): 1200-1399
- Мэргэн (Marksman): 1400-1599
- Домогт мэргэн (Legendary): 1600-1799
- Их мэргэн (Grandmaster): 1800+
