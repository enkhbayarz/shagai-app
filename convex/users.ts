import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or get user by Clerk ID
export const createOrGetUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      fullName: args.fullName,
      username: args.username,
      role: "user", // Default role
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search users by name or username
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();

    // Get all users and filter (for small datasets)
    const users = await ctx.db.query("users").collect();

    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// List all users (for admin)
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db.query("users").order("desc").take(limit);
  },
});

// Quick add user (for adding players during game setup)
export const quickAdd = mutation({
  args: {
    fullName: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate a unique username if not provided
    const username = args.username || `archer_${crypto.randomUUID().slice(0, 8)}`;
    const email = args.email || "";

    const userId = await ctx.db.insert("users", {
      // clerkId is optional, omit for manually added users
      email,
      fullName: args.fullName,
      username,
      role: "user", // Default role
      createdAt: Date.now(),
    });

    return userId;
  },
});
