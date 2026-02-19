"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Clock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";

interface TeamLiveGameSummary {
  _id: Id<"teamGames">;
  startedAt: number;
  playersPerTeam: number;
  homeClanName: string;
  homeClanTag: string;
  awayClanName: string;
  awayClanTag: string;
  currentSet: number;
  homeScore: number;
  awayScore: number;
}

interface TeamLiveGameCardProps {
  game: TeamLiveGameSummary;
  index: number;
}

export function TeamLiveGameCard({ game, index }: TeamLiveGameCardProps) {
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

  // Calculate progress (rough estimate based on scores)
  const totalPossibleScore = 30; // Each set ends at combined 30
  const currentProgress = game.homeScore + game.awayScore;
  const progressPercent = Math.min(
    ((game.currentSet - 1) * 50) + (currentProgress / totalPossibleScore) * 50,
    100
  );

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
            className="h-full bg-gradient-to-r from-orange-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <CardContent className="pt-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {game.playersPerTeam}v{game.playersPerTeam}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {timeDisplay}
              </div>
            </div>

            {/* Live badge with set */}
            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                ШУУД
              </span>
              <span className="text-xs text-muted-foreground">
                Сет {game.currentSet}
              </span>
            </div>
          </div>

          {/* Team scoreboard */}
          <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              {/* Home team */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {game.homeClanTag && (
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                      {game.homeClanTag.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-medium truncate max-w-[80px]">
                    {game.homeClanName}
                  </span>
                </div>
                <span className="font-score text-3xl font-bold text-orange-600 tabular-nums">
                  {game.homeScore}
                </span>
              </div>

              {/* VS divider */}
              <div className="px-3 flex flex-col items-center">
                <span className="text-xs text-muted-foreground font-medium">VS</span>
                <Trophy className="w-4 h-4 text-amber-500 mt-1" />
              </div>

              {/* Away team */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate max-w-[80px]">
                    {game.awayClanName}
                  </span>
                  {game.awayClanTag && (
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                      {game.awayClanTag.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-score text-3xl font-bold text-blue-600 tabular-nums">
                  {game.awayScore}
                </span>
              </div>
            </div>
          </div>

          {/* Watch button */}
          <Link href={`/live/team/${game._id}`}>
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
