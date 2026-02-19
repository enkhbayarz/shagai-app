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
          rating: entry.rating,
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

    // Count active series games
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", false))
      .collect();

    // Count active team games
    const activeTeamGames = await ctx.db
      .query("teamGames")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    // Get recent series games for today/week stats (bounded for performance)
    const recentGames = await ctx.db.query("games").order("desc").take(2000);

    // Get recent team games for today/week stats
    const recentTeamGames = await ctx.db.query("teamGames").order("desc").take(500);

    let todaysSeriesMatches = 0;
    let weeksSeriesMatches = 0;
    let totalDuration = 0;
    let finishedCount = 0;

    for (const game of recentGames) {
      if (game.startedAt >= todayStartMs) {
        todaysSeriesMatches++;
      }
      if (game.startedAt >= weekStartMs) {
        weeksSeriesMatches++;
      }
      if (game.isFinished && game.finishedAt) {
        totalDuration += game.finishedAt - game.startedAt;
        finishedCount++;
      }
    }

    let todaysTeamMatches = 0;
    let weeksTeamMatches = 0;

    for (const game of recentTeamGames) {
      if (game.startedAt >= todayStartMs) {
        todaysTeamMatches++;
      }
      if (game.startedAt >= weekStartMs) {
        weeksTeamMatches++;
      }
      if (game.status === "finished" && game.finishedAt) {
        totalDuration += game.finishedAt - game.startedAt;
        finishedCount++;
      }
    }

    const avgDurationMinutes =
      finishedCount > 0
        ? Math.round(totalDuration / finishedCount / 60000)
        : null;

    return {
      // Combined totals
      todaysMatches: todaysSeriesMatches + todaysTeamMatches,
      weeksMatches: weeksSeriesMatches + weeksTeamMatches,
      activeGames: activeGames.length + activeTeamGames.length,
      avgDurationMinutes,
      // Separate counts for detailed display
      todaysSeriesMatches,
      todaysTeamMatches,
      weeksSeriesMatches,
      weeksTeamMatches,
      activeSeriesGames: activeGames.length,
      activeTeamGames: activeTeamGames.length,
    };
  },
});
