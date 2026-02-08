"use client";

import { motion } from "framer-motion";
import { Trophy, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GameEntry {
  gameId: string;
  score: number;
  rank: number;
  playerCount: number;
  startedAt: number;
  result: { userId?: string; name: string; score: number; rank: number }[];
}

interface RecentGamesListProps {
  games: GameEntry[];
}

export function RecentGamesList({ games }: RecentGamesListProps) {
  if (games.length === 0) {
    return (
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display text-lg tracking-wider">
              Сүүлийн тоглоомууд
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            Тоглоом олдсонгүй
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-lg tracking-wider">
            Сүүлийн тоглоомууд
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {games.map((game, index) => {
            const isWin = game.rank === 1;
            const date = new Date(game.startedAt).toLocaleDateString("mn-MN", {
              month: "short",
              day: "numeric",
            });

            return (
              <motion.div
                key={game.gameId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg",
                  isWin ? "bg-amber-50" : "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isWin
                        ? "bg-amber-100 text-amber-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isWin ? (
                      <Trophy className="w-4 h-4" />
                    ) : (
                      <span className="font-score text-xs font-bold">
                        #{game.rank}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {date}
                      </span>
                      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {game.playerCount}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="font-score text-sm font-bold tabular-nums">
                  {game.score}/20
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
