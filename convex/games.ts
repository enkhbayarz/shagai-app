import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Create a new game
export const create = mutation({
  args: {
    creatorId: v.optional(v.id("users")),
    playerCount: v.number(),
    players: v.array(
      v.object({
        name: v.string(),
        userId: v.optional(v.id("users")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const players = args.players.map((player) => ({
      name: player.name,
      userId: player.userId,
      shots: Array(20).fill(null) as (boolean | null)[],
    }));

    const gameId = await ctx.db.insert("games", {
      creatorId: args.creatorId,
      startedAt: Date.now(),
      playerCount: args.playerCount,
      players,
      currentRound: 1,
      currentPlayerIndex: 0,
      isFinished: false,
    });

    return gameId;
  },
});

// Get a game by ID
export const get = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get a game by ID for public share page (no auth required)
export const getPublic = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game || !game.isFinished) {
      return null;
    }
    return game;
  },
});

// Record a shot
export const recordShot = mutation({
  args: {
    gameId: v.id("games"),
    isHit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.isFinished) return null;

    const shotIndex = game.currentRound - 1;
    const players = [...game.players];
    players[game.currentPlayerIndex] = {
      ...players[game.currentPlayerIndex],
      shots: players[game.currentPlayerIndex].shots.map((shot, i) =>
        i === shotIndex ? args.isHit : shot
      ),
    };

    // Calculate next state
    let nextPlayerIndex = game.currentPlayerIndex + 1;
    let nextRound = game.currentRound;
    let isFinished = false;

    if (nextPlayerIndex >= game.playerCount) {
      // All players have shot this round
      if (game.currentRound >= 20) {
        isFinished = true;
      } else {
        nextRound = game.currentRound + 1;
        nextPlayerIndex = 0;
      }
    }

    await ctx.db.patch(args.gameId, {
      players,
      currentRound: nextRound,
      currentPlayerIndex: isFinished ? game.currentPlayerIndex : nextPlayerIndex,
      isFinished,
      ...(isFinished && { finishedAt: Date.now() }),
    });

    // Update player stats when game finishes
    if (isFinished) {
      await ctx.scheduler.runAfter(0, internal.stats.updateStatsOnGameFinish, {
        gameId: args.gameId,
      });
    }

    return { isFinished };
  },
});

// Edit a past shot (toggle hit/miss)
export const editShot = mutation({
  args: {
    gameId: v.id("games"),
    playerIndex: v.number(),
    shotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const players = [...game.players];
    const currentShot = players[args.playerIndex].shots[args.shotIndex];

    if (currentShot === null) return null; // Can't edit unshot

    players[args.playerIndex] = {
      ...players[args.playerIndex],
      shots: players[args.playerIndex].shots.map((shot, i) =>
        i === args.shotIndex ? !shot : shot
      ),
    };

    await ctx.db.patch(args.gameId, { players });
    return { success: true };
  },
});

// Get recent games (for logged in user)
export const listByCreator = query({
  args: { creatorId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("games")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .order("desc")
      .take(limit);
  },
});

// Get games where user participated
export const listByPlayer = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const allGames = await ctx.db.query("games").order("desc").take(100);

    // Filter games where this user is a player
    const userGames = allGames.filter((game) =>
      game.players.some((player) => player.userId === args.userId)
    );

    return userGames.slice(0, limit);
  },
});

// List all games (for admin)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db.query("games").order("desc").take(limit);
  },
});

// Get recent finished games
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", true))
      .order("desc")
      .take(limit);
  },
});

// Get all live (in-progress) games with summary data for the live page
export const listLive = query({
  args: {
    playerCount: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const games = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", false))
      .order("desc")
      .take(limit);

    // Apply playerCount filter if specified
    const filtered = args.playerCount
      ? games.filter((g) => g.playerCount === args.playerCount)
      : games;

    // Return with computed summary data for efficient card rendering
    return filtered.map((game) => ({
      _id: game._id,
      startedAt: game.startedAt,
      playerCount: game.playerCount,
      currentRound: game.currentRound,
      currentPlayerIndex: game.currentPlayerIndex,
      players: game.players.map((p) => ({
        name: p.name,
        score: p.shots.filter((s) => s === true).length,
      })),
      progressPercent: Math.round(
        (game.players.reduce(
          (sum, p) => sum + p.shots.filter((s) => s !== null).length,
          0
        ) /
          (game.playerCount * 20)) *
          100
      ),
    }));
  },
});

// Get full game data for spectator view (public, allows both live and finished)
export const getLive = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
