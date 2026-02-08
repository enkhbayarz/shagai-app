import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores registered archers
  users: defineTable({
    clerkId: v.optional(v.string()), // Optional for manually added users
    email: v.string(),
    fullName: v.string(),
    username: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))), // Default "user"
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  // Settings table - stores user email configuration
  settings: defineTable({
    userId: v.optional(v.id("users")),
    email: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Clans table - archery clans/teams
  clans: defineTable({
    name: v.string(),
    tag: v.string(), // 2-6 character short tag
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    createdAt: v.number(),
    inviteCode: v.string(), // Unique code for invite links
  })
    .index("by_creator", ["creatorId"])
    .index("by_tag", ["tag"])
    .index("by_invite_code", ["inviteCode"]),

  // Clan members table - tracks clan membership
  clanMembers: defineTable({
    clanId: v.id("clans"),
    userId: v.id("users"),
    role: v.union(v.literal("leader"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_clan", ["clanId"])
    .index("by_user", ["userId"])
    .index("by_clan_and_user", ["clanId", "userId"]),

  // Clan invites table - pending invitations
  clanInvites: defineTable({
    clanId: v.id("clans"),
    inviterId: v.id("users"),
    inviteeId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.number(),
  })
    .index("by_invitee_status", ["inviteeId", "status"])
    .index("by_clan", ["clanId"]),

  // Player stats table - precomputed stats per player (updated on game finish)
  playerStats: defineTable({
    userId: v.id("users"),
    totalGames: v.number(),
    totalWins: v.number(),
    totalHits: v.number(),
    totalShots: v.number(), // totalGames * 20
    avgAccuracy: v.number(), // totalHits / totalShots (0-1)
    currentStreak: v.number(), // current win streak (negative = loss streak)
    bestStreak: v.number(), // best win streak ever
    last10Results: v.array(v.boolean()), // last 10 W/L results, newest first
    rating: v.number(), // ELO rating (starts at 1500)
    ratingDeviation: v.number(), // Glicko-2 RD (starts at 350)
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_rating", ["rating"])
    .index("by_totalHits", ["totalHits"]),

  // Game participants join table - links users to games they played in
  gameParticipants: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    score: v.number(), // total hits in that game
    rank: v.number(), // 1 = winner, 2 = second, etc. (ties share same rank)
  })
    .index("by_user", ["userId"])
    .index("by_game", ["gameId"]),

  // Rating snapshots - one per player per game, for rating history chart
  ratingSnapshots: defineTable({
    userId: v.id("users"),
    gameId: v.id("games"),
    rating: v.number(), // rating after this game
    ratingChange: v.number(), // +/- change from this game
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_user_game", ["userId", "gameId"]),

  // Achievements - unlocked milestone badges
  achievements: defineTable({
    userId: v.id("users"),
    achievementCode: v.string(),
    unlockedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_code", ["userId", "achievementCode"]),

  // Games table - stores game sessions
  games: defineTable({
    creatorId: v.optional(v.id("users")), // Who created the game
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    playerCount: v.number(),
    players: v.array(
      v.object({
        name: v.string(),
        userId: v.optional(v.id("users")), // Link to registered user (optional)
        shots: v.array(v.union(v.boolean(), v.null())), // true=hit, false=miss, null=not shot
      })
    ),
    currentRound: v.number(), // 1-20
    currentPlayerIndex: v.number(), // 0 to playerCount-1
    isFinished: v.boolean(),
    result: v.optional(
      v.array(
        v.object({
          userId: v.optional(v.id("users")),
          name: v.string(),
          score: v.number(),
          rank: v.number(),
        })
      )
    ),
  })
    .index("by_creator", ["creatorId"])
    .index("by_finished", ["isFinished"]),
});
