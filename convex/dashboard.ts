import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get top players ranked by total hits across all finished games
export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Fetch recent finished games (bounded for performance)
    const finishedGames = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", true))
      .order("desc")
      .take(2000);

    // Aggregate stats per registered user
    const playerStats = new Map<
      string,
      { userId: Id<"users">; totalHits: number; totalGames: number }
    >();

    for (const game of finishedGames) {
      for (const player of game.players) {
        if (!player.userId) continue;
        const id = player.userId;
        const hits = player.shots.filter((s) => s === true).length;
        const existing = playerStats.get(id);
        if (existing) {
          existing.totalHits += hits;
          existing.totalGames += 1;
        } else {
          playerStats.set(id, { userId: id, totalHits: hits, totalGames: 1 });
        }
      }
    }

    // Sort by total hits descending
    const sorted = Array.from(playerStats.values()).sort(
      (a, b) => b.totalHits - a.totalHits
    );
    const top = sorted.slice(0, limit);

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
