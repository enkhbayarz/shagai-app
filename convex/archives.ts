// convex/archives.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    data: v.object({
      title: v.string(),
      organizerName: v.string(),
      organizerContact: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      locationName: v.string(),
      mapAddress: v.string(),
      country: v.string(),
      city: v.string(),
      state: v.string(),
      teams: v.array(v.any()),
      teamRankings: v.any(),
      individualRankings: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated / Системд нэвтэрнэ үү!");

    return await ctx.db.insert("archives", {
      ...args.data,
      userId: identity.subject,
      createdAt: Date.now(),
    });
  },
});
// Update an existing record
export const update = mutation({
  args: {
    id: v.id("archives"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, data } = args;
    
    // Remove ID and internal fields from data before updating
    const { _id, _creationTime, ...rest } = data;

    await ctx.db.patch(id, rest);
    return id;
  },
});
export const get = query({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch the data
    const archives = await ctx.db
      .query("archives")
      .order("desc") // Shows newest competitions first
      .collect();

    return archives;
  },
});
export const remove = mutation({
  args: { id: v.id("archives") },
  handler: async (ctx, args) => {
    // Optional: Check if the user is authorized before deleting
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});