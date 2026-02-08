# Shagai Harvaа Feature Roadmap

## Current State Summary

**What exists:** Game recording (1-4 players, 20 rounds, hit/miss/null), user profiles (Clerk+Convex), clan system (create/invite/stats), dashboard (leaderboard + live stats), live spectating, history, admin panel, public share pages, settings (email only).

**Key limitation:** Only binary hit/miss per shot. No timing, distance, bone type, or technique data. All analytics computed on-read by scanning up to 2000 games — no precomputed stats.

---

## Features NOT Worth Building

These are over-engineered for a niche cultural sport app:

| Feature                          | Reason                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| Online Matchmaking               | Users are physically together on a field                    |
| Aim/Angle Simulator              | Different product entirely                                  |
| Video Upload + Coach Annotations | Massive infra cost (storage, transcoding) for a scoring app |
| AI Coach (ML)                    | Binary hit/miss data has insufficient signal for ML         |
| Weak Side / Heatmap Detection    | Impossible without spatial data you don't collect           |
| Coach Marketplace                | Needs 100k+ users to sustain                                |
| XP & Leveling                    | Marginal benefit over rating + achievements combined        |
| Technique Library                | Content creation burden — better as external YouTube links  |
| Mentorship System                | Needs large user base; just make top players visible        |

---

## Phase 0: Foundation (Must Build First — Unlocks Everything)

These schema changes are prerequisites for nearly every feature below.

### 0A. `playerStats` Table (Precomputed Stats)

Currently `dashboard.ts` scans 2000 games on every leaderboard load. This is the biggest technical debt.

**New table:**

```
playerStats: {
  userId, totalGames, totalWins, totalHits, totalShots,
  avgAccuracy, currentStreak, bestStreak, last10Results[],
  rating (ELO), ratingDeviation (Glicko-2), updatedAt
}
```

**How:** Trigger stats update in the `recordShot` mutation when `isFinished` becomes true. Write a backfill migration for existing games.

**Unlocks:** Player profiles, ELO, leaderboard performance, H2H, tiers, seasons

### 0B. Game Outcome Fields

Add `result` array to `games` table (rank + score per player). Currently winner is computed client-side every time.

**Unlocks:** Fast H2H queries, win rate calculations, post-match analysis

### 0C. `gameParticipants` Join Table

Current `listByPlayer` does full table scan. Create:

```
gameParticipants: { gameId, userId, score, rank }
```

**Unlocks:** "My games" queries, H2H record lookups, per-player game filtering

**Files to modify:**

- `convex/schema.ts` — add 3 new tables + game fields
- `convex/games.ts` — update `recordShot` to write stats/outcomes/participants on game finish
- `convex/dashboard.ts` — rewrite to read from `playerStats` instead of scanning games
- One-time backfill script for existing data

---

## Phase 1: Core Analytics (Highest User Value)

All buildable with existing hit/miss data + Phase 0 foundation.

### 1A. Player Stats Dashboard

New `/profile/[username]` page: total games, win rate, accuracy %, rating, last 10 results (W/L dots), rating graph over time.

- Add `ratingSnapshots` table for the graph
- Reuse existing dot pattern from `ShotCircle.tsx`
- Add a chart library (Recharts or lightweight alternative)

### 1B. ELO/Glicko-2 Rating System

Initial rating 1500. Adjust after each game based on opponent strength + score differential. For 3-4 player games, use pairwise comparison (average of all pairwise ELO changes).

- Computed in game-finish mutation
- Stored in `playerStats.rating`

### 1C. Head-to-Head Records

"You're 7-3 against Батболд" with avg score breakdown.

- Query `gameParticipants` for games with both players
- Show on profile pages + setup screen

### 1D. Accuracy Breakdown by Game Stage

Shots 1-5 (opening), 6-15 (middle), 16-20 (closing). "You fade in the last 5 shots" — actionable without shot metadata.

### 1E. Consistency Score

Standard deviation of scores across games, win/loss streaks, clutch performance (accuracy in shots 17-20 when close game).

**Files to modify:**

- New page: `app/profile/[username]/page.tsx`
- New convex file: `convex/playerStats.ts` (queries for profile data)
- `convex/games.ts` — ELO computation on finish
- `app/series/setup/page.tsx` — show opponent stats card

---

## Phase 2: Social & Engagement

### 2A. Match Recap Share Card

Auto-generate shareable image: winner, scores, shot dots, branding. `html2canvas` is already a dependency. Use `navigator.share()` for mobile sharing.

**This is the highest engagement-per-effort feature.** Mongolian archery communities are social — sharing results on Facebook drives organic growth.

- Extend `components/series/FinishedModal.tsx`

### 2B. Achievement System

Badges unlocked on milestones:

- "Эхний цус" — First game
- "Цэвэр ялалт" — 20/20 perfect game
- "10 ялалтын цуваа" — 10 win streak
- "Мэргэн" — Reach Marksman tier
- "100 тоглоом" — 100 games played

**New tables:** `achievements: { userId, type, unlockedAt, metadata }`
Check and award in game-finish mutation alongside stats.

### 2C. Pre-match Scouting

On setup page, after selecting a registered opponent, show mini stats card: rating, accuracy, last 5 results, H2H record.

- Modify `app/series/setup/page.tsx`

### 2D. Post-match Analysis

Template-driven insights in FinishedModal: "You won because your accuracy was 85% vs their 60%", "Your strongest stretch was shots 5-12 (100%)". 5-10 insight templates based on conditions.

- Extend `components/series/FinishedModal.tsx`

---

## Phase 3: Competitive Structure

### 3A. Skill Tiers / Ranks (Mongolian-themed)

- Сурагч (Apprentice) — 0-1200
- Харваач (Archer) — 1200-1400
- Мэргэн (Marksman) — 1400-1600
- Домогт мэргэн (Legendary) — 1600-1800
- Их мэргэн (Grand Master) — 1800+

Pure mapping of ELO to label + badge. Display on profiles, leaderboards, share cards.

### 3B. Daily/Weekly Challenges

- Daily: "Win with 15+ hits", "Play 3 games"
- Weekly: "Win 5 games", "80% accuracy in one game"

**New tables:** `challenges`, `challengeProgress`
Scheduled Convex function to rotate challenges. Check progress on game finish.

### 3C. Seasonal Competitions

Monthly ranked seasons. Soft-reset ratings at month start. End-of-season badges for top finishers.

**New tables:** `seasons`, `seasonResults`

### 3D. Tournament System

Single elimination brackets. Auto-seeding by rating. Bracket visualization.

**HIGH complexity.** Only build if user base warrants it. Needs bracket generation, SVG visualization, match linking.

---

## Phase 4: Enhanced Data Capture (Practice Mode)

### The Shot Metadata Decision

**Problem:** Adding bone type / distance to the main game flow increases per-shot recording time from ~1s to ~5-8s. In an 80-shot game, that's 7 extra minutes of phone fiddling.

**Recommendation:** Do NOT add metadata to competitive games. Instead, create a standalone Practice Logger:

### Practice Session Mode

Separate "Дасгал" (Practice) mode for solo training with rich metadata per shot:

```
practiceSessions: {
  userId, startedAt, finishedAt,
  shots: [{ isHit, boneType?, distance?, note?, timestamp }]
}
```

No time pressure, no rotation — the archer logs their own shots between attempts.

This unlocks:

- Practice-specific analytics (accuracy by bone type, by distance)
- Practice drills (consistency drill, pressure drill)
- Training insights that don't degrade the competitive game experience

---

## Phase 5: Infrastructure

### 5A. PWA + Offline Support

`manifest.json`, service worker, installable on home screens. Offline game recording with mutation queue (critical for outdoor archery ranges with poor signal).

### 5B. Push Notifications

Notify about: clan invites, challenge completions, season endings. Only worth building after challenges/seasons exist.

---

## Dependency Graph

```
Phase 0A (playerStats) ──> Phase 1A (Profile)
                       ──> Phase 1B (ELO) ──> Phase 3A (Tiers)
                       │                  ──> Phase 3C (Seasons)
                       ──> Phase 1D (Accuracy Breakdown)
                       ──> Phase 1E (Consistency)
                       ──> Phase 2B (Achievements)
                       ──> Phase 3B (Challenges)

Phase 0B (Game Outcomes) ──> Phase 1C (H2H)
                         ──> Phase 2D (Post-match Analysis)

Phase 0C (gameParticipants) ──> Phase 1C (H2H)
                            ──> Phase 2C (Pre-match Scouting)

Phase 2A (Share Cards) ──> independent, start anytime
Phase 4 (Practice Mode) ──> independent decision
Phase 3D (Tournaments) ──> depends on Phase 1B for seeding
```

---

## Recommended Build Sequence

| Sprint | What                                   | Why                                             |
| ------ | -------------------------------------- | ----------------------------------------------- |
| **1**  | Phase 0 (all) + Phase 2A (Share Cards) | Foundation + highest-ROI visible feature        |
| **2**  | Phase 1A + 1B + 2B                     | Profiles, ratings, achievements — the core loop |
| **3**  | Phase 1C + 1D + 2C + 2D + 3A           | H2H, analysis, scouting, tier labels            |
| **4**  | Phase 3B + 3C                          | Challenges + seasons — daily retention          |
| **5**  | Phase 4 (Practice Mode) + 5A (PWA)     | Rich data capture + offline support             |
| **6+** | Phase 3D (Tournaments)                 | Only if user base warrants it                   |

---

## All Schema Changes (Cumulative)

**New tables:** `playerStats`, `gameParticipants`, `achievements`, `ratingSnapshots`, `challenges`, `challengeProgress`, `seasons`, `seasonResults`, `practiceSessions`

**Modified tables:** `games` (add `result` array field)

---

---

## IMPLEMENTATION PLAN: Step-by-Step (One at a Time, Each Testable)

### Step 1: Add `playerStats` table to schema

**File:** `convex/schema.ts`
**What:** Add the `playerStats` table definition with fields: userId, totalGames, totalWins, totalHits, totalShots, avgAccuracy, currentStreak, bestStreak, last10Results, rating, ratingDeviation, updatedAt. Add indexes: by_user, by_rating.
**Test:** Run `npx convex dev` — schema should deploy without errors.

### Step 2: Add `gameParticipants` table to schema

**File:** `convex/schema.ts`
**What:** Add the `gameParticipants` join table: gameId, userId, score, rank. Add indexes: by_user, by_game.
**Test:** Run `npx convex dev` — schema deploys. Both new tables visible in Convex dashboard.

### Step 3: Add `result` field to `games` table

**File:** `convex/schema.ts`
**What:** Add optional `result` field to games — array of `{ userId?, name, score, rank }`. This stores the final standings when a game finishes.
**Test:** Run `npx convex dev` — existing games unaffected (field is optional). Schema deploys clean.

### Step 4: Create stats update logic

**File:** New `convex/stats.ts`
**What:** Create an internal mutation `updateStatsOnGameFinish(gameId)` that:

1. Reads the finished game
2. Computes each player's score (count true values in shots array)
3. Determines rankings (ties handled)
4. Writes/updates `playerStats` for each registered player (create if first game, update if exists)
5. Writes `gameParticipants` row for each registered player
6. Writes `result` array back to the game document
   **Test:** Call manually from Convex dashboard with an existing finished game ID. Check that `playerStats` and `gameParticipants` rows appear correctly.

### Step 5: Wire stats update into game finish flow

**File:** `convex/games.ts` (modify `recordShot` mutation)
**What:** After the existing code sets `isFinished: true`, call the stats update mutation from Step 4. This ensures every new finished game automatically populates stats.
**Test:** Start a new game in the app → play through all 20 rounds → game finishes → check Convex dashboard for new `playerStats` and `gameParticipants` entries.

### Step 6: Backfill existing games

**File:** New `convex/backfill.ts`
**What:** One-time action that:

1. Fetches all finished games
2. For each game, runs the same stats logic from Step 4
3. Handles duplicates (skip if already processed)
4. Aggregates cumulative stats correctly (must process games in chronological order)
   **Test:** Run from Convex dashboard. Verify `playerStats` totals match what the old leaderboard shows. Verify `gameParticipants` count matches total player entries across all finished games.

### Step 7: Rewrite dashboard leaderboard to use `playerStats`

**File:** `convex/dashboard.ts`
**What:** Replace the `getLeaderboard` query that scans 2000 games with a simple query on `playerStats` table ordered by totalHits (or rating). Much faster, scales properly.
**Test:** Open the dashboard page (`/home`) — leaderboard should show the same data as before but load faster. Compare values with old implementation.

### Step 8: Add ELO rating computation

**File:** `convex/stats.ts` (extend Step 4 logic)
**What:** In the stats update function, compute ELO adjustments:

- Default starting rating: 1500, deviation: 350
- For 2-player games: standard ELO formula
- For 3-4 player games: pairwise comparison (avg of all pairwise changes)
- K-factor: 32 for new players (<30 games), 16 for established
- Store rating + deviation in `playerStats`
  **Test:** Play 2-3 test games. Check that ratings move: winner should go up, loser down. Higher-rated player losing to lower-rated should move more points.

### Step 9: Create shareable result card component

**File:** New `components/series/ShareCard.tsx`
**What:** A styled card component (fixed dimensions for social media ~1200x630px) showing:

- "ШАГАЙ ХАРВАА" branding at top
- Winner name large with trophy icon
- All player results: rank, name, score, shot dots (reuse existing dot pattern)
- Date at bottom
- Dark background with game color scheme
  **Test:** Render it on any finished game page — visually inspect the card looks good, matches brand aesthetic.

### Step 10: Add share button to FinishedModal

**File:** `components/series/FinishedModal.tsx`
**What:** Add "Хуваалцах" (Share) button next to the existing "Copy link" button. On tap:

1. Render ShareCard to a hidden div
2. Capture with `html2canvas`
3. If `navigator.share` available (mobile): share image via native share sheet
4. Fallback: download the image
   **Test:** Finish a game → tap share button → image generates → native share sheet opens on mobile (or image downloads on desktop). Image should look clean with no rendering artifacts.

---

### Future steps (not implementing now, just for reference):

- Step 11: Player profile page (`/profile/[username]`)
- Step 12: Rating history graph (add `ratingSnapshots` table)
- Step 13: Head-to-head records query + UI
- Step 14: Accuracy breakdown by game stage
- Step 15: Achievement system
- Step 16: Skill tier labels (Сурагч → Их мэргэн)
- Step 17: Pre-match scouting card on setup page
- Step 18: Post-match analysis insights
- Step 19: Daily/weekly challenges
- Step 20: Seasonal competitions
- Step 21: Tournament system
