import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUser, getOptionalAuthUser, requireAdmin } from "./auth";

// Create a new game
export const create = mutation({
  args: {
    playerCount: v.number(),
    players: v.array(
      v.object({
        name: v.string(),
        userId: v.optional(v.id("users")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx);

    const players = args.players.map((player) => ({
      name: player.name,
      userId: player.userId,
      shots: Array(20).fill(null) as (boolean | null)[],
    }));

    const gameId = await ctx.db.insert("games", {
      creatorId: user?._id,
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

// Get a game by ID (auth required — must be creator or participant)
export const get = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const game = await ctx.db.get(args.id);
    if (!game) return null;

    const isCreator = game.creatorId === user._id;
    const isParticipant = game.players.some((p) => p.userId === user._id);
    if (!isCreator && !isParticipant) {
      throw new Error("Unauthorized: not a participant of this game");
    }

    return game;
  },
});

// Get a game by ID for public share page (no auth required, finished games only)
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

// Record a shot (auth required — must be game creator)
export const recordShot = mutation({
  args: {
    gameId: v.id("games"),
    isHit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game || game.isFinished) return null;

    if (game.creatorId !== user._id) {
      throw new Error("Unauthorized: only the game creator can record shots");
    }

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

// Edit a past shot (auth required — must be game creator)
export const editShot = mutation({
  args: {
    gameId: v.id("games"),
    playerIndex: v.number(),
    shotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    if (game.creatorId !== user._id) {
      throw new Error("Unauthorized: only the game creator can edit shots");
    }

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

// Get recent games created by the authenticated user
export const listByCreator = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("games")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .take(limit);
  },
});

// Get games where authenticated user participated
export const listByPlayer = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const limit = args.limit ?? 20;
    const allGames = await ctx.db.query("games").order("desc").take(100);

    const userGames = allGames.filter((game) =>
      game.players.some((player) => player.userId === user._id)
    );

    return userGames.slice(0, limit);
  },
});

// List all games (admin only)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 50;
    return await ctx.db.query("games").order("desc").take(limit);
  },
});

// Get recent finished games (public)
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

// Get all live (in-progress) games with summary data (public)
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

    const filtered = args.playerCount
      ? games.filter((g) => g.playerCount === args.playerCount)
      : games;

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

// Get full game data for spectator view (public, strips userId/creatorId)
export const getLive = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game) return null;
    return {
      _id: game._id,
      _creationTime: game._creationTime,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      playerCount: game.playerCount,
      currentRound: game.currentRound,
      currentPlayerIndex: game.currentPlayerIndex,
      isFinished: game.isFinished,
      players: game.players.map((p) => ({
        name: p.name,
        shots: p.shots,
      })),
      result: game.result?.map((r) => ({
        name: r.name,
        score: r.score,
        rank: r.rank,
      })),
    };
  },
});
