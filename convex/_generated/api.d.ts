/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as backfill from "../backfill.js";
import type * as dashboard from "../dashboard.js";
import type * as games from "../games.js";
import type * as profiles from "../profiles.js";
import type * as settings from "../settings.js";
import type * as stats from "../stats.js";
import type * as teamGames from "../teamGames.js";
import type * as teamStats from "../teamStats.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  backfill: typeof backfill;
  dashboard: typeof dashboard;
  games: typeof games;
  profiles: typeof profiles;
  settings: typeof settings;
  stats: typeof stats;
  teamGames: typeof teamGames;
  teamStats: typeof teamStats;
  teams: typeof teams;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
