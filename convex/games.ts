import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new game
export const create = mutation({
  args: {
    playerCount: v.number(),
    playerNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const players = args.playerNames.map((name) => ({
      name,
      shots: Array(20).fill(null) as (boolean | null)[],
    }));

    const gameId = await ctx.db.insert("games", {
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

// Get recent games
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("games")
      .order("desc")
      .take(limit);
  },
});
