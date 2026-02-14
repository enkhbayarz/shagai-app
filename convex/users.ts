import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getOptionalAuthUser, requireAdmin } from "./auth";

// Get the currently authenticated user (no args needed)
// Returns null if user doesn't exist in Convex (for seamless auto-creation flow)
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getOptionalAuthUser(ctx);
  },
});

// Create or get user by Clerk ID (derived from auth token)
export const createOrGetUser = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const clerkId = identity.subject;

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId,
      email: args.email,
      fullName: args.fullName,
      username: args.username,
      role: "user",
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Clerk ID (kept for backward compatibility)
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    // Users can only look up themselves
    if (identity.subject !== args.clerkId) {
      throw new Error("Unauthorized");
    }
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID (public, for displaying names — strips PII)
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
});

// Search users by name or username (auth required, strips PII)
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);

    const searchTerm = args.query.toLowerCase();
    const users = await ctx.db.query("users").take(500);

    return users
      .filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm) ||
          user.username?.toLowerCase().includes(searchTerm)
      )
      .map((user) => ({
        _id: user._id,
        _creationTime: user._creationTime,
        fullName: user.fullName,
        username: user.username,
        createdAt: user.createdAt,
      }));
  },
});

// Get user by username (public, for profile pages — strips PII)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
});

// Get user by email (admin only)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// List all users (admin only)
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 100;
    return await ctx.db.query("users").order("desc").take(limit);
  },
});

// Quick add user (auth required — for adding players during game setup)
export const quickAdd = mutation({
  args: {
    fullName: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);

    const username = args.username || `archer_${crypto.randomUUID().slice(0, 8)}`;
    const email = args.email || "";

    const userId = await ctx.db.insert("users", {
      email,
      fullName: args.fullName,
      username,
      role: "user",
      createdAt: Date.now(),
    });

    return userId;
  },
});
