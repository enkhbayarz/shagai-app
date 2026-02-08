import { v } from "convex/values";
import { query } from "./_generated/server";

// Get full profile data for a username (public data, no auth required)
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

// Get rating history for chart — ascending by timestamp (public data, no auth required)
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

// Get recent games for a user via gameParticipants join (public data, no auth required)
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

// Head-to-head record between two players (public data, no auth required)
export const getHeadToHead = query({
  args: { userIdA: v.id("users"), userIdB: v.id("users") },
  handler: async (ctx, args) => {
    const participationsA = await ctx.db
      .query("gameParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userIdA))
      .order("desc")
      .take(500);

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const pA of participationsA) {
      const pB = await ctx.db
        .query("gameParticipants")
        .withIndex("by_game", (q) => q.eq("gameId", pA.gameId))
        .filter((q) => q.eq(q.field("userId"), args.userIdB))
        .first();

      if (!pB) continue;

      if (pA.rank < pB.rank) wins++;
      else if (pA.rank > pB.rank) losses++;
      else draws++;
    }

    return { wins, losses, draws, totalGames: wins + losses + draws };
  },
});

// Accuracy breakdown by quarter — shots 1-5, 6-10, 11-15, 16-20 (public data, no auth required)
export const getAccuracyBreakdown = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const participations = await ctx.db
      .query("gameParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const quarters = [
      { label: "1-5", hits: 0, total: 0 },
      { label: "6-10", hits: 0, total: 0 },
      { label: "11-15", hits: 0, total: 0 },
      { label: "16-20", hits: 0, total: 0 },
    ];

    for (const p of participations) {
      const game = await ctx.db.get(p.gameId);
      if (!game) continue;

      const playerEntry = game.players.find((pl) => pl.userId === args.userId);
      if (!playerEntry) continue;

      const shots = playerEntry.shots;
      for (let q = 0; q < 4; q++) {
        const slice = shots.slice(q * 5, (q + 1) * 5);
        for (const s of slice) {
          if (s !== null) {
            quarters[q].total++;
            if (s === true) quarters[q].hits++;
          }
        }
      }
    }

    return quarters.map((q) => ({
      label: q.label,
      accuracy: q.total > 0 ? q.hits / q.total : 0,
      hits: q.hits,
      total: q.total,
    }));
  },
});

// Compact scouting data for pre-match card with optional embedded H2H (public data, no auth required)
export const getScoutingData = query({
  args: { userId: v.id("users"), vsUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const stats = await ctx.db
      .query("playerStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Embedded lightweight H2H if vsUserId provided
    let h2h: { wins: number; losses: number; draws: number; totalGames: number } | null = null;
    const vsUserId = args.vsUserId;
    if (vsUserId && vsUserId !== args.userId) {
      const participationsA = await ctx.db
        .query("gameParticipants")
        .withIndex("by_user", (q) => q.eq("userId", vsUserId))
        .order("desc")
        .take(500);

      let wins = 0;
      let losses = 0;
      let draws = 0;

      for (const pA of participationsA) {
        const pB = await ctx.db
          .query("gameParticipants")
          .withIndex("by_game", (q) => q.eq("gameId", pA.gameId))
          .filter((q) => q.eq(q.field("userId"), args.userId))
          .first();

        if (!pB) continue;
        if (pA.rank < pB.rank) wins++;
        else if (pA.rank > pB.rank) losses++;
        else draws++;
      }

      h2h = { wins, losses, draws, totalGames: wins + losses + draws };
    }

    if (!stats) {
      return {
        user: { fullName: user.fullName, username: user.username },
        stats: null,
        h2h,
      };
    }

    return {
      user: { fullName: user.fullName, username: user.username },
      stats: {
        rating: stats.rating,
        totalGames: stats.totalGames,
        totalWins: stats.totalWins,
        avgAccuracy: stats.avgAccuracy,
        currentStreak: stats.currentStreak,
        last10Results: stats.last10Results,
      },
      h2h,
    };
  },
});

// Rating changes for all registered players in a specific game (public data, no auth required)
export const getGameRatingChanges = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("gameParticipants")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const results = await Promise.all(
      participants.map(async (p) => {
        const snapshot = await ctx.db
          .query("ratingSnapshots")
          .withIndex("by_user_game", (q) =>
            q.eq("userId", p.userId).eq("gameId", args.gameId)
          )
          .first();

        return {
          userId: p.userId as string,
          ratingAfter: snapshot?.rating ?? null,
          ratingChange: snapshot?.ratingChange ?? null,
        };
      })
    );

    return results;
  },
});
