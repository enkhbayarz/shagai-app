import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getOptionalAuthUser } from "./auth";

// Teams backend - uses same database tables (clans, clanMembers, clanInvites)
// but exported as api.teams.* for consistent "team" naming

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// Create a new team
export const create = mutation({
  args: {
    name: v.string(),
    tag: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Validate tag
    if (args.tag.length < 2 || args.tag.length > 6) {
      throw new Error("Tag must be 2-6 characters");
    }

    // Check tag uniqueness
    const existingTag = await ctx.db
      .query("clans")
      .withIndex("by_tag", (q) => q.eq("tag", args.tag))
      .first();
    if (existingTag) {
      throw new Error("Tag already taken");
    }

    // Generate unique invite code
    let inviteCode = generateCode();
    let codeIsUnique = false;
    for (let i = 0; i < 5; i++) {
      const existing = await ctx.db
        .query("clans")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
      if (!existing) {
        codeIsUnique = true;
        break;
      }
      inviteCode = generateCode();
    }
    if (!codeIsUnique) {
      throw new Error("Failed to generate unique invite code. Please try again.");
    }

    const teamId = await ctx.db.insert("clans", {
      name: args.name,
      tag: args.tag,
      description: args.description,
      creatorId: user._id,
      createdAt: Date.now(),
      inviteCode,
    });

    // Add creator as leader
    await ctx.db.insert("clanMembers", {
      clanId: teamId,
      userId: user._id,
      role: "leader",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

// Send an invite to a user
export const invite = mutation({
  args: {
    teamId: v.id("clans"),
    inviteeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Verify inviter is a member
    const membership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", user._id)
      )
      .first();
    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Check invitee isn't already a member
    const existingMember = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", args.inviteeId)
      )
      .first();
    if (existingMember) {
      throw new Error("User is already a member");
    }

    // Check for existing pending invite
    const existingInvite = await ctx.db
      .query("clanInvites")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .filter((q) =>
        q.and(
          q.eq(q.field("inviteeId"), args.inviteeId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    if (existingInvite) {
      throw new Error("Invite already pending");
    }

    // Check member limit
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();
    if (members.length >= 50) {
      throw new Error("Team is full (50 members max)");
    }

    return await ctx.db.insert("clanInvites", {
      clanId: args.teamId,
      inviterId: user._id,
      inviteeId: args.inviteeId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Accept a pending invite
export const acceptInvite = mutation({
  args: {
    inviteId: v.id("clanInvites"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.inviteeId !== user._id || invite.status !== "pending") {
      throw new Error("Invalid invite");
    }

    // Check member limit
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", invite.clanId))
      .collect();
    if (members.length >= 50) {
      throw new Error("Team is full");
    }

    // Check not already a member
    const existing = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", invite.clanId).eq("userId", user._id)
      )
      .first();
    if (existing) {
      await ctx.db.patch(args.inviteId, { status: "accepted" });
      return;
    }

    await ctx.db.insert("clanMembers", {
      clanId: invite.clanId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    await ctx.db.patch(args.inviteId, { status: "accepted" });
  },
});

// Decline a pending invite
export const declineInvite = mutation({
  args: {
    inviteId: v.id("clanInvites"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.inviteeId !== user._id || invite.status !== "pending") {
      throw new Error("Invalid invite");
    }
    await ctx.db.patch(args.inviteId, { status: "declined" });
  },
});

// Leave a team
export const leave = mutation({
  args: {
    teamId: v.id("clans"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const membership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", user._id)
      )
      .first();
    if (!membership) {
      throw new Error("Not a member");
    }

    if (membership.role === "leader") {
      // Find other members
      const allMembers = await ctx.db
        .query("clanMembers")
        .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
        .collect();
      const others = allMembers.filter((m) => m.userId !== user._id);

      if (others.length === 0) {
        // No other members - delete the team
        const invites = await ctx.db
          .query("clanInvites")
          .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
          .collect();
        for (const inv of invites) {
          await ctx.db.delete(inv._id);
        }
        await ctx.db.delete(membership._id);
        await ctx.db.delete(args.teamId);
        return;
      }

      // Transfer leadership to oldest member
      const oldest = others.sort((a, b) => a.joinedAt - b.joinedAt)[0];
      await ctx.db.patch(oldest._id, { role: "leader" });
      await ctx.db.patch(args.teamId, { creatorId: oldest.userId });
    }

    await ctx.db.delete(membership._id);
  },
});

// Kick a member (leader only)
export const kick = mutation({
  args: {
    teamId: v.id("clans"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Verify leader
    const leaderMembership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", user._id)
      )
      .first();
    if (!leaderMembership || leaderMembership.role !== "leader") {
      throw new Error("Only the leader can kick members");
    }

    // Find target membership
    const targetMembership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", args.targetUserId)
      )
      .first();
    if (!targetMembership) {
      throw new Error("User is not a member");
    }
    if (targetMembership.role === "leader") {
      throw new Error("Cannot kick the leader");
    }

    await ctx.db.delete(targetMembership._id);
  },
});

// Delete a team (creator only)
export const deleteTeam = mutation({
  args: {
    teamId: v.id("clans"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team || team.creatorId !== user._id) {
      throw new Error("Only the creator can delete the team");
    }

    // Delete all members
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }

    // Delete all invites
    const invites = await ctx.db
      .query("clanInvites")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();
    for (const inv of invites) {
      await ctx.db.delete(inv._id);
    }

    await ctx.db.delete(args.teamId);
  },
});

// Regenerate invite code (leader only)
export const regenerateInviteCode = mutation({
  args: {
    teamId: v.id("clans"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const membership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", user._id)
      )
      .first();
    if (!membership || membership.role !== "leader") {
      throw new Error("Only the leader can regenerate the invite code");
    }

    let newCode = generateCode();
    let codeIsUnique = false;
    for (let i = 0; i < 5; i++) {
      const existing = await ctx.db
        .query("clans")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", newCode))
        .first();
      if (!existing) {
        codeIsUnique = true;
        break;
      }
      newCode = generateCode();
    }
    if (!codeIsUnique) {
      throw new Error("Failed to generate unique invite code. Please try again.");
    }

    await ctx.db.patch(args.teamId, { inviteCode: newCode });
    return newCode;
  },
});

// Join a team by invite code
export const joinByCode = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const team = await ctx.db
      .query("clans")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();
    if (!team) {
      throw new Error("Invalid invite code");
    }

    // Check not already a member
    const existing = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", team._id).eq("userId", user._id)
      )
      .first();
    if (existing) {
      throw new Error("Already a member");
    }

    // Check member limit
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", team._id))
      .collect();
    if (members.length >= 50) {
      throw new Error("Team is full (50 members max)");
    }

    await ctx.db.insert("clanMembers", {
      clanId: team._id,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    return team._id;
  },
});

// Search teams by name
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    const teams = await ctx.db.query("clans").take(100);

    return teams
      .filter((team) => team.name.toLowerCase().includes(searchTerm))
      .slice(0, 10)
      .map((team) => ({
        _id: team._id,
        name: team.name,
        tag: team.tag,
      }));
  },
});

// List all teams with member counts (public, strips inviteCode)
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const teams = await ctx.db.query("clans").order("desc").take(limit);

    const results = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("clanMembers")
          .withIndex("by_clan", (q) => q.eq("clanId", team._id))
          .collect();
        const creator = await ctx.db.get(team.creatorId);
        return {
          _id: team._id,
          _creationTime: team._creationTime,
          name: team.name,
          tag: team.tag,
          description: team.description,
          creatorId: team.creatorId,
          createdAt: team.createdAt,
          memberCount: members.length,
          creatorName: creator?.username ?? "unknown",
        };
      })
    );

    return results;
  },
});

// Get a single team with details (inviteCode only for members)
export const get = query({
  args: { id: v.id("clans") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.id);
    if (!team) return null;

    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", team._id))
      .collect();
    const creator = await ctx.db.get(team.creatorId);

    // Only include inviteCode if the requester is a team member
    const user = await getOptionalAuthUser(ctx);
    const isMember = user
      ? members.some((m) => m.userId === user._id)
      : false;

    return {
      _id: team._id,
      _creationTime: team._creationTime,
      name: team.name,
      tag: team.tag,
      description: team.description,
      creatorId: team.creatorId,
      createdAt: team.createdAt,
      memberCount: members.length,
      creatorName: creator?.username ?? "unknown",
      ...(isMember && { inviteCode: team.inviteCode }),
    };
  },
});

// Get team by invite code (public, strips inviteCode)
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("clans")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();
    if (!team) return null;

    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", team._id))
      .collect();

    return {
      _id: team._id,
      _creationTime: team._creationTime,
      name: team.name,
      tag: team.tag,
      description: team.description,
      createdAt: team.createdAt,
      memberCount: members.length,
    };
  },
});

// Get all members of a team with user info
export const getMembers = query({
  args: { teamId: v.id("clans") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();

    const results = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          _id: m._id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          fullName: user?.fullName ?? "Unknown",
          username: user?.username ?? "unknown",
        };
      })
    );

    // Sort: leader first, then by join date
    return results.sort((a, b) => {
      if (a.role === "leader" && b.role !== "leader") return -1;
      if (a.role !== "leader" && b.role === "leader") return 1;
      return a.joinedAt - b.joinedAt;
    });
  },
});

// Get member stats (total games, total hits, avg score for each member)
export const getMemberStats = query({
  args: { teamId: v.id("clans") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();

    const memberUserIds = new Set(members.map((m) => m.userId));

    // Scan finished games
    const finishedGames = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", true))
      .collect();

    const statsMap = new Map<
      string,
      { totalGames: number; totalHits: number }
    >();

    for (const game of finishedGames) {
      for (const player of game.players) {
        if (player.userId && memberUserIds.has(player.userId)) {
          const hits = player.shots.filter((s) => s === true).length;
          const existing = statsMap.get(player.userId);
          if (existing) {
            existing.totalGames += 1;
            existing.totalHits += hits;
          } else {
            statsMap.set(player.userId, { totalGames: 1, totalHits: hits });
          }
        }
      }
    }

    const result: Record<
      string,
      { totalGames: number; totalHits: number; avgScore: number }
    > = {};
    for (const [userId, stats] of statsMap) {
      result[userId] = {
        ...stats,
        avgScore:
          stats.totalGames > 0
            ? Math.round((stats.totalHits / stats.totalGames) * 10) / 10
            : 0,
      };
    }

    return result;
  },
});

// Get teams the current user belongs to (auth required, strips inviteCode)
export const myTeams = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    const memberships = await ctx.db
      .query("clanMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const team = await ctx.db.get(m.clanId);
        if (!team) return null;
        const members = await ctx.db
          .query("clanMembers")
          .withIndex("by_clan", (q) => q.eq("clanId", team._id))
          .collect();
        return {
          _id: team._id,
          _creationTime: team._creationTime,
          name: team.name,
          tag: team.tag,
          description: team.description,
          creatorId: team.creatorId,
          createdAt: team.createdAt,
          memberCount: members.length,
          myRole: m.role,
        };
      })
    );

    return results.filter(Boolean);
  },
});

// Get pending invites for the current user (auth required)
export const myInvites = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    const invites = await ctx.db
      .query("clanInvites")
      .withIndex("by_invitee_status", (q) =>
        q.eq("inviteeId", user._id).eq("status", "pending")
      )
      .collect();

    const results = await Promise.all(
      invites.map(async (inv) => {
        const team = await ctx.db.get(inv.clanId);
        const inviter = await ctx.db.get(inv.inviterId);
        return {
          _id: inv._id,
          teamId: inv.clanId,
          teamName: team?.name ?? "Unknown",
          teamTag: team?.tag ?? "???",
          inviterName: inviter?.fullName ?? "Unknown",
          createdAt: inv.createdAt,
        };
      })
    );

    return results;
  },
});

// Get pending invites for a specific team (auth required, must be member)
export const getTeamInvites = query({
  args: { teamId: v.id("clans") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Verify requester is a team member
    const membership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.teamId).eq("userId", user._id)
      )
      .first();
    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    const invites = await ctx.db
      .query("clanInvites")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const results = await Promise.all(
      invites.map(async (inv) => {
        const invitee = await ctx.db.get(inv.inviteeId);
        return {
          _id: inv._id,
          inviteeId: inv.inviteeId,
          inviteeName: invitee?.fullName ?? "Unknown",
          inviteeUsername: invitee?.username ?? "unknown",
          createdAt: inv.createdAt,
        };
      })
    );

    return results;
  },
});

// Auto-detect team matches: games where ALL players are team members
export const getTeamMatches = query({
  args: { teamId: v.id("clans"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();
    const memberUserIds = new Set(members.map((m) => m.userId));

    if (memberUserIds.size === 0) return [];

    // Scan recent finished games
    const recentGames = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", true))
      .order("desc")
      .take(200);

    const teamMatches = [];
    for (const game of recentGames) {
      const allTeamMembers =
        game.players.length > 0 &&
        game.players.every(
          (p) => p.userId && memberUserIds.has(p.userId)
        );
      if (allTeamMembers) {
        teamMatches.push({
          _id: game._id,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          playerCount: game.playerCount,
          players: game.players.map((p) => ({
            name: p.name,
            userId: p.userId,
            score: p.shots.filter((s) => s === true).length,
          })),
        });
      }
      if (teamMatches.length >= limit) break;
    }

    return teamMatches;
  },
});

// Add test players to a team (admin only, for testing purposes)
export const addTestPlayers = mutation({
  args: {
    teamId: v.id("clans"),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    // Only allow admins to add test players
    const user = await getAuthUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only admins can add test players");
    }

    // Limit count to prevent abuse
    if (args.count < 1 || args.count > 10) {
      throw new Error("Count must be between 1 and 10");
    }

    // Verify team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check current member count to avoid exceeding limit
    const currentMembers = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();

    if (currentMembers.length + args.count > 50) {
      throw new Error(`Cannot add ${args.count} players. Team would exceed 50 member limit.`);
    }

    const testNames = [
      "Батбаяр", "Болд", "Ганбат", "Дорж", "Энхбаатар",
      "Жавхлан", "Мөнхбат", "Наранбаатар", "Отгонбаяр", "Пүрэвдорж",
    ];

    const addedUserIds: string[] = [];

    for (let i = 0; i < args.count; i++) {
      const name = testNames[i % testNames.length];
      const uniqueSuffix = `${Date.now()}_${i}`;

      // Create test user
      const userId = await ctx.db.insert("users", {
        email: `test_${uniqueSuffix}@test.com`,
        fullName: `${name} (Test)`,
        username: `test_${uniqueSuffix}`,
        role: "user",
        createdAt: Date.now(),
      });

      // Add to team
      await ctx.db.insert("clanMembers", {
        clanId: args.teamId,
        userId,
        role: "member",
        joinedAt: Date.now(),
      });

      addedUserIds.push(userId);
    }

    return { addedCount: addedUserIds.length };
  },
});

// Get aggregate team stats
export const getTeamStats = query({
  args: { teamId: v.id("clans") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan", (q) => q.eq("clanId", args.teamId))
      .collect();
    const memberUserIds = new Set(members.map((m) => m.userId));

    if (memberUserIds.size === 0) {
      return { memberCount: 0, totalMatches: 0, avgScore: 0 };
    }

    // Scan finished games for team matches
    const finishedGames = await ctx.db
      .query("games")
      .withIndex("by_finished", (q) => q.eq("isFinished", true))
      .order("desc")
      .take(200);

    let totalMatches = 0;
    let totalScore = 0;
    let totalPlayers = 0;

    for (const game of finishedGames) {
      const allTeamMembers =
        game.players.length > 0 &&
        game.players.every(
          (p) => p.userId && memberUserIds.has(p.userId)
        );
      if (allTeamMembers) {
        totalMatches++;
        for (const p of game.players) {
          totalScore += p.shots.filter((s) => s === true).length;
          totalPlayers++;
        }
      }
    }

    return {
      memberCount: members.length,
      totalMatches,
      avgScore:
        totalPlayers > 0
          ? Math.round((totalScore / totalPlayers) * 10) / 10
          : 0,
    };
  },
});
