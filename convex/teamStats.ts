import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

/**
 * Calculate individual player statistics from a team game
 */
function calculatePlayerStats(
  game: Doc<"teamGames">,
  team: "home" | "away",
  playerIndex: number
): {
  totalShots: number;
  totalHits: number;
  set1Shots: number;
  set1Hits: number;
  set2Shots: number;
  set2Hits: number;
} {
  let totalShots = 0;
  let totalHits = 0;
  let set1Shots = 0;
  let set1Hits = 0;
  let set2Shots = 0;
  let set2Hits = 0;

  for (const set of game.sets) {
    for (const phase of set.phases) {
      for (const shooter of phase.shooters) {
        if (shooter.team === team && shooter.playerIndex === playerIndex) {
          for (const shot of shooter.shots) {
            if (shot === true) {
              totalHits++;
              totalShots++;
              if (set.setNumber === 1) {
                set1Hits++;
                set1Shots++;
              } else {
                set2Hits++;
                set2Shots++;
              }
            } else if (shot === false) {
              totalShots++;
              if (set.setNumber === 1) {
                set1Shots++;
              } else {
                set2Shots++;
              }
            }
            // "skip" and null shots are not counted
          }
        }
      }
    }
  }

  return { totalShots, totalHits, set1Shots, set1Hits, set2Shots, set2Hits };
}

/**
 * Called when a team game finishes.
 * Updates teamGameParticipants and teamStats tables.
 */
export const updateTeamStatsOnGameFinish = internalMutation({
  args: { teamGameId: v.id("teamGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.teamGameId);
    if (!game || game.status !== "finished") return;

    // Check if already processed (idempotent check)
    const existingParticipants = await ctx.db
      .query("teamGameParticipants")
      .withIndex("by_game", (q) => q.eq("teamGameId", args.teamGameId))
      .first();
    if (existingParticipants) {
      // Already processed
      return;
    }

    const winner = game.result?.winner;

    // Process home team players
    const homePlayers = game.homeTeam.players;
    for (let i = 0; i < homePlayers.length; i++) {
      const player = homePlayers[i];

      // Skip bench players who never entered the game
      if (player.isSubstitute && player.replacedPlayerIndex === undefined) {
        // This is the original bench slot that wasn't used OR was the source of substitution
        // Check if this player has any shots
        const stats = calculatePlayerStats(game, "home", i);
        if (stats.totalShots === 0) continue;
      }

      const stats = calculatePlayerStats(game, "home", i);

      await ctx.db.insert("teamGameParticipants", {
        teamGameId: args.teamGameId,
        userId: player.userId,
        clanId: game.homeClanId,
        playerName: player.name,
        team: "home",
        totalShots: stats.totalShots,
        totalHits: stats.totalHits,
        set1Shots: stats.set1Shots,
        set1Hits: stats.set1Hits,
        set2Shots: stats.set2Shots,
        set2Hits: stats.set2Hits,
        wasSubstitute: player.isSubstitute,
        wonMatch: winner === "home",
      });
    }

    // Process away team players
    const awayPlayers = game.awayTeam.players;
    for (let i = 0; i < awayPlayers.length; i++) {
      const player = awayPlayers[i];

      // Skip bench players who never entered the game
      if (player.isSubstitute && player.replacedPlayerIndex === undefined) {
        const stats = calculatePlayerStats(game, "away", i);
        if (stats.totalShots === 0) continue;
      }

      const stats = calculatePlayerStats(game, "away", i);

      await ctx.db.insert("teamGameParticipants", {
        teamGameId: args.teamGameId,
        userId: player.userId,
        clanId: game.awayClanId,
        playerName: player.name,
        team: "away",
        totalShots: stats.totalShots,
        totalHits: stats.totalHits,
        set1Shots: stats.set1Shots,
        set1Hits: stats.set1Hits,
        set2Shots: stats.set2Shots,
        set2Hits: stats.set2Hits,
        wasSubstitute: player.isSubstitute,
        wonMatch: winner === "away",
      });
    }

    // Update clan stats if clans are linked
    if (game.homeClanId) {
      await updateClanStats(ctx, game.homeClanId, game, "home");
    }
    if (game.awayClanId) {
      await updateClanStats(ctx, game.awayClanId, game, "away");
    }
  },
});

/**
 * Update or create clan statistics
 */
async function updateClanStats(
  ctx: any,
  clanId: Id<"clans">,
  game: Doc<"teamGames">,
  team: "home" | "away"
) {
  const isWin = game.result?.winner === team;
  const result = game.result!;

  // Calculate stats for this game
  const setsWon = team === "home"
    ? (result.homeSet1Score > result.awaySet1Score ? 1 : 0) +
      (result.homeSet2Score > result.awaySet2Score ? 1 : 0)
    : (result.awaySet1Score > result.homeSet1Score ? 1 : 0) +
      (result.awaySet2Score > result.homeSet2Score ? 1 : 0);

  const setsLost = 2 - setsWon;

  const pointsScored = team === "home"
    ? result.homeSet1Score + result.homeSet2Score
    : result.awaySet1Score + result.awaySet2Score;

  const pointsConceded = team === "home"
    ? result.awaySet1Score + result.awaySet2Score
    : result.homeSet1Score + result.homeSet2Score;

  const pulledPoints = team === "home"
    ? result.homeTotalPulled
    : result.awayTotalPulled;

  // Get existing stats
  const existingStats = await ctx.db
    .query("teamStats")
    .withIndex("by_clan", (q: any) => q.eq("clanId", clanId))
    .unique();

  if (existingStats) {
    // Update existing stats
    const newStreak = isWin
      ? Math.max(existingStats.currentStreak, 0) + 1
      : Math.min(existingStats.currentStreak, 0) - 1;

    await ctx.db.patch(existingStats._id, {
      totalGames: existingStats.totalGames + 1,
      totalWins: existingStats.totalWins + (isWin ? 1 : 0),
      totalSetsWon: existingStats.totalSetsWon + setsWon,
      totalSetsLost: existingStats.totalSetsLost + setsLost,
      totalPointsScored: existingStats.totalPointsScored + pointsScored,
      totalPointsConceded: existingStats.totalPointsConceded + pointsConceded,
      totalPulled: existingStats.totalPulled + pulledPoints,
      currentStreak: newStreak,
      bestStreak: Math.max(existingStats.bestStreak, newStreak),
      updatedAt: Date.now(),
    });
  } else {
    // Create new stats entry
    await ctx.db.insert("teamStats", {
      clanId,
      totalGames: 1,
      totalWins: isWin ? 1 : 0,
      totalSetsWon: setsWon,
      totalSetsLost: setsLost,
      totalPointsScored: pointsScored,
      totalPointsConceded: pointsConceded,
      totalPulled: pulledPoints,
      currentStreak: isWin ? 1 : -1,
      bestStreak: isWin ? 1 : 0,
      updatedAt: Date.now(),
    });
  }
}
