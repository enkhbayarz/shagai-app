import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getOptionalAuthUser } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

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
 * For 3v3:
 *   Phase 1 (Niileg): players 0,1 from each team
 *   Phase 2 (Merge): player 2 from each team
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
 *
 * SPECIAL RULE for 6v6:
 *   On the first cycle of every phase, only 2 shooters (one from each team)
 *   After cycle 1, normal 4 shooters
 *
 * SET 2 SIDE SWAP:
 *   In Set 2, teams swap physical positions
 *   Set 1: Home on right, Away on left
 *   Set 2: Home on left, Away on right
 *   This effectively swaps which team shoots first for each direction
 */
function generateShooterOrder(
  playersPerTeam: 3 | 4 | 5 | 6,
  phaseType: PhaseType,
  direction: Direction,
  cycle: number = 1,
  setNumber: number = 1
): ShooterConfig[] {
  const shooters: ShooterConfig[] = [];

  // 6v6 special rule: first cycle first round has skips (handled in recordShot)
  // All 4 shooters are still created, skip logic is handled separately

  // Set 2 side swap: teams swap positions, so swap the team assignments
  // In Set 2, "home" becomes physically on left, "away" on right
  // This means we need to swap team labels in the shooter order
  const homeTeam: Team = setNumber === 2 ? "away" : "home";
  const awayTeam: Team = setNumber === 2 ? "home" : "away";

  if (phaseType === "niileg") {
    // Phase 1: players at indices 0, 1
    // Seating order: Home[0], Away[0], Home[1], Away[1]
    if (direction === "rtl") {
      // Right to left: start from rightmost (Home[0])
      // Order: Home[0] -> Away[0] -> Home[1] -> Away[1]
      shooters.push({ team: homeTeam, playerIndex: 0 });
      shooters.push({ team: awayTeam, playerIndex: 0 });
      shooters.push({ team: homeTeam, playerIndex: 1 });
      shooters.push({ team: awayTeam, playerIndex: 1 });
    } else {
      // Left to right: start from leftmost (Away[1])
      shooters.push({ team: awayTeam, playerIndex: 1 });
      shooters.push({ team: homeTeam, playerIndex: 1 });
      shooters.push({ team: awayTeam, playerIndex: 0 });
      shooters.push({ team: homeTeam, playerIndex: 0 });
    }
  } else if (phaseType === "shuvtraga") {
    // Phase 2: players at indices 2, 3
    // Seating order: Home[2], Away[2], Home[3], Away[3]
    if (direction === "ltr") {
      // Left to right: start from leftmost (Away[3])
      shooters.push({ team: awayTeam, playerIndex: 3 });
      shooters.push({ team: homeTeam, playerIndex: 3 });
      shooters.push({ team: awayTeam, playerIndex: 2 });
      shooters.push({ team: homeTeam, playerIndex: 2 });
    } else {
      shooters.push({ team: homeTeam, playerIndex: 2 });
      shooters.push({ team: awayTeam, playerIndex: 2 });
      shooters.push({ team: homeTeam, playerIndex: 3 });
      shooters.push({ team: awayTeam, playerIndex: 3 });
    }
  } else if (phaseType === "merge") {
    // Phase 3: depends on player count
    if (playersPerTeam === 6) {
      // Players at indices 4, 5
      if (direction === "rtl") {
        shooters.push({ team: homeTeam, playerIndex: 4 });
        shooters.push({ team: awayTeam, playerIndex: 4 });
        shooters.push({ team: homeTeam, playerIndex: 5 });
        shooters.push({ team: awayTeam, playerIndex: 5 });
      } else {
        shooters.push({ team: awayTeam, playerIndex: 5 });
        shooters.push({ team: homeTeam, playerIndex: 5 });
        shooters.push({ team: awayTeam, playerIndex: 4 });
        shooters.push({ team: homeTeam, playerIndex: 4 });
      }
    } else if (playersPerTeam === 5) {
      // Player at index 4 only
      if (direction === "rtl") {
        shooters.push({ team: homeTeam, playerIndex: 4 });
        shooters.push({ team: awayTeam, playerIndex: 4 });
      } else {
        shooters.push({ team: awayTeam, playerIndex: 4 });
        shooters.push({ team: homeTeam, playerIndex: 4 });
      }
    } else if (playersPerTeam === 3) {
      // 3v3: Player at index 2 only
      if (direction === "rtl") {
        shooters.push({ team: homeTeam, playerIndex: 2 });
        shooters.push({ team: awayTeam, playerIndex: 2 });
      } else {
        shooters.push({ team: awayTeam, playerIndex: 2 });
        shooters.push({ team: homeTeam, playerIndex: 2 });
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
function getPhasesForPlayerCount(playersPerTeam: 3 | 4 | 5 | 6): PhaseType[] {
  if (playersPerTeam === 3) {
    // 3v3: niileg (players 0,1) + merge (player 2)
    return ["niileg", "merge"];
  }
  if (playersPerTeam === 4) {
    return ["niileg", "shuvtraga"];
  }
  return ["niileg", "shuvtraga", "merge"];
}

/**
 * Create initial phase structure for a set
 */
function createInitialPhase(
  playersPerTeam: 3 | 4 | 5 | 6,
  phaseType: PhaseType,
  phaseNumber: number,
  cycle: number,
  setNumber: number = 1
) {
  const direction = getPhaseDirection(phaseNumber);
  const shooterOrder = generateShooterOrder(playersPerTeam, phaseType, direction, cycle, setNumber);

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

// Create a new team game - supports instant start with placeholders
export const create = mutation({
  args: {
    // Optional team links (can play without creating teams first)
    homeClanId: v.optional(v.id("clans")),
    awayClanId: v.optional(v.id("clans")),
    // Team names - defaults will be used if not provided
    homeTeamName: v.optional(v.string()),
    awayTeamName: v.optional(v.string()),
    // Player count (default 4)
    playersPerTeam: v.optional(v.union(v.literal(3), v.literal(4), v.literal(5), v.literal(6))),
    // Optional player arrays - if not provided, placeholders will be used
    homeTeamPlayers: v.optional(
      v.array(
        v.object({
          userId: v.optional(v.id("users")),
          name: v.optional(v.string()),
          isSubstitute: v.optional(v.boolean()),
        })
      )
    ),
    awayTeamPlayers: v.optional(
      v.array(
        v.object({
          userId: v.optional(v.id("users")),
          name: v.optional(v.string()),
          isSubstitute: v.optional(v.boolean()),
        })
      )
    ),
    // Team colors (e.g. "blue", "orange", "red", "green", etc.)
    homeTeamColor: v.optional(v.string()),
    awayTeamColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth is optional - games can be created without login
    const user = await getOptionalAuthUser(ctx);

    const playersPerTeam = args.playersPerTeam ?? 4;

    // Generate default team names
    let homeTeamName = args.homeTeamName ?? "Баг 2";
    let awayTeamName = args.awayTeamName ?? "Баг 1";
    let homeTeamTag: string | undefined;
    let awayTeamTag: string | undefined;

    // If clan IDs provided, fetch clan info
    if (args.homeClanId) {
      const homeClan = await ctx.db.get(args.homeClanId);
      if (homeClan) {
        homeTeamName = args.homeTeamName ?? homeClan.name;
        homeTeamTag = homeClan.tag;
      }
    }
    if (args.awayClanId) {
      const awayClan = await ctx.db.get(args.awayClanId);
      if (awayClan) {
        awayTeamName = args.awayTeamName ?? awayClan.name;
        awayTeamTag = awayClan.tag;
      }
    }

    // Generate placeholder players if not provided
    const generatePlaceholderPlayers = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        userId: undefined,
        name: `Тоглогч ${i + 1}`,
        isSubstitute: false,
      }));
    };

    // Process home team players
    let homeTeamPlayersWithNames: {
      userId?: Id<"users">;
      name: string;
      isSubstitute: boolean;
    }[];

    if (args.homeTeamPlayers && args.homeTeamPlayers.length > 0) {
      // Allow playersPerTeam OR playersPerTeam + 1 (with bench player)
      if (args.homeTeamPlayers.length !== playersPerTeam && args.homeTeamPlayers.length !== playersPerTeam + 1) {
        throw new Error(`homeTeamPlayers must have exactly ${playersPerTeam} or ${playersPerTeam + 1} (with bench) players`);
      }
      homeTeamPlayersWithNames = await Promise.all(
        args.homeTeamPlayers.map(async (p, index) => {
          let name = p.name ?? `Тоглогч ${index + 1}`;
          if (p.userId && !p.name) {
            const playerUser = await ctx.db.get(p.userId);
            name = playerUser?.fullName ?? name;
          }
          return {
            userId: p.userId,
            name,
            isSubstitute: p.isSubstitute ?? false,
          };
        })
      );
    } else {
      homeTeamPlayersWithNames = generatePlaceholderPlayers(playersPerTeam);
    }

    // Process away team players
    let awayTeamPlayersWithNames: {
      userId?: Id<"users">;
      name: string;
      isSubstitute: boolean;
    }[];

    if (args.awayTeamPlayers && args.awayTeamPlayers.length > 0) {
      // Allow playersPerTeam OR playersPerTeam + 1 (with bench player)
      if (args.awayTeamPlayers.length !== playersPerTeam && args.awayTeamPlayers.length !== playersPerTeam + 1) {
        throw new Error(`awayTeamPlayers must have exactly ${playersPerTeam} or ${playersPerTeam + 1} (with bench) players`);
      }
      awayTeamPlayersWithNames = await Promise.all(
        args.awayTeamPlayers.map(async (p, index) => {
          let name = p.name ?? `Тоглогч ${index + 1}`;
          if (p.userId && !p.name) {
            const playerUser = await ctx.db.get(p.userId);
            name = playerUser?.fullName ?? name;
          }
          return {
            userId: p.userId,
            name,
            isSubstitute: p.isSubstitute ?? false,
          };
        })
      );
    } else {
      awayTeamPlayersWithNames = generatePlaceholderPlayers(playersPerTeam);
    }

    // Create initial phase for Set 1
    const initialPhase = createInitialPhase(playersPerTeam, "niileg", 1, 1);

    // Create the game
    const gameId = await ctx.db.insert("teamGames", {
      homeClanId: args.homeClanId,
      awayClanId: args.awayClanId,
      homeTeamName,
      awayTeamName,
      homeTeamTag,
      awayTeamTag,
      homeTeamColor: args.homeTeamColor,
      awayTeamColor: args.awayTeamColor,
      playersPerTeam,
      creatorId: user?._id,
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

// Record a shot (or skip for 6v6 first round)
export const recordShot = mutation({
  args: {
    gameId: v.id("teamGames"),
    isHit: v.optional(v.boolean()),
    isSkip: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate: either isHit or isSkip must be provided
    if (args.isHit === undefined && !args.isSkip) {
      throw new Error("Either isHit or isSkip must be provided");
    }
    const user = await getOptionalAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status === "finished") throw new Error("Game is already finished");
    if (game.pendingSetTransition) throw new Error("Game is waiting for set transition confirmation");

    // If game has a creator, only creator can record shots
    // If game has no creator (anonymous), anyone can record
    if (game.creatorId && (!user || game.creatorId !== user._id)) {
      throw new Error("Only the game creator can record shots");
    }

    // Handle golden point if active (skip not allowed in golden point)
    if (game.goldenPoint?.isActive) {
      if (args.isHit === undefined) {
        throw new Error("isHit is required for golden point shots");
      }
      return await handleGoldenPointShot(ctx, game, args.isHit);
    }

    const currentSetIndex = game.currentSet - 1;
    const sets = [...game.sets];
    const currentSet = { ...sets[currentSetIndex] };
    const phases = [...currentSet.phases];
    const currentPhase = { ...phases[game.currentPhaseIndex] };
    const shooters = [...currentPhase.shooters];
    const currentShooter = { ...shooters[game.currentShooterIndex] };

    // Record the shot (or skip)
    // In rotation mode, currentShotInTurn represents the "round" (which shot slot we're filling)
    const shots = [...currentShooter.shots];

    // Safety guard: prevent overwriting an already-recorded shot
    if (shots[game.currentShotInTurn] !== null) {
      throw new Error("Shot slot is already recorded. Game state may be out of sync.");
    }

    if (args.isSkip) {
      shots[game.currentShotInTurn] = "skip";
    } else {
      shots[game.currentShotInTurn] = args.isHit!;
    }
    currentShooter.shots = shots;
    shooters[game.currentShooterIndex] = currentShooter;
    currentPhase.shooters = shooters;

    // Update score if hit (skip doesn't change score)
    if (args.isHit === true) {
      if (currentShooter.team === "home") {
        currentSet.homeScore += 1;
      } else {
        currentSet.awayScore += 1;
      }
    }

    // Track which team reached 15 first in Set 1 (for 15-15 tiebreak rule)
    if (game.currentSet === 1 && !currentSet.firstTo15) {
      if (currentSet.homeScore >= 15) {
        currentSet.firstTo15 = "home";
      } else if (currentSet.awayScore >= 15) {
        currentSet.firstTo15 = "away";
      }
    }

    // PENDING SET 1 TRANSITION: Combined score reaches 30 → pause for confirmation
    if (game.currentSet === 1 &&
        currentSet.homeScore + currentSet.awayScore >= 30) {
      // Save the shot but don't advance game state or create Set 2
      phases[game.currentPhaseIndex] = currentPhase;
      currentSet.phases = phases;
      sets[currentSetIndex] = currentSet;

      await ctx.db.patch(args.gameId, {
        sets,
        pendingSetTransition: true,
      });
      return { pendingSetTransition: true };
    }

    // Set 2 Early Win Detection
    if (game.currentSet === 2) {
      const set1 = game.sets[0];
      const homeTotal = set1.homeScore + currentSet.homeScore;
      const awayTotal = set1.awayScore + currentSet.awayScore;

      // SPECIAL RULE: If Set 1 was 15-15, the team that reached 15 first in Set 1
      // must reach 15 first again in Set 2 to win. If the other team reaches 15 first,
      // the game continues and will go to Golden Point.
      if (set1.homeScore === 15 && set1.awayScore === 15 && set1.firstTo15) {
        if (currentSet.homeScore === 15 || currentSet.awayScore === 15) {
          const teamReaching15InSet2: "home" | "away" = currentSet.homeScore === 15 ? "home" : "away";

          if (teamReaching15InSet2 === set1.firstTo15) {
            // Same team reached 15 first in both sets → wins immediately
            shooters[game.currentShooterIndex] = currentShooter;
            currentPhase.shooters = shooters;
            phases[game.currentPhaseIndex] = currentPhase;
            currentSet.phases = phases;

            const winner = set1.firstTo15;
            currentSet.homePulled = 0;
            currentSet.awayPulled = 0;
            sets[currentSetIndex] = currentSet;

            await ctx.db.patch(args.gameId, {
              sets,
              status: "finished",
              finishedAt: Date.now(),
              result: {
                winner,
                homeSet1Score: 15,
                awaySet1Score: 15,
                homeSet2Score: currentSet.homeScore,
                awaySet2Score: currentSet.awayScore,
                homeTotalPulled: 0,
                awayTotalPulled: 0,
                homeSet1Pulled: 0,
                awaySet1Pulled: 0,
                homeSet2Pulled: 0,
                awaySet2Pulled: 0,
                wasGoldenPoint: false,
              },
            });
            // Update team stats
            await ctx.scheduler.runAfter(0, internal.teamStats.updateTeamStatsOnGameFinish, {
              teamGameId: args.gameId,
            });
            return { gameEnded: true, winner };
          }
          // Different team reached 15 first in Set 2 → game continues
          // Set 2 will play out to combined 30, then Golden Point triggers
        }
      }

      // Standard rule: First team to reach 31 total wins immediately
      if (homeTotal >= 31 || awayTotal >= 31) {
        // Update the phase with current shot
        shooters[game.currentShooterIndex] = currentShooter;
        currentPhase.shooters = shooters;
        phases[game.currentPhaseIndex] = currentPhase;
        currentSet.phases = phases;
        sets[currentSetIndex] = currentSet;

        // Determine winner
        const winner = homeTotal >= 31 ? "home" : "away";

        // Calculate pulled points for Set 2
        if (currentSet.homeScore > 15) {
          currentSet.homePulled = currentSet.homeScore - 15;
          currentSet.awayPulled = 0;
        } else if (currentSet.awayScore > 15) {
          currentSet.awayPulled = currentSet.awayScore - 15;
          currentSet.homePulled = 0;
        } else {
          currentSet.homePulled = 0;
          currentSet.awayPulled = 0;
        }

        await ctx.db.patch(args.gameId, {
          sets,
          status: "finished",
          finishedAt: Date.now(),
          result: {
            winner,
            homeSet1Score: set1.homeScore,
            awaySet1Score: set1.awayScore,
            homeSet2Score: currentSet.homeScore,
            awaySet2Score: currentSet.awayScore,
            homeTotalPulled: (set1.homePulled ?? 0) + (currentSet.homePulled ?? 0),
            awayTotalPulled: (set1.awayPulled ?? 0) + (currentSet.awayPulled ?? 0),
            homeSet1Pulled: set1.homePulled ?? 0,
            awaySet1Pulled: set1.awayPulled ?? 0,
            homeSet2Pulled: currentSet.homePulled ?? 0,
            awaySet2Pulled: currentSet.awayPulled ?? 0,
            wasGoldenPoint: false,
          },
        });
        // Update team stats
        await ctx.scheduler.runAfter(0, internal.teamStats.updateTeamStatsOnGameFinish, {
          teamGameId: args.gameId,
        });
        return { gameEnded: true, winner };
      }

      // IMMEDIATE SET 2 END: Combined score in Set 2 reaches 30 → end set, check for golden point
      if (currentSet.homeScore + currentSet.awayScore >= 30) {
        // Update phase with current shot
        shooters[game.currentShooterIndex] = currentShooter;
        currentPhase.shooters = shooters;
        phases[game.currentPhaseIndex] = currentPhase;
        currentSet.phases = phases;

        // Calculate pulled points for Set 2
        if (currentSet.homeScore > 15) {
          currentSet.homePulled = currentSet.homeScore - 15;
          currentSet.awayPulled = 0;
        } else if (currentSet.awayScore > 15) {
          currentSet.awayPulled = currentSet.awayScore - 15;
          currentSet.homePulled = 0;
        } else {
          currentSet.homePulled = 0;
          currentSet.awayPulled = 0;
        }

        currentSet.isCompleted = true;
        sets[currentSetIndex] = currentSet;

        const homeTotalPulled = (set1.homePulled ?? 0) + (currentSet.homePulled ?? 0);
        const awayTotalPulled = (set1.awayPulled ?? 0) + (currentSet.awayPulled ?? 0);

        if (homeTotalPulled === awayTotalPulled) {
          // Tied - need golden point
          // ADVANCE state so first golden point shot doesn't overwrite the triggering shot
          let nextShooterIndex = game.currentShooterIndex + 1;
          let nextShotInTurn = game.currentShotInTurn;
          let nextPhaseIndex = game.currentPhaseIndex;
          let shootersInNextPhase = currentPhase.shooters.length;

          if (nextShooterIndex >= currentPhase.shooters.length) {
            nextShooterIndex = 0;
            nextShotInTurn += 1;

            if (nextShotInTurn >= 4) {
              // Phase is complete, create next phase
              nextShotInTurn = 0;
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
                nextCycle,
                game.currentSet
              );
              phases.push(newPhase);
              currentSet.phases = phases;
              sets[currentSetIndex] = currentSet;
              nextPhaseIndex = phases.length - 1;
              shootersInNextPhase = newPhase.shooters.length;
            }
          }

          // Calculate remaining players for golden point mode
          // ODD remaining = first shooter can win alone with HIT
          // EVEN remaining = pairs mode (both must shoot, then compare)
          const remainingPlayers = shootersInNextPhase - nextShooterIndex;
          const startedWithOddRemaining = remainingPlayers % 2 === 1;

          await ctx.db.patch(args.gameId, {
            sets,
            goldenPoint: {
              isActive: true,
              turns: [],
              currentTurnIndex: 0,
              startedWithOddRemaining,
            },
            currentShooterIndex: nextShooterIndex,
            currentShotInTurn: nextShotInTurn,
            currentPhaseIndex: nextPhaseIndex,
          });
          return { setEnded: true, needsGoldenPoint: true };
        } else {
          // Winner determined by pulled points
          const winner = homeTotalPulled > awayTotalPulled ? "home" : "away";
          await ctx.db.patch(args.gameId, {
            sets,
            status: "finished",
            finishedAt: Date.now(),
            result: {
              winner,
              homeSet1Score: set1.homeScore,
              awaySet1Score: set1.awayScore,
              homeSet2Score: currentSet.homeScore,
              awaySet2Score: currentSet.awayScore,
              homeTotalPulled,
              awayTotalPulled,
              homeSet1Pulled: set1.homePulled ?? 0,
              awaySet1Pulled: set1.awayPulled ?? 0,
              homeSet2Pulled: currentSet.homePulled ?? 0,
              awaySet2Pulled: currentSet.awayPulled ?? 0,
              wasGoldenPoint: false,
            },
          });
          // Update team stats
          await ctx.scheduler.runAfter(0, internal.teamStats.updateTeamStatsOnGameFinish, {
            teamGameId: args.gameId,
          });
          return { gameEnded: true, winner };
        }
      }
    }

    // Advance state - ROTATION MODE
    // After each shot, move to next shooter (not next shot of same shooter)
    let nextShooterIndex = game.currentShooterIndex + 1;
    let nextShotInTurn = game.currentShotInTurn;
    let nextPhaseIndex = game.currentPhaseIndex;
    let setEnded = false;
    let gameEnded = false;

    // Check if all shooters have completed this round
    if (nextShooterIndex >= currentPhase.shooters.length) {
      // All shooters have shot once in this round, advance to next round
      nextShooterIndex = 0;
      nextShotInTurn += 1;

      // Check if all 4 rounds are complete (phase is done)
      if (nextShotInTurn >= 4) {
        currentPhase.isCompleted = true;
        nextShotInTurn = 0;

        // Check if set should end (combined score reaches 30)
        if (currentSet.homeScore + currentSet.awayScore >= 30) {
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
            nextCycle,
            game.currentSet
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
      // Set 1: Don't auto-create Set 2, set pending flag instead
      if (game.currentSet === 1) {
        sets[currentSetIndex] = currentSet;
        await ctx.db.patch(args.gameId, {
          sets,
          pendingSetTransition: true,
        });
        return { pendingSetTransition: true };
      }

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

    // Check if we need to end the game (Set 2 only now, Set 1 uses pending transition)
    let newCurrentSet = game.currentSet;
    if (setEnded) {
      if (game.currentSet === 1) {
        // Should not reach here (handled above), but just in case
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
          // Calculate remaining players for golden point mode
          const goldenPhase = sets[1].phases[nextPhaseIndex];
          const remainingPlayers = goldenPhase.shooters.length - nextShooterIndex;
          const startedWithOddRemaining = remainingPlayers % 2 === 1;

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
              startedWithOddRemaining,
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
              homeSet1Pulled: set1.homePulled ?? 0,
              awaySet1Pulled: set1.awayPulled ?? 0,
              homeSet2Pulled: set2.homePulled ?? 0,
              awaySet2Pulled: set2.awayPulled ?? 0,
              wasGoldenPoint: false,
            },
          });
          // Update team stats
          await ctx.scheduler.runAfter(0, internal.teamStats.updateTeamStatsOnGameFinish, {
            teamGameId: args.gameId,
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

// Confirm Set 1 → Set 2 transition (called when user clicks "Тийм" on confirmation modal)
export const confirmSetTransition = mutation({
  args: {
    gameId: v.id("teamGames"),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (!game.pendingSetTransition) throw new Error("No pending set transition");
    if (game.currentSet !== 1) throw new Error("Can only confirm Set 1 → Set 2 transition");

    if (game.creatorId && (!user || game.creatorId !== user._id)) {
      throw new Error("Only the game creator can confirm set transition");
    }

    const sets = [...game.sets];
    const set1 = { ...sets[0] };

    // Verify combined score is still >= 30
    if (set1.homeScore + set1.awayScore < 30) {
      await ctx.db.patch(args.gameId, { pendingSetTransition: undefined });
      return { cancelled: true };
    }

    // Mark all phases as completed
    const phases = [...set1.phases];
    for (let i = 0; i < phases.length; i++) {
      if (!phases[i].isCompleted) {
        phases[i] = { ...phases[i], isCompleted: true };
      }
    }
    set1.phases = phases;

    // Calculate pulled points
    if (set1.homeScore > 15) {
      set1.homePulled = set1.homeScore - 15;
      set1.awayPulled = 0;
    } else if (set1.awayScore > 15) {
      set1.awayPulled = set1.awayScore - 15;
      set1.homePulled = 0;
    } else if (set1.homeScore === 15 && set1.awayScore < 15) {
      set1.homePulled = 15 - set1.awayScore;
      set1.awayPulled = 0;
    } else if (set1.awayScore === 15 && set1.homeScore < 15) {
      set1.awayPulled = 15 - set1.homeScore;
      set1.homePulled = 0;
    } else {
      set1.homePulled = 0;
      set1.awayPulled = 0;
    }

    set1.winner = set1.homeScore >= set1.awayScore ? "home" : "away";
    set1.isCompleted = true;
    sets[0] = set1;

    // Create Set 2
    const initialPhaseSet2 = createInitialPhase(game.playersPerTeam, "niileg", 1, 1, 2);
    sets.push({
      setNumber: 2,
      homeSide: "left",
      awaySide: "right",
      homeScore: 0,
      awayScore: 0,
      phases: [initialPhaseSet2],
      isCompleted: false,
    });

    await ctx.db.patch(args.gameId, {
      sets,
      currentSet: 2,
      currentPhaseIndex: 0,
      currentShooterIndex: 0,
      currentShotInTurn: 0,
      pendingSetTransition: undefined,
    });

    return { confirmed: true, newSet: 2 };
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

  // Use current game state (same as normal play)
  const currentSetIndex = game.currentSet - 1;
  const sets = [...game.sets];
  const currentSet = { ...sets[currentSetIndex] };
  const phases = [...currentSet.phases];
  const currentPhase = { ...phases[game.currentPhaseIndex] };
  const shooters = [...currentPhase.shooters];
  const currentShooter = { ...shooters[game.currentShooterIndex] };
  const shots = [...currentShooter.shots];

  // Record shot to current slot (using game.currentShotInTurn)
  shots[game.currentShotInTurn] = isHit;
  currentShooter.shots = shots;
  shooters[game.currentShooterIndex] = currentShooter;
  currentPhase.shooters = shooters;
  phases[game.currentPhaseIndex] = currentPhase;
  currentSet.phases = phases;
  sets[currentSetIndex] = currentSet;

  // Track in golden point turns for winning logic
  turns.push({
    team: currentShooter.team,
    playerIndex: currentShooter.playerIndex,
    shot: isHit,
  });

  const turnsCount = turns.length;

  // Helper function to end the game
  const endGame = async (winner: Team) => {
    const set1 = sets[0];
    const set2 = sets[1];
    await ctx.db.patch(game._id, {
      sets,
      goldenPoint: { ...goldenPoint, turns },
      status: "finished",
      finishedAt: Date.now(),
      result: {
        winner,
        homeSet1Score: set1.homeScore,
        awaySet1Score: set1.awayScore,
        homeSet2Score: set2.homeScore,
        awaySet2Score: set2.awayScore,
        homeTotalPulled: (set1.homePulled ?? 0) + (set2.homePulled ?? 0),
        awayTotalPulled: (set1.awayPulled ?? 0) + (set2.awayPulled ?? 0),
        homeSet1Pulled: set1.homePulled ?? 0,
        awaySet1Pulled: set1.awayPulled ?? 0,
        homeSet2Pulled: set2.homePulled ?? 0,
        awaySet2Pulled: set2.awayPulled ?? 0,
        wasGoldenPoint: true,
      },
    });
    // Update team stats
    await ctx.scheduler.runAfter(0, internal.teamStats.updateTeamStatsOnGameFinish, {
      teamGameId: game._id,
    });
    return { gameEnded: true, goldenPointWinner: winner };
  };

  // Golden Point Winning Logic:
  // ODD remaining = first shooter can win alone with HIT
  // EVEN remaining = pairs mode (both must shoot, then compare)
  const startedOdd = goldenPoint.startedWithOddRemaining;

  if (startedOdd) {
    if (turnsCount === 1) {
      // ODD MODE: First shot can win alone with HIT
      if (isHit) {
        return await endGame(currentShooter.team);
      }
      // Miss - continue to EVEN mode (remaining players are now even)
    } else {
      // EVEN MODE after ODD resolved
      // Pairs start from turn 2: (2,3), (4,5), (6,7)...
      const evenModePosition = turnsCount - 1; // subtract the ODD shot
      if (evenModePosition % 2 === 0) {
        // End of a pair - check for winner
        const shot1 = turns[turnsCount - 2];
        const shot2 = turns[turnsCount - 1];
        if (shot1.shot !== shot2.shot) {
          // One hit, one miss - hitting team wins
          const winner = shot1.shot ? shot1.team : shot2.team;
          return await endGame(winner);
        }
        // Both same - continue to next pair
      }
    }
  } else {
    // Started EVEN - pure pairs mode
    // Pairs: (1,2), (3,4), (5,6)...
    if (turnsCount % 2 === 0) {
      // End of a pair - check for winner
      const shot1 = turns[turnsCount - 2];
      const shot2 = turns[turnsCount - 1];
      if (shot1.shot !== shot2.shot) {
        // One hit, one miss - hitting team wins
        const winner = shot1.shot ? shot1.team : shot2.team;
        return await endGame(winner);
      }
      // Both same - continue to next pair
    }
  }

  // Advance state - same rotation as normal play
  let nextShooterIndex = game.currentShooterIndex + 1;
  let nextShotInTurn = game.currentShotInTurn;
  let nextPhaseIndex = game.currentPhaseIndex;

  // Check if all shooters have completed this round
  if (nextShooterIndex >= currentPhase.shooters.length) {
    // All shooters have shot once in this round, advance to next round
    nextShooterIndex = 0;
    nextShotInTurn += 1;

    // Check if all 4 rounds are complete (phase is done)
    if (nextShotInTurn >= 4) {
      currentPhase.isCompleted = true;
      phases[game.currentPhaseIndex] = currentPhase;
      currentSet.phases = phases;
      sets[currentSetIndex] = currentSet;

      nextShotInTurn = 0;

      // Create next phase for golden point to continue
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
        nextCycle,
        game.currentSet
      );
      phases.push(newPhase);
      currentSet.phases = phases;
      sets[currentSetIndex] = currentSet;
      nextPhaseIndex = phases.length - 1;
    }
  }

  // Continue - no winner yet
  goldenPoint.turns = turns;
  goldenPoint.currentTurnIndex = turns.length;
  await ctx.db.patch(game._id, {
    sets,
    goldenPoint,
    currentPhaseIndex: nextPhaseIndex,
    currentShooterIndex: nextShooterIndex,
    currentShotInTurn: nextShotInTurn,
  });
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
    const user = await getOptionalAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // If game has a creator, only creator can edit shots
    if (game.creatorId && (!user || game.creatorId !== user._id)) {
      throw new Error("Only the game creator can edit shots");
    }

    // Prevent editing Set 1 after Set 2 has started (unless in pending transition state)
    if (args.setIndex === 0 && game.currentSet === 2 && !game.pendingSetTransition) {
      throw new Error("Эхэн өрөгийг дунд өрөг эхэлсний дараа засах боломжгүй");
    }

    // Bounds validation
    if (args.setIndex < 0 || args.setIndex >= game.sets.length) {
      throw new Error(`Invalid setIndex: ${args.setIndex}. Valid range: 0-${game.sets.length - 1}`);
    }
    if (args.phaseIndex < 0 || args.phaseIndex >= game.sets[args.setIndex].phases.length) {
      throw new Error(`Invalid phaseIndex: ${args.phaseIndex}. Valid range: 0-${game.sets[args.setIndex].phases.length - 1}`);
    }
    if (args.shooterIndex < 0 || args.shooterIndex >= game.sets[args.setIndex].phases[args.phaseIndex].shooters.length) {
      throw new Error(`Invalid shooterIndex: ${args.shooterIndex}. Valid range: 0-${game.sets[args.setIndex].phases[args.phaseIndex].shooters.length - 1}`);
    }
    if (args.shotIndex < 0 || args.shotIndex >= game.sets[args.setIndex].phases[args.phaseIndex].shooters[args.shooterIndex].shots.length) {
      throw new Error(`Invalid shotIndex: ${args.shotIndex}. Valid range: 0-${game.sets[args.setIndex].phases[args.phaseIndex].shooters[args.shooterIndex].shots.length - 1}`);
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

    // Set 1 score cap validation: cannot edit miss→hit if combined would exceed 30
    if (args.setIndex === 0 && !wasHit) {
      const newHomeScore = targetShooter.team === "home"
        ? targetSet.homeScore + 1
        : targetSet.homeScore;
      const newAwayScore = targetShooter.team === "away"
        ? targetSet.awayScore + 1
        : targetSet.awayScore;
      if (newHomeScore + newAwayScore > 30) {
        throw new Error("Эхэн өрөгт 30 оноо хязгаарлалт байгаа тул засах боломжгүй");
      }
    }

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

    // Recalculate firstTo15 for Set 1 if a Set 1 shot was edited
    if (args.setIndex === 0) {
      let homeRunning = 0;
      let awayRunning = 0;
      let newFirstTo15: "home" | "away" | undefined = undefined;

      for (const phase of targetSet.phases) {
        for (let shotRound = 0; shotRound < 4; shotRound++) {
          for (const shooter of phase.shooters) {
            if (shooter.shots[shotRound] === true) {
              if (shooter.team === "home") homeRunning++;
              else awayRunning++;
              if (!newFirstTo15) {
                if (homeRunning >= 15) newFirstTo15 = "home";
                else if (awayRunning >= 15) newFirstTo15 = "away";
              }
            }
          }
        }
      }

      targetSet.firstTo15 = newFirstTo15;
    }

    sets[args.setIndex] = targetSet;

    // Manage pendingSetTransition flag for Set 1 edits
    const newCombined = targetSet.homeScore + targetSet.awayScore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingUpdate: Record<string, any> = {};
    if (args.setIndex === 0) {
      if (game.pendingSetTransition && newCombined < 30) {
        // Score dropped below 30, clear pending state → game resumes
        // Advance game state past the last recorded shot so the next
        // recordShot doesn't overwrite it
        const resumePhase = sets[0].phases[game.currentPhaseIndex];

        let nextShooterIndex = game.currentShooterIndex + 1;
        let nextShotInTurn = game.currentShotInTurn;
        let nextPhaseIndex = game.currentPhaseIndex;

        if (nextShooterIndex >= resumePhase.shooters.length) {
          nextShooterIndex = 0;
          nextShotInTurn += 1;

          if (nextShotInTurn >= 4) {
            // Phase complete, mark it and create next phase
            nextShotInTurn = 0;
            sets[0].phases[game.currentPhaseIndex] = {
              ...sets[0].phases[game.currentPhaseIndex],
              isCompleted: true,
            };

            const phaseTypes = getPhasesForPlayerCount(game.playersPerTeam);
            const currentPhaseTypeIndex = phaseTypes.indexOf(
              resumePhase.phaseType as PhaseType
            );
            const nextPhaseTypeIndex = (currentPhaseTypeIndex + 1) % phaseTypes.length;
            const nextCycle = nextPhaseTypeIndex === 0
              ? resumePhase.cycle + 1
              : resumePhase.cycle;
            const nextPhaseType = phaseTypes[nextPhaseTypeIndex];
            const nextPhaseNumber = sets[0].phases.length + 1;

            const newPhase = createInitialPhase(
              game.playersPerTeam,
              nextPhaseType,
              nextPhaseNumber,
              nextCycle,
              1
            );
            sets[0].phases.push(newPhase);
            nextPhaseIndex = sets[0].phases.length - 1;
          }
        }

        pendingUpdate = {
          pendingSetTransition: undefined,
          currentShooterIndex: nextShooterIndex,
          currentShotInTurn: nextShotInTurn,
          currentPhaseIndex: nextPhaseIndex,
        };
      } else if (!game.pendingSetTransition && !wasHit && newCombined >= 30) {
        // Miss→hit brought score back to 30+, re-activate pending
        pendingUpdate = { pendingSetTransition: true };
      }
    }

    await ctx.db.patch(args.gameId, { sets, ...pendingUpdate });

    const pendingCleared = newCombined < 30 && game.pendingSetTransition === true;
    const shouldShowTransitionModal = args.setIndex === 0 && !wasHit && newCombined >= 30;

    return { success: true, newCombinedScore: newCombined, pendingCleared, shouldShowTransitionModal };
  },
});

// Update team name during game
export const updateTeamName = mutation({
  args: {
    gameId: v.id("teamGames"),
    team: v.union(v.literal("home"), v.literal("away")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // If game has a creator, only creator can update
    if (game.creatorId && (!user || game.creatorId !== user._id)) {
      throw new Error("Only the game creator can update team names");
    }

    if (args.team === "home") {
      await ctx.db.patch(args.gameId, { homeTeamName: args.name });
    } else {
      await ctx.db.patch(args.gameId, { awayTeamName: args.name });
    }

    return { success: true };
  },
});

// Update player name during game
export const updatePlayerName = mutation({
  args: {
    gameId: v.id("teamGames"),
    team: v.union(v.literal("home"), v.literal("away")),
    playerIndex: v.number(),
    name: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // If game has a creator, only creator can update
    if (game.creatorId && (!user || game.creatorId !== user._id)) {
      throw new Error("Only the game creator can update player names");
    }

    const teamData = args.team === "home" ? { ...game.homeTeam } : { ...game.awayTeam };
    const players = [...teamData.players];

    if (args.playerIndex < 0 || args.playerIndex >= players.length) {
      throw new Error(`Invalid playerIndex: ${args.playerIndex}`);
    }

    players[args.playerIndex] = {
      ...players[args.playerIndex],
      name: args.name,
      ...(args.userId !== undefined && { userId: args.userId }),
    };
    teamData.players = players;

    if (args.team === "home") {
      await ctx.db.patch(args.gameId, { homeTeam: teamData });
    } else {
      await ctx.db.patch(args.gameId, { awayTeam: teamData });
    }

    return { success: true };
  },
});

// ============================================
// QUERIES
// ============================================

// Get a team game by ID - now accessible to anyone (for instant play)
export const get = query({
  args: { id: v.id("teamGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game) return null;

    // Use stored team names, fallback to clan names for backward compatibility
    let homeClanName = game.homeTeamName ?? "Баг 2";
    let homeClanTag = game.homeTeamTag ?? "";
    let awayClanName = game.awayTeamName ?? "Баг 1";
    let awayClanTag = game.awayTeamTag ?? "";

    // Fallback: fetch from clans if team names not stored (old data)
    if (!game.homeTeamName && game.homeClanId) {
      const homeClan = await ctx.db.get(game.homeClanId);
      if (homeClan) {
        homeClanName = homeClan.name;
        homeClanTag = homeClan.tag;
      }
    }
    if (!game.awayTeamName && game.awayClanId) {
      const awayClan = await ctx.db.get(game.awayClanId);
      if (awayClan) {
        awayClanName = awayClan.name;
        awayClanTag = awayClan.tag;
      }
    }

    return {
      ...game,
      homeClanName,
      homeClanTag,
      awayClanName,
      awayClanTag,
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

    // Use stored team names, fallback to clan names for backward compatibility
    let homeClanName = game.homeTeamName ?? "Баг 2";
    let homeClanTag = game.homeTeamTag ?? "";
    let awayClanName = game.awayTeamName ?? "Баг 1";
    let awayClanTag = game.awayTeamTag ?? "";

    // Fallback: fetch from clans if team names not stored (old data)
    if (!game.homeTeamName && game.homeClanId) {
      const homeClan = await ctx.db.get(game.homeClanId);
      if (homeClan) {
        homeClanName = homeClan.name;
        homeClanTag = homeClan.tag;
      }
    }
    if (!game.awayTeamName && game.awayClanId) {
      const awayClan = await ctx.db.get(game.awayClanId);
      if (awayClan) {
        awayClanName = awayClan.name;
        awayClanTag = awayClan.tag;
      }
    }

    return {
      _id: game._id,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      playersPerTeam: game.playersPerTeam,
      homeClanName,
      homeClanTag,
      awayClanName,
      awayClanTag,
      homeTeamColor: game.homeTeamColor,
      awayTeamColor: game.awayTeamColor,
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
    const user = await getOptionalAuthUser(ctx);
    const limit = args.limit ?? 20;

    // Get all team games and filter by participation
    const allGames = await ctx.db
      .query("teamGames")
      .order("desc")
      .take(100);

    const userGames = user
      ? allGames.filter((game) =>
          game.homeTeam.players.some((p) => p.userId === user._id) ||
          game.awayTeam.players.some((p) => p.userId === user._id) ||
          game.creatorId === user._id
        )
      : [];

    // Use stored team names with fallback for old data
    const results = await Promise.all(
      userGames.slice(0, limit).map(async (game) => {
        let homeClanName = game.homeTeamName ?? "Баг 2";
        let homeClanTag = game.homeTeamTag ?? "";
        let awayClanName = game.awayTeamName ?? "Баг 1";
        let awayClanTag = game.awayTeamTag ?? "";

        if (!game.homeTeamName && game.homeClanId) {
          const homeClan = await ctx.db.get(game.homeClanId);
          if (homeClan) {
            homeClanName = homeClan.name;
            homeClanTag = homeClan.tag;
          }
        }
        if (!game.awayTeamName && game.awayClanId) {
          const awayClan = await ctx.db.get(game.awayClanId);
          if (awayClan) {
            awayClanName = awayClan.name;
            awayClanTag = awayClan.tag;
          }
        }

        return {
          _id: game._id,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          status: game.status,
          playersPerTeam: game.playersPerTeam,
          homeClanName,
          homeClanTag,
          awayClanName,
          awayClanTag,
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

    // Use stored team names with fallback for old data
    const results = await Promise.all(
      allGames.map(async (game) => {
        let homeClanName = game.homeTeamName ?? "Баг 2";
        let homeClanTag = game.homeTeamTag ?? "";
        let awayClanName = game.awayTeamName ?? "Баг 1";
        let awayClanTag = game.awayTeamTag ?? "";

        if (!game.homeTeamName && game.homeClanId) {
          const homeClan = await ctx.db.get(game.homeClanId);
          if (homeClan) {
            homeClanName = homeClan.name;
            homeClanTag = homeClan.tag;
          }
        }
        if (!game.awayTeamName && game.awayClanId) {
          const awayClan = await ctx.db.get(game.awayClanId);
          if (awayClan) {
            awayClanName = awayClan.name;
            awayClanTag = awayClan.tag;
          }
        }

        return {
          _id: game._id,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          status: game.status,
          playersPerTeam: game.playersPerTeam,
          homeClanName,
          homeClanTag,
          awayClanName,
          awayClanTag,
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

    // Use stored team names with fallback for old data
    const results = await Promise.all(
      liveGames.map(async (game) => {
        let homeClanName = game.homeTeamName ?? "Баг 2";
        let homeClanTag = game.homeTeamTag ?? "";
        let awayClanName = game.awayTeamName ?? "Баг 1";
        let awayClanTag = game.awayTeamTag ?? "";

        if (!game.homeTeamName && game.homeClanId) {
          const homeClan = await ctx.db.get(game.homeClanId);
          if (homeClan) {
            homeClanName = homeClan.name;
            homeClanTag = homeClan.tag;
          }
        }
        if (!game.awayTeamName && game.awayClanId) {
          const awayClan = await ctx.db.get(game.awayClanId);
          if (awayClan) {
            awayClanName = awayClan.name;
            awayClanTag = awayClan.tag;
          }
        }

        const currentSet = game.sets[game.currentSet - 1];
        return {
          _id: game._id,
          startedAt: game.startedAt,
          playersPerTeam: game.playersPerTeam,
          homeClanName,
          homeClanTag,
          awayClanName,
          awayClanTag,
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

    // Use stored team names, fallback to clan names for backward compatibility
    let homeClanName = game.homeTeamName ?? "Баг 2";
    let homeClanTag = game.homeTeamTag ?? "";
    let awayClanName = game.awayTeamName ?? "Баг 1";
    let awayClanTag = game.awayTeamTag ?? "";

    // Fallback: fetch from clans if team names not stored (old data)
    if (!game.homeTeamName && game.homeClanId) {
      const homeClan = await ctx.db.get(game.homeClanId);
      if (homeClan) {
        homeClanName = homeClan.name;
        homeClanTag = homeClan.tag;
      }
    }
    if (!game.awayTeamName && game.awayClanId) {
      const awayClan = await ctx.db.get(game.awayClanId);
      if (awayClan) {
        awayClanName = awayClan.name;
        awayClanTag = awayClan.tag;
      }
    }

    return {
      _id: game._id,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      playersPerTeam: game.playersPerTeam,
      homeClanName,
      homeClanTag,
      awayClanName,
      awayClanTag,
      homeTeamColor: game.homeTeamColor,
      awayTeamColor: game.awayTeamColor,
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

// Substitute a player (bench player replaces a starter)
// Each team can only make 1 substitution per game
export const substitutePlayer = mutation({
  args: {
    gameId: v.id("teamGames"),
    team: v.union(v.literal("home"), v.literal("away")),
    outPlayerIndex: v.number(), // index of starter to replace
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status === "finished") throw new Error("Game is already finished");

    // Check if creator can modify
    if (game.creatorId && (!user || game.creatorId !== user._id)) {
      throw new Error("Only the game creator can make substitutions");
    }

    // Check if team has already used their substitution
    const subUsedField = args.team === "home" ? "homeSubstitutionUsed" : "awaySubstitutionUsed";
    if (game[subUsedField]) {
      throw new Error("This team has already used their substitution");
    }

    // Get team data
    const teamData = args.team === "home" ? game.homeTeam : game.awayTeam;
    const players = [...teamData.players];

    // Find the bench player (isSubstitute: true)
    const benchPlayerIndex = players.findIndex((p) => p.isSubstitute === true);
    if (benchPlayerIndex === -1) {
      throw new Error("No bench player available for this team");
    }

    // Validate outPlayerIndex is a starter (not already a substitute)
    if (args.outPlayerIndex < 0 || args.outPlayerIndex >= players.length) {
      throw new Error("Invalid player index");
    }
    if (args.outPlayerIndex === benchPlayerIndex) {
      throw new Error("Cannot substitute the bench player");
    }
    const outPlayer = players[args.outPlayerIndex];
    if (outPlayer.isSubstitute) {
      throw new Error("Cannot substitute a player who was already substituted in");
    }

    const benchPlayer = players[benchPlayerIndex];

    // Store names for logging
    const outPlayerName = outPlayer.name;
    const inPlayerName = benchPlayer.name;

    // Perform the substitution: swap bench player into the starter's slot
    // The bench player takes over the starter's position
    players[args.outPlayerIndex] = {
      userId: benchPlayer.userId,
      name: benchPlayer.name,
      isSubstitute: true, // Mark that this slot has a substitute
      replacedPlayerIndex: args.outPlayerIndex, // Record who was replaced
    };

    // Mark bench slot as used (or remove)
    // We'll mark the bench player as "used" by clearing their name
    players[benchPlayerIndex] = {
      ...benchPlayer,
      name: `(${outPlayerName} - солигдсон)`, // Mark as substituted out
      isSubstitute: true,
      replacedPlayerIndex: undefined,
    };

    // Update team data
    const updatedTeamData = { players };

    // Log the event
    await ctx.db.insert("teamGameEvents", {
      teamGameId: args.gameId,
      eventType: "substitution",
      team: args.team,
      outPlayerIndex: args.outPlayerIndex,
      outPlayerName,
      inPlayerName,
      setNumber: game.currentSet,
      phaseIndex: game.currentPhaseIndex,
      timestamp: Date.now(),
    });

    // Update the game
    await ctx.db.patch(args.gameId, {
      [args.team === "home" ? "homeTeam" : "awayTeam"]: updatedTeamData,
      [subUsedField]: true,
    });

    return { success: true, outPlayerName, inPlayerName };
  },
});
