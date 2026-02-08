"use client";

import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/TierBadge";
import { cn } from "@/lib/utils";

interface ScoutingCardProps {
  userId: Id<"users">;
  currentUserId?: Id<"users">;
}

export function ScoutingCard({ userId, currentUserId }: ScoutingCardProps) {
  const scouting = useQuery(api.profiles.getScoutingData, {
    userId,
    vsUserId: currentUserId && currentUserId !== userId ? currentUserId : undefined,
  });

  const h2h = scouting?.h2h ?? null;

  if (scouting === undefined) {
    return (
      <div className="ml-13 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (!scouting || !scouting.stats) {
    return (
      <div className="ml-13">
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-3 text-center text-xs text-muted-foreground">
            Статистик байхгүй
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats } = scouting;
  const winRate =
    stats.totalGames > 0
      ? Math.round((stats.totalWins / stats.totalGames) * 100)
      : 0;
  const recentForm = stats.last10Results.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="ml-13 overflow-hidden"
    >
      <Card className="bg-amber-50/50 border-amber-200/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tier + Rating */}
            <TierBadge rating={stats.rating} size="sm" />
            <span className="font-score text-sm font-bold tabular-nums">
              {stats.rating}
            </span>

            {/* Divider */}
            <div className="w-px h-4 bg-black/10" />

            {/* Win rate */}
            <span className="text-xs text-muted-foreground">
              Ялалт:{" "}
              <span className="font-score font-bold">{winRate}%</span>
            </span>

            {/* Divider */}
            <div className="w-px h-4 bg-black/10" />

            {/* Recent form */}
            {recentForm.length > 0 && (
              <div className="flex items-center gap-1">
                {recentForm.map((isWin, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      isWin ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* H2H line */}
          {h2h && h2h.totalGames > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Та:{" "}
              <span className="font-score font-bold text-emerald-600">
                {h2h.wins}
              </span>
              -
              <span className="font-score font-bold text-rose-600">
                {h2h.losses}
              </span>
              {h2h.draws > 0 && (
                <>
                  -
                  <span className="font-score font-bold text-gray-500">
                    {h2h.draws}
                  </span>
                </>
              )}
              <span className="ml-1">({h2h.totalGames} тоглоом)</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
