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

## CURRENT IMPLEMENTATION SCOPE: Phase 0 + Share Cards (in parallel)

### What we're building now:

**Track A — Foundation (Phase 0):**

1. Add `playerStats` table to `convex/schema.ts`
2. Add `gameParticipants` table to `convex/schema.ts`
3. Add `result` field to `games` table in `convex/schema.ts`
4. Create `convex/playerStats.ts` — mutations to update stats on game finish
5. Modify `convex/games.ts` — trigger stats/participants/outcome writes when `isFinished` becomes true in `recordShot`
6. Rewrite `convex/dashboard.ts` — read from `playerStats` instead of scanning 2000 games
7. Write backfill script to populate `playerStats` and `gameParticipants` from existing game data

**Track B — Share Cards (Phase 2A):** 8. Create shareable result card component in `components/series/ShareCard.tsx` 9. Add "Share" button to `components/series/FinishedModal.tsx` using `html2canvas` + `navigator.share()` 10. Style the card for social media (proper dimensions, branding)

### Deferred decisions:

- Shot metadata (bone type, distance) — skipped for now
- Offline/PWA — skipped for now
- Practice mode — skipped for now

### Key files to modify:

- `convex/schema.ts` — new tables + modified games table
- `convex/games.ts` — stats trigger on game finish
- `convex/dashboard.ts` — rewrite for precomputed stats
- New: `convex/playerStats.ts`
- New: `convex/backfill.ts` (one-time migration)
- `components/series/FinishedModal.tsx` — share card integration
- New: `components/series/ShareCard.tsx`

### Verification:

- `npx convex dev` — validate schema changes deploy correctly
- `bun run build` — catch type errors
- Test: create a new game → play through all 20 rounds → verify `playerStats` and `gameParticipants` populated
- Test: finish a game → verify share card renders → test share on mobile
- Test: check dashboard leaderboard still works with new `playerStats` source
- Test: verify existing games are backfilled correctly
