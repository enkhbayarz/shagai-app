"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { PhaseSection } from "@/components/team";
import { type TeamColor, getTeamColors } from "@/lib/team-colors";
import { phaseTypeLabels, computePhaseSummary } from "@/lib/team-game-utils";

interface PlayerStats {
  name: string;
  isSubstitute: boolean;
  set1: { hits: number; total: number };
  set2: { hits: number; total: number };
  overall: { hits: number; total: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computePlayerStats(
  sets: any[],
  team: "home" | "away",
  players: { name: string; isSubstitute: boolean }[]
): PlayerStats[] {
  return players.map((player, playerIndex) => {
    const stats: PlayerStats = {
      name: player.name,
      isSubstitute: player.isSubstitute,
      set1: { hits: 0, total: 0 },
      set2: { hits: 0, total: 0 },
      overall: { hits: 0, total: 0 },
    };

    sets.forEach((set) => {
      const setKey = set.setNumber === 1 ? "set1" : "set2";
      set.phases.forEach((phase: any) => {
        phase.shooters.forEach((shooter: any) => {
          if (shooter.team === team && shooter.playerIndex === playerIndex) {
            shooter.shots.forEach((shot: boolean | "skip" | null) => {
              if (shot === true) {
                stats[setKey].hits++;
                stats[setKey].total++;
              } else if (shot === false) {
                stats[setKey].total++;
              }
            });
          }
        });
      });
    });

    stats.overall.hits = stats.set1.hits + stats.set2.hits;
    stats.overall.total = stats.set1.total + stats.set2.total;
    return stats;
  });
}

export default function TeamSharePage() {
  const params = useParams();
  const gameId = params.id as Id<"teamGames">;

  const game = useQuery(api.teamGames.getPublic, { id: gameId });
  const [expandedSets, setExpandedSets] = useState<number[]>([]);

  const toggleExpandedSet = (setNumber: number) => {
    setExpandedSets((current) =>
      current.includes(setNumber)
        ? current.filter((expandedSet) => expandedSet !== setNumber)
        : [...current, setNumber]
    );
  };

  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Ачааллаж байна...
        </div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Тоглолт олдсонгүй</h1>
          <p className="text-muted-foreground mb-4">
            Энэ тоглолт олдсонгүй эсвэл хараахан дуусаагүй байна.
          </p>
          <Link href="/">
            <Button>Нүүр хуудас руу</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Validate result exists
  if (!game.result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Тоглолт дуусаагүй</h1>
          <p className="text-muted-foreground mb-4">
            Энэ тоглолт дуусаагүй байна.
          </p>
          <Link href="/">
            <Button>Нүүр хуудас руу</Button>
          </Link>
        </div>
      </div>
    );
  }

  const result = game.result;

  const awayColor = (game.awayTeamColor as TeamColor) ?? undefined;
  const homeColor = (game.homeTeamColor as TeamColor) ?? undefined;
  const ac = getTeamColors(awayColor, "orange");
  const hc = getTeamColors(homeColor, "blue");

  const winnerName =
    result.winner === "home" ? game.homeClanName : game.awayClanName;
  const winnerTag =
    result.winner === "home" ? game.homeClanTag : game.awayClanTag;
  const wc = result.winner === "home" ? hc : ac;

  const homePlayerStats = computePlayerStats(
    game.sets,
    "home",
    game.homeTeam.players
  );
  const awayPlayerStats = computePlayerStats(
    game.sets,
    "away",
    game.awayTeam.players
  );

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            БУЦАХ
          </Button>
        </Link>
        <h1 className="font-display text-xl tracking-wider">БАГИЙН ХАРВАА</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* Winner Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-6"
        >
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${wc.bg100}`}
          >
            <img src="/app_icon.svg" alt="Шагай Харваа" className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Тоглолт дууслаа!</h2>
          <p className={`text-lg font-medium ${wc.text500} mt-1`}>
            {winnerTag ? `[${winnerTag}] ` : ""}{winnerName} хожлоо!
          </p>
          {result.wasGoldenPoint && (
            <span className="inline-block mt-2 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">
              Дүүжингээр
            </span>
          )}
        </motion.div>

        {/* Match Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border p-6 mb-6"
        >
          {/* Teams Header */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Away Team */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${ac.bg100} mx-auto mb-2 flex items-center justify-center`}>
                <span className={`${ac.text600} font-bold`}>
                  {game.awayClanTag?.[0] ?? game.awayClanName?.[0] ?? "З"}
                </span>
              </div>
              <div className="font-medium text-sm">{game.awayClanName}</div>
              {game.awayClanTag && (
                <div className="text-xs text-muted-foreground">
                  [{game.awayClanTag}]
                </div>
              )}
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <span className="text-xl font-bold text-gray-400">VS</span>
            </div>

            {/* Home Team */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${hc.bg100} mx-auto mb-2 flex items-center justify-center`}>
                <span className={`${hc.text600} font-bold`}>
                  {game.homeClanTag?.[0] ?? game.homeClanName?.[0] ?? "Э"}
                </span>
              </div>
              <div className="font-medium text-sm">{game.homeClanName}</div>
              {game.homeClanTag && (
                <div className="text-xs text-muted-foreground">
                  [{game.homeClanTag}]
                </div>
              )}
            </div>
          </div>

          {/* Set Scores */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-center py-2 bg-gray-50 rounded-lg">
              <div className={`text-xl font-bold ${ac.text600}`}>
                {result.awaySet1Score - (result.awaySet1Pulled ?? 0)}
                {(result.awaySet1Pulled ?? 0) > 0 && (
                  <span className="text-xs font-normal ml-0.5">(+{result.awaySet1Pulled})</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground self-center">
                Эхэн өрөг
              </div>
              <div className={`text-xl font-bold ${hc.text600}`}>
                {result.homeSet1Score - (result.homeSet1Pulled ?? 0)}
                {(result.homeSet1Pulled ?? 0) > 0 && (
                  <span className="text-xs font-normal ml-0.5">(+{result.homeSet1Pulled})</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center py-2 bg-gray-50 rounded-lg">
              <div className={`text-xl font-bold ${ac.text600}`}>
                {result.awaySet2Score - (result.awaySet2Pulled ?? 0)}
                {(result.awaySet2Pulled ?? 0) > 0 && (
                  <span className="text-xs font-normal ml-0.5">(+{result.awaySet2Pulled})</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground self-center">
                Дунд өрөг
              </div>
              <div className={`text-xl font-bold ${hc.text600}`}>
                {result.homeSet2Score - (result.homeSet2Pulled ?? 0)}
                {(result.homeSet2Pulled ?? 0) > 0 && (
                  <span className="text-xs font-normal ml-0.5">(+{result.homeSet2Pulled})</span>
                )}
              </div>
            </div>
          </div>

        </motion.div>

        {/* Set Details - Expandable */}
        {game.sets.map((set, setIndex) => (
          <motion.div
            key={set.setNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + setIndex * 0.1 }}
            className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden"
          >
            <button
              onClick={() => toggleExpandedSet(set.setNumber)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  {set.setNumber === 1 ? "Эхэн өрөг" : "Дунд өрөг"} -
                  Дэлгэрэнгүй
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({set.phases.length} үе)
                </span>
              </div>
              {expandedSets.includes(set.setNumber) ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {expandedSets.includes(set.setNumber) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    {set.phases.map((phase, phaseIndex) => {
                      const summary = computePhaseSummary(phase);
                      return (
                        <div key={phaseIndex}>
                          <div className="flex items-center justify-between text-xs mb-1 px-1">
                            <span className={`${ac.text600} font-medium`}>
                              {summary.awayHits}/{summary.awayTotal}
                            </span>
                            <span className="text-muted-foreground">
                              {phaseTypeLabels[phase.phaseType] ||
                                phase.phaseType}{" "}
                              #{phase.cycle}
                            </span>
                            <span className={`${hc.text600} font-medium`}>
                              {summary.homeHits}/{summary.homeTotal}
                            </span>
                          </div>
                          <PhaseSection
                            phase={phase as any}
                            isActive={false}
                            currentShooterIndex={-1}
                            currentShotIndex={-1}
                            homeTeamPlayers={game.homeTeam.players}
                            awayTeamPlayers={game.awayTeam.players}
                            awayColor={awayColor}
                            homeColor={homeColor}
                            compact
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {/* Away Players */}
          <div className={`${ac.bg50} rounded-xl p-4`}>
            <h3 className={`text-sm font-medium ${ac.text700} mb-3`}>
              {game.awayClanName}
            </h3>
            <div className="space-y-2">
              {awayPlayerStats
                .filter((p) => !p.isSubstitute)
                .map((p, i) => (
                  <div key={i}>
                    <div className="text-sm truncate">{p.name}</div>
                    <div className={`text-xs font-mono ${ac.text70070}`}>
                      {p.set1.hits}+{p.set2.hits} ({p.overall.hits}/
                      {p.overall.total})
                    </div>
                  </div>
                ))}
              {awayPlayerStats
                .filter((p) => p.isSubstitute)
                .map((p, i) => (
                  <div key={`sub-${i}`}>
                    <div className="text-xs text-muted-foreground truncate">
                      Сэлгээ: {p.name}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {p.set1.hits}+{p.set2.hits} ({p.overall.hits}/
                      {p.overall.total})
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Home Players */}
          <div className={`${hc.bg50} rounded-xl p-4`}>
            <h3 className={`text-sm font-medium ${hc.text700} mb-3`}>
              {game.homeClanName}
            </h3>
            <div className="space-y-2">
              {homePlayerStats
                .filter((p) => !p.isSubstitute)
                .map((p, i) => (
                  <div key={i}>
                    <div className="text-sm truncate">{p.name}</div>
                    <div className={`text-xs font-mono ${hc.text70070}`}>
                      {p.set1.hits}+{p.set2.hits} ({p.overall.hits}/
                      {p.overall.total})
                    </div>
                  </div>
                ))}
              {homePlayerStats
                .filter((p) => p.isSubstitute)
                .map((p, i) => (
                  <div key={`sub-${i}`}>
                    <div className="text-xs text-muted-foreground truncate">
                      Сэлгээ: {p.name}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {p.set1.hits}+{p.set2.hits} ({p.overall.hits}/
                      {p.overall.total})
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Date */}
        <div className="text-center text-xs text-muted-foreground">
          {game.finishedAt && new Date(game.finishedAt).toLocaleString("mn-MN")}
        </div>
      </div>
    </div>
  );
}
