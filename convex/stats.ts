import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// --- ELO helpers ---

const DEFAULT_RATING = 1500;
const DEFAULT_RD = 350;

// K-factor: higher for new players (more volatile), lower for established
function getKFactor(totalGames: number): number {
  if (totalGames < 30) return 32;
  return 16;
}

// Expected score of player A vs player B (0-1)
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// Compute ELO rating changes for a multiplayer game using pairwise comparison.
// Each player is compared against every other player. The rating change is the
// average of all pairwise changes.
// actualResult: 1.0 = win, 0.5 = tie, 0.0 = loss (determined by rank)
function computeEloChanges(
  players: { rank: number; rating: number; totalGames: number }[]
): number[] {
  const n = players.length;
  if (n < 2) return players.map(() => 0);

  const changes = players.map(() => 0);

  for (let i = 0; i < n; i++) {
    let totalChange = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const expected = expectedScore(players[i].rating, players[j].rating);
      // Actual result based on rank comparison
      let actual: number;
      if (players[i].rank < players[j].rank) {
        actual = 1.0; // i beat j
      } else if (players[i].rank === players[j].rank) {
        actual = 0.5; // tie
      } else {
        actual = 0.0; // i lost to j
      }

      const k = getKFactor(players[i].totalGames);
      totalChange += k * (actual - expected);
    }
    // Average across all opponents
    changes[i] = Math.round(totalChange / (n - 1));
  }

  return changes;
}

// Check and award achievements for a player after stats update
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAchievements(
  ctx: any,
  userId: Id<"users">,
  stats: {
    totalGames: number;
    totalWins: number;
    totalHits: number;
    currentStreak: number;
    bestStreak: number;
  },
  gameScore: number,
  gameTotalShots: number
) {
  const checks = [
    { code: "first_game", condition: stats.totalGames >= 1 },
    { code: "first_win", condition: stats.totalWins >= 1 },
    { code: "perfect_game", condition: gameTotalShots > 0 && gameScore === gameTotalShots },
    { code: "sharpshooter", condition: gameTotalShots > 0 && gameScore / gameTotalShots >= 0.8 },
    { code: "on_fire", condition: stats.currentStreak >= 5 || stats.bestStreak >= 5 },
    { code: "streak_10", condition: stats.currentStreak >= 10 || stats.bestStreak >= 10 },
    { code: "hundred_battles", condition: stats.totalGames >= 100 },
    { code: "thousander", condition: stats.totalHits >= 1000 },
  ];

  for (const check of checks) {
    if (!check.condition) continue;
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_code", (q: any) =>
        q.eq("userId", userId).eq("achievementCode", check.code)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("achievements", {
        userId,
        achievementCode: check.code,
        unlockedAt: Date.now(),
      });
    }
  }
}

// Called when a game finishes. Updates playerStats, gameParticipants, and game result.
export const updateStatsOnGameFinish = internalMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.isFinished) return;

    // Already processed — skip (idempotent)
    if (game.result) return;

    // 1. Compute scores for each player
    const playerScores = game.players.map((player, index) => ({
      index,
      name: player.name,
      userId: player.userId,
      score: player.shots.filter((s) => s === true).length,
      totalShots: player.shots.filter((s) => s !== null).length,
    }));

    // 2. Determine rankings (sorted by score descending, ties share rank)
    const sorted = [...playerScores].sort((a, b) => b.score - a.score);
    const rankMap = new Map<number, number>();
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score < sorted[i - 1].score) {
        currentRank = i + 1;
      }
      rankMap.set(sorted[i].index, currentRank);
    }

    // 3. Write result array to the game document
    const result = playerScores.map((p) => ({
      userId: p.userId,
      name: p.name,
      score: p.score,
      rank: rankMap.get(p.index)!,
    }));

    await ctx.db.patch(args.gameId, { result });

    // 4. Fetch current ratings for all registered players (needed for ELO)
    type PlayerStatsDoc = {
      _id: Id<"playerStats">;
      userId: Id<"users">;
      totalGames: number;
      totalWins: number;
      totalHits: number;
      totalShots: number;
      avgAccuracy: number;
      currentStreak: number;
      bestStreak: number;
      last10Results: boolean[];
      rating: number;
      ratingDeviation: number;
      updatedAt: number;
    };

    const registeredPlayers: {
      index: number;
      userId: Id<"users">;
      score: number;
      totalShots: number;
      rank: number;
      existingStats: PlayerStatsDoc | null;
    }[] = [];

    for (const player of playerScores) {
      if (!player.userId) continue;
      const existing = await ctx.db
        .query("playerStats")
        .withIndex("by_user", (q) => q.eq("userId", player.userId!))
        .unique();

      registeredPlayers.push({
        index: player.index,
        userId: player.userId,
        score: player.score,
        totalShots: player.totalShots,
        rank: rankMap.get(player.index)!,
        existingStats: existing as PlayerStatsDoc | null,
      });
    }

    // 5. Compute ELO changes (only if 2+ registered players)
    const eloChanges = new Map<number, number>();
    if (registeredPlayers.length >= 2) {
      const eloInput = registeredPlayers.map((p) => ({
        rank: p.rank,
        rating: p.existingStats?.rating ?? DEFAULT_RATING,
        totalGames: p.existingStats?.totalGames ?? 0,
      }));
      const changes = computeEloChanges(eloInput);
      registeredPlayers.forEach((p, i) => {
        eloChanges.set(p.index, changes[i]);
      });
    }

    // 6. Write gameParticipants + update playerStats for each registered player
    for (const player of registeredPlayers) {
      const isWin = player.rank === 1;
      const ratingChange = eloChanges.get(player.index) ?? 0;

      // Write gameParticipants row
      await ctx.db.insert("gameParticipants", {
        gameId: args.gameId,
        userId: player.userId,
        score: player.score,
        rank: player.rank,
      });

      const existing = player.existingStats;

      let finalRating: number;
      let updatedStats: {
        totalGames: number;
        totalWins: number;
        totalHits: number;
        currentStreak: number;
        bestStreak: number;
      };

      if (existing) {
        // Update existing stats
        const newStreak = isWin
          ? Math.max(existing.currentStreak, 0) + 1
          : Math.min(existing.currentStreak, 0) - 1;

        const newTotalHits = existing.totalHits + player.score;
        const newTotalShots = existing.totalShots + player.totalShots;
        const newLast10 = [isWin, ...existing.last10Results].slice(0, 10);
        const newRating = Math.max(0, existing.rating + ratingChange);

        await ctx.db.patch(existing._id, {
          totalGames: existing.totalGames + 1,
          totalWins: existing.totalWins + (isWin ? 1 : 0),
          totalHits: newTotalHits,
          totalShots: newTotalShots,
          avgAccuracy: newTotalShots > 0 ? newTotalHits / newTotalShots : 0,
          currentStreak: newStreak,
          bestStreak: Math.max(existing.bestStreak, newStreak),
          last10Results: newLast10,
          rating: newRating,
          ratingDeviation: Math.max(50, existing.ratingDeviation - 5),
          updatedAt: Date.now(),
        });

        finalRating = newRating;
        updatedStats = {
          totalGames: existing.totalGames + 1,
          totalWins: existing.totalWins + (isWin ? 1 : 0),
          totalHits: newTotalHits,
          currentStreak: newStreak,
          bestStreak: Math.max(existing.bestStreak, newStreak),
        };
      } else {
        // Create new stats entry with initial rating + change
        const initialRating = Math.max(0, DEFAULT_RATING + ratingChange);

        await ctx.db.insert("playerStats", {
          userId: player.userId,
          totalGames: 1,
          totalWins: isWin ? 1 : 0,
          totalHits: player.score,
          totalShots: player.totalShots,
          avgAccuracy: player.totalShots > 0 ? player.score / player.totalShots : 0,
          currentStreak: isWin ? 1 : -1,
          bestStreak: isWin ? 1 : 0,
          last10Results: [isWin],
          rating: initialRating,
          ratingDeviation: DEFAULT_RD - 5,
          updatedAt: Date.now(),
        });

        finalRating = initialRating;
        updatedStats = {
          totalGames: 1,
          totalWins: isWin ? 1 : 0,
          totalHits: player.score,
          currentStreak: isWin ? 1 : -1,
          bestStreak: isWin ? 1 : 0,
        };
      }

      // 7. Record rating snapshot for history chart
      await ctx.db.insert("ratingSnapshots", {
        userId: player.userId,
        gameId: args.gameId,
        rating: finalRating,
        ratingChange,
        timestamp: Date.now(),
      });

      // 8. Check and award achievements
      await checkAchievements(
        ctx,
        player.userId,
        updatedStats,
        player.score,
        player.totalShots
      );
    }
  },
});
