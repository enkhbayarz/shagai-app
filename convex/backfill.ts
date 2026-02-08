import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// One-time backfill: processes all finished games to populate playerStats,
// gameParticipants, and game result fields.
// Run from Convex dashboard: npx convex run backfill:backfillAllGames
export const backfillAllGames = internalMutation({
  handler: async (ctx) => {
    // Fetch all finished games, oldest first (chronological order matters for streaks)
    const games = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", true))
      .order("asc")
      .collect();

    let processed = 0;
    let skipped = 0;

    for (const game of games) {
      // Skip already processed games (idempotent)
      if (game.result) {
        skipped++;
        continue;
      }

      // 1. Compute scores
      const playerScores = game.players.map((player, index) => ({
        index,
        name: player.name,
        userId: player.userId,
        score: player.shots.filter((s) => s === true).length,
        totalShots: player.shots.filter((s) => s !== null).length,
      }));

      // 2. Determine rankings
      const sorted = [...playerScores].sort((a, b) => b.score - a.score);
      const rankMap = new Map<number, number>();
      let currentRank = 1;
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i].score < sorted[i - 1].score) {
          currentRank = i + 1;
        }
        rankMap.set(sorted[i].index, currentRank);
      }

      // 3. Write result to game
      const result = playerScores.map((p) => ({
        userId: p.userId,
        name: p.name,
        score: p.score,
        rank: rankMap.get(p.index)!,
      }));
      await ctx.db.patch(game._id, { result });

      // 4. Write gameParticipants + update playerStats for registered players
      for (const player of playerScores) {
        if (!player.userId) continue;

        const rank = rankMap.get(player.index)!;
        const isWin = rank === 1;

        // Check if gameParticipant already exists (avoid duplicates)
        const existingParticipant = await ctx.db
          .query("gameParticipants")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .filter((q) => q.eq(q.field("userId"), player.userId!))
          .unique();

        if (!existingParticipant) {
          await ctx.db.insert("gameParticipants", {
            gameId: game._id,
            userId: player.userId,
            score: player.score,
            rank,
          });
        }

        // Get or create playerStats
        const existing = await ctx.db
          .query("playerStats")
          .withIndex("by_user", (q) => q.eq("userId", player.userId!))
          .unique();

        if (existing) {
          const newStreak = isWin
            ? Math.max(existing.currentStreak, 0) + 1
            : Math.min(existing.currentStreak, 0) - 1;

          const newTotalHits = existing.totalHits + player.score;
          const newTotalShots = existing.totalShots + player.totalShots;
          const newLast10 = [isWin, ...existing.last10Results].slice(0, 10);

          await ctx.db.patch(existing._id, {
            totalGames: existing.totalGames + 1,
            totalWins: existing.totalWins + (isWin ? 1 : 0),
            totalHits: newTotalHits,
            totalShots: newTotalShots,
            avgAccuracy: newTotalShots > 0 ? newTotalHits / newTotalShots : 0,
            currentStreak: newStreak,
            bestStreak: Math.max(existing.bestStreak, newStreak),
            last10Results: newLast10,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("playerStats", {
            userId: player.userId as Id<"users">,
            totalGames: 1,
            totalWins: isWin ? 1 : 0,
            totalHits: player.score,
            totalShots: player.totalShots,
            avgAccuracy: player.totalShots > 0 ? player.score / player.totalShots : 0,
            currentStreak: isWin ? 1 : -1,
            bestStreak: isWin ? 1 : 0,
            last10Results: [isWin],
            rating: 1500,
            ratingDeviation: 350,
            updatedAt: Date.now(),
          });
        }
      }

      processed++;
    }

    return { processed, skipped, total: games.length };
  },
});
