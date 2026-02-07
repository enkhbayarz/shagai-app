import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current settings
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    return settings;
  },
});

// Save/update email setting
export const saveEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("settings", {
        email: args.email,
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});
