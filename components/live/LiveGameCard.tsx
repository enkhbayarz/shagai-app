"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface LiveGameSummary {
  _id: Id<"games">;
  startedAt: number;
  playerCount: number;
  currentRound: number;
  currentPlayerIndex: number;
  players: {
    name: string;
    score: number;
  }[];
  progressPercent: number;
}

interface LiveGameCardProps {
  game: LiveGameSummary;
  index: number;
}

export function LiveGameCard({ game, index }: LiveGameCardProps) {
  // Find current leader (handle empty array case)
  const maxScore = game.players.length > 0
    ? Math.max(...game.players.map((p) => p.score))
    : 0;

  // Time since started - use state to avoid impure render
  const [timeDisplay, setTimeDisplay] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const minutesAgo = Math.floor((Date.now() - game.startedAt) / 60000);
      setTimeDisplay(
        minutesAgo < 1 ? "Дөнгөж эхэлсэн" : `${minutesAgo} мин өмнө`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [game.startedAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${game.progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <CardContent className="pt-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {game.playerCount} тоглогч
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {timeDisplay}
              </div>
            </div>

            {/* Live badge with round */}
            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                ШУУД
              </span>
              <span className="text-xs text-muted-foreground">
                Раунд {game.currentRound}/20
              </span>
            </div>
          </div>

          {/* Players mini scoreboard */}
          <div className="space-y-2 mb-3">
            {game.players.map((player, i) => {
              const isActive = i === game.currentPlayerIndex;
              const isLeader = player.score === maxScore && maxScore > 0;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between py-1 px-2 rounded-lg transition-colors",
                    isActive && "bg-amber-50 ring-1 ring-amber-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isLeader && maxScore > 0 && (
                      <TrendingUp className="w-3 h-3 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        "text-sm truncate max-w-[140px]",
                        isActive && "font-medium"
                      )}
                    >
                      {player.name}
                    </span>
                    {isActive && (
                      <span className="text-xs text-amber-600">
                        (харвах ээлж)
                      </span>
                    )}
                  </div>
                  <span className="font-score text-lg font-bold tabular-nums">
                    {player.score}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Watch button */}
          <Link href={`/live/${game._id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full touch-manipulation"
            >
              Үзэх
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
