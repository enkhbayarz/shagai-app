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
  })
    .index("by_creator", ["creatorId"])
    .index("by_finished", ["isFinished"]),
});
