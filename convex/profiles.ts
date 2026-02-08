import { v } from "convex/values";
import { query } from "./_generated/server";

// Get full profile data for a username
export const getProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) return null;

    const stats = await ctx.db
      .query("playerStats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        createdAt: user.createdAt,
      },
      stats: stats
        ? {
            totalGames: stats.totalGames,
            totalWins: stats.totalWins,
            totalHits: stats.totalHits,
            totalShots: stats.totalShots,
            avgAccuracy: stats.avgAccuracy,
            currentStreak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            last10Results: stats.last10Results,
            rating: stats.rating,
            ratingDeviation: stats.ratingDeviation,
          }
        : null,
      achievements: achievements.map((a) => ({
        code: a.achievementCode,
        unlockedAt: a.unlockedAt,
      })),
    };
  },
});

// Get rating history for chart (ascending by timestamp)
export const getRatingHistory = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const snapshots = await ctx.db
      .query("ratingSnapshots")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return snapshots.reverse().map((s) => ({
      timestamp: s.timestamp,
      rating: s.rating,
      ratingChange: s.ratingChange,
    }));
  },
});

// Get recent games for a user (via gameParticipants join)
export const getRecentGames = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const participations = await ctx.db
      .query("gameParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const games = await Promise.all(
      participations.map(async (p) => {
        const game = await ctx.db.get(p.gameId);
        if (!game) return null;
        return {
          gameId: p.gameId as string,
          score: p.score,
          rank: p.rank,
          playerCount: game.playerCount,
          startedAt: game.startedAt,
          result: game.result ?? [],
        };
      })
    );

    return games.filter((g): g is NonNullable<typeof g> => g !== null);
  },
});
