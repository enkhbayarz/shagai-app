"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Flame, Snowflake, ArrowUpRight, Equal } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Player {
  name: string;
  userId?: string;
  shots: (boolean | null)[];
}

interface PostMatchAnalysisProps {
  players: Player[];
  gameId?: string;
}

function computeQuarters(shots: (boolean | null)[]) {
  const quarters = [];
  for (let q = 0; q < 4; q++) {
    const slice = shots.slice(q * 5, (q + 1) * 5);
    let hits = 0;
    let total = 0;
    for (const s of slice) {
      if (s !== null) {
        total++;
        if (s === true) hits++;
      }
    }
    quarters.push({
      label: `${q * 5 + 1}-${(q + 1) * 5}`,
      accuracy: total > 0 ? hits / total : 0,
      hits,
      total,
    });
  }
  return quarters;
}

function longestHitStreak(shots: (boolean | null)[]): number {
  let max = 0;
  let current = 0;
  for (const s of shots) {
    if (s === true) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

interface Observation {
  icon: typeof Flame;
  label: string;
  color: string;
}

function getObservations(quarters: ReturnType<typeof computeQuarters>): Observation[] {
  const obs: Observation[] = [];
  const q1 = quarters[0].accuracy;
  const q4 = quarters[3].accuracy;

  if (q1 >= 0.8 && quarters[0].total > 0) {
    obs.push({ icon: Flame, label: "Халуун эхлэл", color: "text-orange-500" });
  }
  if (q1 <= 0.2 && quarters[0].total > 0) {
    obs.push({ icon: Snowflake, label: "Хүйтэн эхлэл", color: "text-blue-400" });
  }
  if (q4 - q1 >= 0.2 && quarters[3].total > 0) {
    obs.push({ icon: ArrowUpRight, label: "Сүүлд сайжирсан", color: "text-emerald-500" });
  }

  const accs = quarters.filter((q) => q.total > 0).map((q) => q.accuracy);
  if (accs.length >= 3) {
    const range = Math.max(...accs) - Math.min(...accs);
    if (range <= 0.2) {
      obs.push({ icon: Equal, label: "Тогтвортой", color: "text-blue-500" });
    }
  }

  return obs;
}

export function PostMatchAnalysis({ players, gameId }: PostMatchAnalysisProps) {
  const [expanded, setExpanded] = useState(true);

  const ratingChanges = useQuery(
    api.profiles.getGameRatingChanges,
    gameId ? { gameId: gameId as Id<"games"> } : "skip"
  );

  const playerAnalysis = players.map((player) => {
    const quarters = computeQuarters(player.shots);
    const streak = longestHitStreak(player.shots);
    const observations = getObservations(quarters);
    return { name: player.name, userId: player.userId, quarters, streak, observations };
  });

  return (
    <div className="border-t pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-medium">Задаргаа харах</span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 mt-3">
              {playerAnalysis.map((pa, pIndex) => {
                const ratingChange = pa.userId
                  ? ratingChanges?.find((rc) => rc.userId === pa.userId)
                  : undefined;
                const bestQ = pa.quarters.reduce(
                  (best, q, i) =>
                    q.total > 0 && (best === -1 || q.accuracy > pa.quarters[best].accuracy)
                      ? i
                      : best,
                  -1
                );
                const worstQ = pa.quarters.reduce(
                  (worst, q, i) =>
                    q.total > 0 && (worst === -1 || q.accuracy < pa.quarters[worst].accuracy)
                      ? i
                      : worst,
                  -1
                );

                return (
                  <div key={pIndex} className="space-y-2">
                    {/* Player name + rating change */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pa.name}</span>
                      {ratingChange?.ratingChange != null && (
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-xs font-score font-bold",
                            ratingChange.ratingChange > 0
                              ? "text-emerald-500"
                              : ratingChange.ratingChange < 0
                                ? "text-rose-500"
                                : "text-gray-400"
                          )}
                        >
                          {ratingChange.ratingChange > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : ratingChange.ratingChange < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          {ratingChange.ratingChange > 0 ? "+" : ""}
                          {ratingChange.ratingChange}
                        </span>
                      )}
                    </div>

                    {/* Quarter accuracy grid */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {pa.quarters.map((q, qIndex) => {
                        const pct = Math.round(q.accuracy * 100);
                        const isBest = bestQ >= 0 && qIndex === bestQ && q.total > 0;
                        const isWorst =
                          worstQ >= 0 &&
                          qIndex === worstQ &&
                          q.total > 0 &&
                          bestQ !== worstQ;
                        return (
                          <div
                            key={qIndex}
                            className={cn(
                              "rounded-lg p-1.5 text-center",
                              isBest
                                ? "bg-emerald-50 ring-1 ring-emerald-200"
                                : isWorst
                                  ? "bg-rose-50 ring-1 ring-rose-200"
                                  : "bg-gray-50"
                            )}
                          >
                            <div className="text-[9px] text-muted-foreground">
                              {q.label}
                            </div>
                            <div
                              className={cn(
                                "font-score text-sm font-bold tabular-nums",
                                isBest
                                  ? "text-emerald-600"
                                  : isWorst
                                    ? "text-rose-600"
                                    : "text-foreground"
                              )}
                            >
                              {q.total > 0 ? `${pct}%` : "-"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Observations + streak */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {pa.observations.map((obs, i) => {
                        const Icon = obs.icon;
                        return (
                          <span
                            key={i}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-medium",
                              obs.color
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {obs.label}
                          </span>
                        );
                      })}
                      {pa.streak >= 3 && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          🔥 {pa.streak} дараалсан оноо
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
