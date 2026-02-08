"use client";

import { motion } from "framer-motion";
import { Trophy, Target, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PlayerEntry {
  rank: number;
  fullName: string;
  username: string;
  totalHits: number;
  totalGames: number;
  avgScore: number;
}

interface TopPlayersCardProps {
  players: PlayerEntry[];
  showAll: boolean;
  onToggleShowAll: () => void;
}

export function TopPlayersCard({
  players,
  showAll,
  onToggleShowAll,
}: TopPlayersCardProps) {
  const displayed = showAll ? players : players.slice(0, 10);

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-xl tracking-wider">
              Шилдэг тоглогчид
            </h2>
          </div>
          {players.length > 10 && (
            <button
              onClick={onToggleShowAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAll ? "Хураангуй" : "Бүгдийг харах"}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Тоглогч олдсонгүй
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="flex items-center px-3 py-2 text-xs text-muted-foreground border-b">
              <span className="w-8">#</span>
              <span className="flex-1">Тоглогч</span>
              <span className="w-16 text-right">Нийт</span>
              <span className="w-16 text-right">Тоглоом</span>
              <span className="w-16 text-right">Дундаж</span>
            </div>

            {displayed.map((player, index) => (
              <motion.div
                key={player.username}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  player.rank === 1
                    ? "bg-amber-50"
                    : player.rank === 2
                      ? "bg-gray-50"
                      : player.rank === 3
                        ? "bg-orange-50/50"
                        : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-8 font-score text-sm font-bold tabular-nums ${
                    player.rank === 1
                      ? "text-amber-500"
                      : player.rank === 2
                        ? "text-gray-400"
                        : player.rank === 3
                          ? "text-orange-400"
                          : "text-muted-foreground"
                  }`}
                >
                  {player.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        player.rank <= 3 ? "bg-amber-100" : "bg-gray-100"
                      }`}
                    >
                      <User
                        className={`w-3.5 h-3.5 ${
                          player.rank <= 3
                            ? "text-amber-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {player.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{player.username}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="w-16 text-right font-score text-sm font-bold tabular-nums">
                  {player.totalHits}
                </span>
                <span className="w-16 text-right font-score text-sm tabular-nums text-muted-foreground">
                  {player.totalGames}
                </span>
                <span className="w-16 text-right font-score text-sm tabular-nums text-muted-foreground">
                  {player.avgScore}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
