"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  totalGames: number;
  totalWins: number;
  avgAccuracy: number;
  rating: number;
  currentStreak: number;
  bestStreak: number;
  last10Results: boolean[];
}

const statItems = [
  { key: "games", label: "Тоглоом", icon: Gamepad2 },
  { key: "winRate", label: "Ялалт", icon: Trophy },
  { key: "accuracy", label: "Нарийвчлал", icon: Target },
  { key: "rating", label: "Рейтинг", icon: TrendingUp },
  { key: "streak", label: "Одоогийн цуваа", icon: Flame },
  { key: "bestStreak", label: "Шилдэг цуваа", icon: Award },
] as const;

export function StatsGrid({
  totalGames,
  totalWins,
  avgAccuracy,
  rating,
  currentStreak,
  bestStreak,
  last10Results,
}: StatsGridProps) {
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const accuracyPct = Math.round(avgAccuracy * 100);

  const values: Record<string, string> = {
    games: totalGames.toString(),
    winRate: `${winRate}%`,
    accuracy: `${accuracyPct}%`,
    rating: rating.toString(),
    streak: currentStreak > 0 ? `+${currentStreak}` : currentStreak.toString(),
    bestStreak: bestStreak.toString(),
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass">
                <CardContent className="p-3 text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-score text-lg font-bold tabular-nums">
                    {values[item.key]}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {item.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Last 10 results */}
      {last10Results.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Сүүлийн 10:</span>
          <div className="flex gap-1">
            {last10Results.map((isWin, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full",
                  isWin ? "bg-emerald-500" : "bg-rose-500"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
