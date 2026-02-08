import { v } from "convex/values";
import { query } from "./_generated/server";

// Get top players ranked by total hits — reads from precomputed playerStats table
export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Read from precomputed playerStats, sorted by totalHits via index
    const top = await ctx.db
      .query("playerStats")
      .withIndex("by_totalHits")
      .order("desc")
      .take(limit);

    // Enrich with user info
    const results = await Promise.all(
      top.map(async (entry, index) => {
        const user = await ctx.db.get(entry.userId);
        return {
          rank: index + 1,
          userId: entry.userId as string,
          fullName: user?.fullName ?? "Unknown",
          username: user?.username ?? "unknown",
          totalHits: entry.totalHits,
          totalGames: entry.totalGames,
          avgScore:
            entry.totalGames > 0
              ? Math.round((entry.totalHits / entry.totalGames) * 10) / 10
              : 0,
        };
      })
    );

    return results;
  },
});

// Get live statistics for the dashboard
export const getLiveStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    // Get Monday of current week (UTC)
    const weekStart = new Date(now);
    const day = weekStart.getUTCDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
    weekStart.setUTCDate(weekStart.getUTCDate() - diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartMs = weekStart.getTime();

    // Count active games
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", false))
      .collect();

    // Get recent games for today/week stats (bounded for performance)
    const recentGames = await ctx.db.query("games").order("desc").take(2000);

    let todaysMatches = 0;
    let weeksMatches = 0;
    let totalDuration = 0;
    let finishedCount = 0;

    for (const game of recentGames) {
      if (game.startedAt >= todayStartMs) {
        todaysMatches++;
      }
      if (game.startedAt >= weekStartMs) {
        weeksMatches++;
      }
      if (game.isFinished && game.finishedAt) {
        totalDuration += game.finishedAt - game.startedAt;
        finishedCount++;
      }
    }

    const avgDurationMinutes =
      finishedCount > 0
        ? Math.round(totalDuration / finishedCount / 60000)
        : null;

    return {
      todaysMatches,
      weeksMatches,
      activeGames: activeGames.length,
      avgDurationMinutes,
    };
  },
});
