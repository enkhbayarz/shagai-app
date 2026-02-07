import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Settings table - stores email configuration
  settings: defineTable({
    email: v.string(),
    updatedAt: v.number(),
  }),

  // Games table - stores game sessions
  games: defineTable({
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    playerCount: v.number(),
    players: v.array(
      v.object({
        name: v.string(),
        shots: v.array(v.union(v.boolean(), v.null())), // true=hit, false=miss, null=not shot
      })
    ),
    currentRound: v.number(), // 1-20
    currentPlayerIndex: v.number(), // 0 to playerCount-1
    isFinished: v.boolean(),
  }),
});
