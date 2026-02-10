import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getOptionalAuthUser } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

type Team = "home" | "away";
type PhaseType = "niileg" | "shuvtraga" | "merge";
type Direction = "rtl" | "ltr";

interface ShooterConfig {
  team: Team;
  playerIndex: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate the shooter order for a phase based on phase type, direction, and cycle
 *
 * Turn order rules:
 * - Phase 1 (Niileg): direction RTL, Home starts
 * - Phase 2 (Shuvtraga): direction LTR, Away starts
 * - Phase 3 (Merge): direction RTL, Home starts
 *
 * Seating: A1, B1, A2, B2 (A=Home, B=Away) - alternating
 *
 * For 4v4:
 *   Phase 1: players 0,1 from each team
 *   Phase 2: players 2,3 from each team
 *   No Phase 3
 *
 * For 5v5:
 *   Phase 1: players 0,1 from each team
 *   Phase 2: players 2,3 from each team
 *   Phase 3: player 4 from each team
 *
 * For 6v6:
 *   Phase 1: players 0,1 from each team
 *   Phase 2: players 2,3 from each team
 *   Phase 3: players 4,5 from each team
 */
function generateShooterOrder(
  playersPerTeam: 4 | 5 | 6,
  phaseType: PhaseType,
  direction: Direction
): ShooterConfig[] {
  const shooters: ShooterConfig[] = [];

  if (phaseType === "niileg") {
    // Phase 1: players at indices 0, 1
    // Seating order: Home[0], Away[0], Home[1], Away[1]
    if (direction === "rtl") {
      // Right to left: start from rightmost (Home[0])
      // Order: Home[0] -> Away[0] -> Home[1] -> Away[1]
      shooters.push({ team: "home", playerIndex: 0 });
      shooters.push({ team: "away", playerIndex: 0 });
      shooters.push({ team: "home", playerIndex: 1 });
      shooters.push({ team: "away", playerIndex: 1 });
    } else {
      // Left to right: start from leftmost (Away[1])
      shooters.push({ team: "away", playerIndex: 1 });
      shooters.push({ team: "home", playerIndex: 1 });
      shooters.push({ team: "away", playerIndex: 0 });
      shooters.push({ team: "home", playerIndex: 0 });
    }
  } else if (phaseType === "shuvtraga") {
    // Phase 2: players at indices 2, 3
    // Seating order: Home[2], Away[2], Home[3], Away[3]
    if (direction === "ltr") {
      // Left to right: start from leftmost (Away[3])
      shooters.push({ team: "away", playerIndex: 3 });
      shooters.push({ team: "home", playerIndex: 3 });
      shooters.push({ team: "away", playerIndex: 2 });
      shooters.push({ team: "home", playerIndex: 2 });
    } else {
      shooters.push({ team: "home", playerIndex: 2 });
      shooters.push({ team: "away", playerIndex: 2 });
      shooters.push({ team: "home", playerIndex: 3 });
      shooters.push({ team: "away", playerIndex: 3 });
    }
  } else if (phaseType === "merge") {
    // Phase 3: depends on player count
    if (playersPerTeam === 6) {
      // Players at indices 4, 5
      if (direction === "rtl") {
        shooters.push({ team: "home", playerIndex: 4 });
        shooters.push({ team: "away", playerIndex: 4 });
        shooters.push({ team: "home", playerIndex: 5 });
        shooters.push({ team: "away", playerIndex: 5 });
      } else {
        shooters.push({ team: "away", playerIndex: 5 });
        shooters.push({ team: "home", playerIndex: 5 });
        shooters.push({ team: "away", playerIndex: 4 });
        shooters.push({ team: "home", playerIndex: 4 });
      }
    } else if (playersPerTeam === 5) {
      // Player at index 4 only
      if (direction === "rtl") {
        shooters.push({ team: "home", playerIndex: 4 });
        shooters.push({ team: "away", playerIndex: 4 });
      } else {
        shooters.push({ team: "away", playerIndex: 4 });
        shooters.push({ team: "home", playerIndex: 4 });
      }
    }
    // 4v4 has no merge phase
  }

  return shooters;
}

/**
 * Get the phase direction based on phase number
 * Phase 1: RTL (right to left)
 * Phase 2: LTR (left to right)
 * Phase 3: RTL (right to left)
 */
function getPhaseDirection(phaseNumber: number): Direction {
  return phaseNumber % 2 === 1 ? "rtl" : "ltr";
}

/**
 * Get the phases for a given player count
 */
function getPhasesForPlayerCount(playersPerTeam: 4 | 5 | 6): PhaseType[] {
  if (playersPerTeam === 4) {
    return ["niileg", "shuvtraga"];
  }
  return ["niileg", "shuvtraga", "merge"];
}

/**
 * Create initial phase structure for a set
 */
function createInitialPhase(
  playersPerTeam: 4 | 5 | 6,
  phaseType: PhaseType,
  phaseNumber: number,
  cycle: number
) {
  const direction = getPhaseDirection(phaseNumber);
  const shooterOrder = generateShooterOrder(playersPerTeam, phaseType, direction);

  return {
    phaseNumber,
    phaseType,
    cycle,
    direction,
    shooters: shooterOrder.map((s) => ({
      team: s.team,
      playerIndex: s.playerIndex,
      shots: [null, null, null, null] as (boolean | null)[],
    })),
    isCompleted: false,
  };
}

// ============================================
// MUTATIONS
// ============================================

// Create a new team game
export const create = mutation({
  args: {
    homeClanId: v.id("clans"),
    awayClanId: v.id("clans"),
    playersPerTeam: v.union(v.literal(4), v.literal(5), v.literal(6)),
    homeTeamPlayers: v.array(
      v.object({
        userId: v.id("users"),
        isSubstitute: v.boolean(),
      })
    ),
    awayTeamPlayers: v.array(
      v.object({
        userId: v.id("users"),
        isSubstitute: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Validate: user must be a member of home clan
    const homeMembership = await ctx.db
      .query("clanMembers")
      .withIndex("by_clan_and_user", (q) =>
        q.eq("clanId", args.homeClanId).eq("userId", user._id)
      )
      .first();
    if (!homeMembership) {
      throw new Error("You must be a member of the home clan to create a game");
    }

    // Validate: clans must be different
    if (args.homeClanId === args.awayClanId) {
      throw new Error("Home and away clans must be different");
    }

    // Validate player counts
    const homeRegularPlayers = args.homeTeamPlayers.filter((p) => !p.isSubstitute);
    const awayRegularPlayers = args.awayTeamPlayers.filter((p) => !p.isSubstitute);
    const homeSubstitutes = args.homeTeamPlayers.filter((p) => p.isSubstitute);
    const awaySubstitutes = args.awayTeamPlayers.filter((p) => p.isSubstitute);

    if (homeRegularPlayers.length !== args.playersPerTeam) {
      throw new Error(`Home team must have exactly ${args.playersPerTeam} regular players`);
    }
    if (awayRegularPlayers.length !== args.playersPerTeam) {
      throw new Error(`Away team must have exactly ${args.playersPerTeam} regular players`);
    }
    if (homeSubstitutes.length > 1) {
      throw new Error("Home team can have at most 1 substitute");
    }
    if (awaySubstitutes.length > 1) {
      throw new Error("Away team can have at most 1 substitute");
    }

    // Fetch user details for players
    const homeTeamPlayersWithNames = await Promise.all(
      args.homeTeamPlayers.map(async (p) => {
        const playerUser = await ctx.db.get(p.userId);
        return {
          userId: p.userId,
          name: playerUser?.fullName ?? "Unknown",
          isSubstitute: p.isSubstitute,
        };
      })
    );

    const awayTeamPlayersWithNames = await Promise.all(
      args.awayTeamPlayers.map(async (p) => {
        const playerUser = await ctx.db.get(p.userId);
        return {
          userId: p.userId,
          name: playerUser?.fullName ?? "Unknown",
          isSubstitute: p.isSubstitute,
        };
      })
    );

    // Create initial phase for Set 1
    const initialPhase = createInitialPhase(args.playersPerTeam, "niileg", 1, 1);

    // Create the game
    const gameId = await ctx.db.insert("teamGames", {
      homeClanId: args.homeClanId,
      awayClanId: args.awayClanId,
      playersPerTeam: args.playersPerTeam,
      creatorId: user._id,
      startedAt: Date.now(),
      homeTeam: {
        players: homeTeamPlayersWithNames,
      },
      awayTeam: {
        players: awayTeamPlayersWithNames,
      },
      sets: [
        {
          setNumber: 1,
          homeSide: "right",
          awaySide: "left",
          homeScore: 0,
          awayScore: 0,
          phases: [initialPhase],
          isCompleted: false,
        },
      ],
      currentSet: 1,
      currentPhaseIndex: 0,
      currentShooterIndex: 0,
      currentShotInTurn: 0,
      status: "in_progress",
    });

    return gameId;
  },
});

// Record a shot
export const recordShot = mutation({
  args: {
    gameId: v.id("teamGames"),
    isHit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status === "finished") throw new Error("Game is already finished");
    if (game.creatorId !== user._id) {
      throw new Error("Only the game creator can record shots");
    }

    // Handle golden point if active
    if (game.goldenPoint?.isActive) {
      return await handleGoldenPointShot(ctx, game, args.isHit);
    }

    const currentSetIndex = game.currentSet - 1;
    const sets = [...game.sets];
    const currentSet = { ...sets[currentSetIndex] };
    const phases = [...currentSet.phases];
    const currentPhase = { ...phases[game.currentPhaseIndex] };
    const shooters = [...currentPhase.shooters];
    const currentShooter = { ...shooters[game.currentShooterIndex] };

    // Record the shot
    const shots = [...currentShooter.shots];
    shots[game.currentShotInTurn] = args.isHit;
    currentShooter.shots = shots;
    shooters[game.currentShooterIndex] = currentShooter;
    currentPhase.shooters = shooters;

    // Update score if hit
    if (args.isHit) {
      if (currentShooter.team === "home") {
        currentSet.homeScore += 1;
      } else {
        currentSet.awayScore += 1;
      }
    }

    // Advance state
    let nextShotInTurn = game.currentShotInTurn + 1;
    let nextShooterIndex = game.currentShooterIndex;
    let nextPhaseIndex = game.currentPhaseIndex;
    let setEnded = false;
    let gameEnded = false;

    // Check if shooter's turn is complete (4 shots)
    if (nextShotInTurn >= 4) {
      nextShotInTurn = 0;
      nextShooterIndex += 1;

      // Check if phase is complete
      if (nextShooterIndex >= currentPhase.shooters.length) {
        currentPhase.isCompleted = true;
        nextShooterIndex = 0;

        // Check if set should end (either team reached 15)
        if (currentSet.homeScore >= 15 || currentSet.awayScore >= 15) {
          setEnded = true;
        } else {
          // Create next phase
          const phaseTypes = getPhasesForPlayerCount(game.playersPerTeam);
          const currentPhaseTypeIndex = phaseTypes.indexOf(currentPhase.phaseType as PhaseType);
          const nextPhaseTypeIndex = (currentPhaseTypeIndex + 1) % phaseTypes.length;
          const nextCycle = nextPhaseTypeIndex === 0 ? currentPhase.cycle + 1 : currentPhase.cycle;
          const nextPhaseType = phaseTypes[nextPhaseTypeIndex];
          const nextPhaseNumber = phases.length + 1;

          const newPhase = createInitialPhase(
            game.playersPerTeam,
            nextPhaseType,
            nextPhaseNumber,
            nextCycle
          );
          phases.push(newPhase);
          nextPhaseIndex = phases.length - 1;
        }
      }
    }

    phases[game.currentPhaseIndex] = currentPhase;
    currentSet.phases = phases;

    // Handle set end
    if (setEnded) {
      currentSet.isCompleted = true;

      // Calculate pulled points
      if (currentSet.homeScore > 15) {
        currentSet.homePulled = currentSet.homeScore - 15;
        currentSet.awayPulled = 0;
      } else if (currentSet.awayScore > 15) {
        currentSet.awayPulled = currentSet.awayScore - 15;
        currentSet.homePulled = 0;
      } else if (currentSet.homeScore === 15 && currentSet.awayScore < 15) {
        currentSet.homePulled = 15 - currentSet.awayScore;
        currentSet.awayPulled = 0;
      } else if (currentSet.awayScore === 15 && currentSet.homeScore < 15) {
        currentSet.awayPulled = 15 - currentSet.homeScore;
        currentSet.homePulled = 0;
      } else {
        // Both at 15, whoever reached first wins (we track this by winner field)
        currentSet.homePulled = 0;
        currentSet.awayPulled = 0;
      }

      currentSet.winner = currentSet.homeScore >= currentSet.awayScore ? "home" : "away";
    }

    sets[currentSetIndex] = currentSet;

    // Check if we need to start Set 2 or end the game
    let newCurrentSet = game.currentSet;
    if (setEnded) {
      if (game.currentSet === 1) {
        // Start Set 2
        newCurrentSet = 2;
        const initialPhaseSet2 = createInitialPhase(game.playersPerTeam, "niileg", 1, 1);
        sets.push({
          setNumber: 2,
          homeSide: "left", // Teams swap sides
          awaySide: "right",
          homeScore: 0,
          awayScore: 0,
          phases: [initialPhaseSet2],
          isCompleted: false,
        });
        nextPhaseIndex = 0;
        nextShooterIndex = 0;
        nextShotInTurn = 0;
      } else {
        // Set 2 ended - check for winner or golden point
        const set1 = sets[0];
        const set2 = sets[1];

        const homeTotalPulled = (set1.homePulled ?? 0) + (set2.homePulled ?? 0);
        const awayTotalPulled = (set1.awayPulled ?? 0) + (set2.awayPulled ?? 0);

        if (homeTotalPulled === awayTotalPulled) {
          // Tie - need golden point
          await ctx.db.patch(args.gameId, {
            sets,
            currentSet: 2,
            currentPhaseIndex: nextPhaseIndex,
            currentShooterIndex: nextShooterIndex,
            currentShotInTurn: nextShotInTurn,
            goldenPoint: {
              isActive: true,
              turns: [],
              currentTurnIndex: 0,
            },
          });
          return { setEnded: true, needsGoldenPoint: true };
        } else {
          // We have a winner
          gameEnded = true;
          await ctx.db.patch(args.gameId, {
            sets,
            status: "finished",
            finishedAt: Date.now(),
            result: {
              winner: homeTotalPulled > awayTotalPulled ? "home" : "away",
              homeSet1Score: set1.homeScore,
              awaySet1Score: set1.awayScore,
              homeSet2Score: set2.homeScore,
              awaySet2Score: set2.awayScore,
              homeTotalPulled,
              awayTotalPulled,
              wasGoldenPoint: false,
            },
          });
          return { gameEnded: true };
        }
      }
    }

    await ctx.db.patch(args.gameId, {
      sets,
      currentSet: newCurrentSet,
      currentPhaseIndex: nextPhaseIndex,
      currentShooterIndex: nextShooterIndex,
      currentShotInTurn: nextShotInTurn,
    });

    return { setEnded, gameEnded };
  },
});

// Helper function to handle golden point shots
async function handleGoldenPointShot(
  ctx: any,
  game: Doc<"teamGames">,
  isHit: boolean
) {
  const goldenPoint = { ...game.goldenPoint! };
  const turns = [...goldenPoint.turns];

  // Determine next shooter based on turn order continuation
  const lastPhase = game.sets[1].phases[game.sets[1].phases.length - 1];
  const shooterOrder = lastPhase.shooters;
  const nextIndex = turns.length % shooterOrder.length;
  const nextShooter = shooterOrder[nextIndex];

  turns.push({
    team: nextShooter.team,
    playerIndex: nextShooter.playerIndex,
    shot: isHit,
  });

  // Check for winner (pairs: first hits + second misses, or vice versa)
  if (turns.length >= 2 && turns.length % 2 === 0) {
    const lastTwo = turns.slice(-2);
    const first = lastTwo[0];
    const second = lastTwo[1];

    if (first.shot === true && second.shot === false) {
      // First shooter's team wins
      const set1 = game.sets[0];
      const set2 = game.sets[1];
      await ctx.db.patch(game._id, {
        goldenPoint: { ...goldenPoint, turns },
        status: "finished",
        finishedAt: Date.now(),
        result: {
          winner: first.team,
          homeSet1Score: set1.homeScore,
          awaySet1Score: set1.awayScore,
          homeSet2Score: set2.homeScore,
          awaySet2Score: set2.awayScore,
          homeTotalPulled: (set1.homePulled ?? 0) + (set2.homePulled ?? 0),
          awayTotalPulled: (set1.awayPulled ?? 0) + (set2.awayPulled ?? 0),
          wasGoldenPoint: true,
        },
      });
      return { gameEnded: true, goldenPointWinner: first.team };
    } else if (first.shot === false && second.shot === true) {
      // Second shooter's team wins
      const set1 = game.sets[0];
      const set2 = game.sets[1];
      await ctx.db.patch(game._id, {
        goldenPoint: { ...goldenPoint, turns },
        status: "finished",
        finishedAt: Date.now(),
        result: {
          winner: second.team,
          homeSet1Score: set1.homeScore,
          awaySet1Score: set1.awayScore,
          homeSet2Score: set2.homeScore,
          awaySet2Score: set2.awayScore,
          homeTotalPulled: (set1.homePulled ?? 0) + (set2.homePulled ?? 0),
          awayTotalPulled: (set1.awayPulled ?? 0) + (set2.awayPulled ?? 0),
          wasGoldenPoint: true,
        },
      });
      return { gameEnded: true, goldenPointWinner: second.team };
    }
    // Both hit or both miss - continue
  }

  goldenPoint.turns = turns;
  goldenPoint.currentTurnIndex = turns.length;
  await ctx.db.patch(game._id, { goldenPoint });
  return { goldenPointContinues: true };
}

// Edit a past shot
export const editShot = mutation({
  args: {
    gameId: v.id("teamGames"),
    setIndex: v.number(),
    phaseIndex: v.number(),
    shooterIndex: v.number(),
    shotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.creatorId !== user._id) {
      throw new Error("Only the game creator can edit shots");
    }

    const sets = [...game.sets];
    const targetSet = { ...sets[args.setIndex] };
    const phases = [...targetSet.phases];
    const targetPhase = { ...phases[args.phaseIndex] };
    const shooters = [...targetPhase.shooters];
    const targetShooter = { ...shooters[args.shooterIndex] };

    const currentShot = targetShooter.shots[args.shotIndex];
    if (currentShot === null) {
      throw new Error("Cannot edit unshot");
    }

    // Toggle the shot
    const shots = [...targetShooter.shots];
    const wasHit = shots[args.shotIndex];
    shots[args.shotIndex] = !wasHit;
    targetShooter.shots = shots;

    // Update score
    if (wasHit) {
      // Was hit, now miss - decrease score
      if (targetShooter.team === "home") {
        targetSet.homeScore -= 1;
      } else {
        targetSet.awayScore -= 1;
      }
    } else {
      // Was miss, now hit - increase score
      if (targetShooter.team === "home") {
        targetSet.homeScore += 1;
      } else {
        targetSet.awayScore += 1;
      }
    }

    shooters[args.shooterIndex] = targetShooter;
    targetPhase.shooters = shooters;
    phases[args.phaseIndex] = targetPhase;
    targetSet.phases = phases;
    sets[args.setIndex] = targetSet;

    await ctx.db.patch(args.gameId, { sets });
    return { success: true };
  },
});

// ============================================
// QUERIES
// ============================================

// Get a team game by ID (auth required - must be creator or participant)
export const get = query({
  args: { id: v.id("teamGames") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const game = await ctx.db.get(args.id);
    if (!game) return null;

    // Check if user is creator or a participant
    const isCreator = game.creatorId === user._id;
    const isHomePlayer = game.homeTeam.players.some((p) => p.userId === user._id);
    const isAwayPlayer = game.awayTeam.players.some((p) => p.userId === user._id);

    if (!isCreator && !isHomePlayer && !isAwayPlayer) {
      throw new Error("Unauthorized: not a participant of this game");
    }

    // Fetch clan names
    const homeClan = await ctx.db.get(game.homeClanId);
    const awayClan = await ctx.db.get(game.awayClanId);

    return {
      ...game,
      homeClanName: homeClan?.name ?? "Unknown",
      homeClanTag: homeClan?.tag ?? "???",
      awayClanName: awayClan?.name ?? "Unknown",
      awayClanTag: awayClan?.tag ?? "???",
    };
  },
});

// Get a team game for public share page (no auth, finished games only)
export const getPublic = query({
  args: { id: v.id("teamGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game || game.status !== "finished") {
      return null;
    }

    const homeClan = await ctx.db.get(game.homeClanId);
    const awayClan = await ctx.db.get(game.awayClanId);

    // Strip sensitive data
    return {
      _id: game._id,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      playersPerTeam: game.playersPerTeam,
      homeClanName: homeClan?.name ?? "Unknown",
      homeClanTag: homeClan?.tag ?? "???",
      awayClanName: awayClan?.name ?? "Unknown",
      awayClanTag: awayClan?.tag ?? "???",
      homeTeam: {
        players: game.homeTeam.players.map((p) => ({
          name: p.name,
          isSubstitute: p.isSubstitute,
        })),
      },
      awayTeam: {
        players: game.awayTeam.players.map((p) => ({
          name: p.name,
          isSubstitute: p.isSubstitute,
        })),
      },
      sets: game.sets,
      result: game.result,
    };
  },
});

// List team games for current user
export const listByUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const limit = args.limit ?? 20;

    // Get all team games and filter by participation
    const allGames = await ctx.db
      .query("teamGames")
      .order("desc")
      .take(100);

    const userGames = allGames.filter((game) =>
      game.homeTeam.players.some((p) => p.userId === user._id) ||
      game.awayTeam.players.some((p) => p.userId === user._id) ||
      game.creatorId === user._id
    );

    // Fetch clan names
    const results = await Promise.all(
      userGames.slice(0, limit).map(async (game) => {
        const homeClan = await ctx.db.get(game.homeClanId);
        const awayClan = await ctx.db.get(game.awayClanId);
        return {
          _id: game._id,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          status: game.status,
          playersPerTeam: game.playersPerTeam,
          homeClanName: homeClan?.name ?? "Unknown",
          homeClanTag: homeClan?.tag ?? "???",
          awayClanName: awayClan?.name ?? "Unknown",
          awayClanTag: awayClan?.tag ?? "???",
          result: game.result,
        };
      })
    );

    return results;
  },
});

// List team games for a specific clan
export const listByClan = query({
  args: {
    clanId: v.id("clans"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Query by home clan
    const homeGames = await ctx.db
      .query("teamGames")
      .withIndex("by_home_clan", (q) => q.eq("homeClanId", args.clanId))
      .order("desc")
      .take(limit);

    // Query by away clan
    const awayGames = await ctx.db
      .query("teamGames")
      .withIndex("by_away_clan", (q) => q.eq("awayClanId", args.clanId))
      .order("desc")
      .take(limit);

    // Merge and sort by startedAt
    const allGames = [...homeGames, ...awayGames]
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);

    // Fetch clan names
    const results = await Promise.all(
      allGames.map(async (game) => {
        const homeClan = await ctx.db.get(game.homeClanId);
        const awayClan = await ctx.db.get(game.awayClanId);
        return {
          _id: game._id,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          status: game.status,
          playersPerTeam: game.playersPerTeam,
          homeClanName: homeClan?.name ?? "Unknown",
          homeClanTag: homeClan?.tag ?? "???",
          awayClanName: awayClan?.name ?? "Unknown",
          awayClanTag: awayClan?.tag ?? "???",
          result: game.result,
        };
      })
    );

    return results;
  },
});

// List live (in-progress) team games
export const listLive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const liveGames = await ctx.db
      .query("teamGames")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .order("desc")
      .take(limit);

    const results = await Promise.all(
      liveGames.map(async (game) => {
        const homeClan = await ctx.db.get(game.homeClanId);
        const awayClan = await ctx.db.get(game.awayClanId);
        const currentSet = game.sets[game.currentSet - 1];
        return {
          _id: game._id,
          startedAt: game.startedAt,
          playersPerTeam: game.playersPerTeam,
          homeClanName: homeClan?.name ?? "Unknown",
          homeClanTag: homeClan?.tag ?? "???",
          awayClanName: awayClan?.name ?? "Unknown",
          awayClanTag: awayClan?.tag ?? "???",
          currentSet: game.currentSet,
          homeScore: currentSet?.homeScore ?? 0,
          awayScore: currentSet?.awayScore ?? 0,
        };
      })
    );

    return results;
  },
});

// Get live game for spectator view (public, strips sensitive data)
export const getLive = query({
  args: { id: v.id("teamGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game) return null;

    const homeClan = await ctx.db.get(game.homeClanId);
    const awayClan = await ctx.db.get(game.awayClanId);

    return {
      _id: game._id,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      playersPerTeam: game.playersPerTeam,
      homeClanName: homeClan?.name ?? "Unknown",
      homeClanTag: homeClan?.tag ?? "???",
      awayClanName: awayClan?.name ?? "Unknown",
      awayClanTag: awayClan?.tag ?? "???",
      homeTeam: {
        players: game.homeTeam.players.map((p) => ({
          name: p.name,
          isSubstitute: p.isSubstitute,
        })),
      },
      awayTeam: {
        players: game.awayTeam.players.map((p) => ({
          name: p.name,
          isSubstitute: p.isSubstitute,
        })),
      },
      sets: game.sets,
      currentSet: game.currentSet,
      currentPhaseIndex: game.currentPhaseIndex,
      currentShooterIndex: game.currentShooterIndex,
      currentShotInTurn: game.currentShotInTurn,
      goldenPoint: game.goldenPoint,
      status: game.status,
      result: game.result,
    };
  },
});
