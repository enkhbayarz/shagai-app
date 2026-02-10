# БАГИЙН ХАРВАА (Team Archery Game) - Implementation Plan

## Overview

Implement a team-based archery scoring game where two clans compete in 2 sets with complex phase-based turn order, aiming to reach 15 points per set. Teams link to existing clans, data stored in separate `teamGames` table, with full stats tracking.

---

## Phase 1: Database Schema

### File: `convex/schema.ts`

Add 3 new tables:

**1. `teamGames`** - Core game data

```typescript
teamGames: defineTable({
  // Teams (linked to clans)
  homeClanId: v.id("clans"),
  awayClanId: v.id("clans"),
  playersPerTeam: v.union(v.literal(4), v.literal(5), v.literal(6)),

  // Metadata
  creatorId: v.id("users"),
  startedAt: v.number(),
  finishedAt: v.optional(v.number()),

  // Team rosters
  homeTeam: v.object({
    players: v.array(v.object({
      userId: v.id("users"),
      name: v.string(),
      isSubstitute: v.boolean(),
      replacedPlayerIndex: v.optional(v.number()), // If sub entered
    })),
  }),
  awayTeam: v.object({ /* same structure */ }),

  // Sets (array of 2)
  sets: v.array(v.object({
    setNumber: v.number(),
    homeScore: v.number(),
    awayScore: v.number(),
    phases: v.array(v.object({
      phaseNumber: v.number(),
      phaseType: v.string(), // "niileg" | "shuvtraga" | "merge"
      cycle: v.number(),
      direction: v.string(), // "rtl" | "ltr"
      shooters: v.array(v.object({
        team: v.string(),
        playerIndex: v.number(),
        shots: v.array(v.union(v.boolean(), v.null())),
      })),
      isCompleted: v.boolean(),
    })),
    isCompleted: v.boolean(),
    winner: v.optional(v.string()),
    homePulled: v.optional(v.number()),
    awayPulled: v.optional(v.number()),
  })),

  // Current state
  currentSet: v.number(),
  currentPhaseIndex: v.number(),
  currentShooterIndex: v.number(),
  currentShotInTurn: v.number(),

  // Golden point (tie-breaker)
  goldenPoint: v.optional(v.object({ /* ... */ })),

  // Status & result
  status: v.string(),
  result: v.optional(v.object({ /* winner, scores, pulls */ })),
})
  .index("by_home_clan", ["homeClanId"])
  .index("by_away_clan", ["awayClanId"])
  .index("by_creator", ["creatorId"])
  .index("by_status", ["status"]),
```

**2. `teamGameParticipants`** - Individual player stats per game
**3. `teamStats`** - Aggregated clan team statistics

---

## Phase 2: Backend Logic

### File: `convex/teamGames.ts`

**Mutations:**

- `create` - Initialize game with clan selection, player roster
- `recordShot` - Core game logic with state machine:
  - Record shot (hit/miss)
  - Update score
  - Advance shooter (0-3 shots per turn)
  - Advance phase when all shooters done
  - Check set end conditions (15 points or insurmountable lead)
  - Handle set transitions and side swap
  - Trigger golden point if tied
- `editShot` - Toggle past shot
- `substitutePlayer` - Swap in substitute (Set 2 only)

**Queries:**

- `get` - Full game for participants
- `getPublic` - Finished game for sharing
- `listByUser`, `listByClan`, `listLive`

### File: `convex/teamStats.ts`

- `updateTeamStatsOnGameFinish` - Internal mutation for stats

### Key Game Rules to Implement:

1. **Phase System:**
   - Phase 1 (Niileg): 2+2 players, direction RTL
   - Phase 2 (Shuvtraga): 2+2 players, direction LTR
   - Phase 3 (Merge): 2+2 (6p), 1+1 (5p), none (4p), direction RTL

2. **Turn Order:**
   - Seating: A1, B1, A2, B2 (A=Home, B=Away)
   - Each player: 4 shots per phase appearance
   - Special: 6v6 first phase first shot - one player skips

3. **Set End Conditions:**
   - Either team reaches 15+
   - "Pulled" = points exceeding 15 taken from opponent
   - Set 2 early end if lead insurmountable

4. **Golden Point:**
   - Pairs shoot alternately
   - First hits + second misses = first wins
   - Both hit/miss = cancelled, continue

---

## Phase 3: Frontend Setup Page

### File: `app/team/setup/page.tsx`

Multi-step form:

1. Select opponent clan (from all clans)
2. Select players per team (4/5/6)
3. Select players from own clan roster
4. Assign substitute (optional)
5. Start game

### Components: `components/team/`

- `TeamSetupForm.tsx` - Main form container
- `ClanSelector.tsx` - Dropdown for clan selection
- `PlayerSelector.tsx` - Select N players from clan members

---

## Phase 4: Frontend Game Page

### File: `app/team/game/[id]/page.tsx`

Main game interface with:

- Score header with set info
- Active phase (highlighted yellow)
- Completed phases (scrolled up, gray)
- Game controls (hit/miss buttons)

### Components: `components/team/`

| Component                | Purpose                            |
| ------------------------ | ---------------------------------- |
| `TeamGameBoard.tsx`      | Main board layout                  |
| `TeamScoreHeader.tsx`    | "[Away] X/15 - SET - Y/15 [Home]"  |
| `PhaseSection.tsx`       | One phase row with 4 players       |
| `TeamPlayerCard.tsx`     | Player avatar + name + 4 shot dots |
| `TeamGameControls.tsx`   | Hit/miss buttons                   |
| `TeamFinishedModal.tsx`  | Results with sharing               |
| `GoldenPointSection.tsx` | Tie-breaker UI                     |

**UI Details:**

- Team colors: Blue (Home), Orange (Away)
- Shot indicators: Green (hit), Orange (miss), Gray (unshot)
- Active shooter: Highlighted with glow
- Auto-scroll on phase transition

---

## Phase 5: Integration & Polish

### Enable on Home Page

**File: `app/page.tsx`** (line 118-129)

Replace disabled button:

```tsx
<SignedIn>
  <Link href="/team/setup" className="block">
    <Button variant="default" size="lg" className="...">
      БАГИЙН ХАРВАА
    </Button>
  </Link>
</SignedIn>
```

### Share Page

**File: `app/team/s/[id]/page.tsx`** - Public share for finished games

### CSS Variables

**File: `app/globals.css`**

```css
:root {
  --team-home: #3b82f6;
  --team-away: #f97316;
  --phase-active: #fef3c7;
}
```

---

## Implementation Order

| Step | Task                                      | Files                                   |
| ---- | ----------------------------------------- | --------------------------------------- |
| 1    | Add schema tables                         | `convex/schema.ts`                      |
| 2    | Implement `create` mutation               | `convex/teamGames.ts`                   |
| 3    | Implement turn order helpers              | `convex/teamGames.ts`                   |
| 4    | Implement `recordShot` with state machine | `convex/teamGames.ts`                   |
| 5    | Implement set end & golden point logic    | `convex/teamGames.ts`                   |
| 6    | Build setup page                          | `app/team/setup/page.tsx`               |
| 7    | Build game board components               | `components/team/*.tsx`                 |
| 8    | Build game page                           | `app/team/game/[id]/page.tsx`           |
| 9    | Build finished modal                      | `components/team/TeamFinishedModal.tsx` |
| 10   | Add stats update on finish                | `convex/teamStats.ts`                   |
| 11   | Enable home page button                   | `app/page.tsx`                          |
| 12   | Build share page                          | `app/team/s/[id]/page.tsx`              |

---

## Verification Plan

1. **Schema**: Run `npx convex dev`, verify tables created
2. **Game Creation**: Test setup flow with 2 clans
3. **Turn Order**: Verify correct player sequence for 4/5/6 players
4. **Shot Recording**: Test all state transitions
5. **Set End**: Test normal finish + early Set 2 finish
6. **Golden Point**: Test tie scenarios
7. **Stats**: Verify stats update on game finish
8. **Mobile**: Test on mobile viewport

---

## Critical Files Reference

- `convex/schema.ts` - Add new tables
- `convex/games.ts` - Reference for mutation patterns
- `convex/clans.ts` - Reference for clan member queries
- `app/series/game/[id]/page.tsx` - Reference for game UI
- `components/series/PlayerRow.tsx` - Reference for player card design
- `app/page.tsx` - Enable team game button (line 118-129)
