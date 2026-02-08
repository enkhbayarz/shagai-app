import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./auth";

// Get current user's settings
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return settings;
  },
});

// Save/update email setting for the current user
export const saveEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("settings", {
        userId: user._id,
        email: args.email,
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});
