"use client";

import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface HeadToHeadProps {
  userId: Id<"users">;
  currentUserId?: Id<"users">;
}

export function HeadToHead({ userId, currentUserId }: HeadToHeadProps) {
  const h2h = useQuery(
    api.profiles.getHeadToHead,
    currentUserId && currentUserId !== userId
      ? { userIdA: currentUserId, userIdB: userId }
      : "skip"
  );

  // Don't render if viewing own profile or no current user
  if (!currentUserId || currentUserId === userId) return null;

  // Loading
  if (h2h === undefined) {
    return (
      <Card className="glass">
        <CardContent className="p-4">
          <div className="h-12 animate-pulse bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-orange-500" />
          <h2 className="font-display text-xl tracking-wider">Тулаан</h2>
        </div>
      </CardHeader>
      <CardContent>
        {h2h.totalGames === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Тулаан тоглоогүй
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="text-center">
              <div className="font-score text-3xl font-bold text-emerald-500 tabular-nums">
                {h2h.wins}
              </div>
              <div className="text-[10px] text-muted-foreground">Ялалт</div>
            </div>
            <div className="text-center">
              <div className="font-score text-xl font-bold text-gray-400 tabular-nums">
                {h2h.draws}
              </div>
              <div className="text-[10px] text-muted-foreground">Тэнцээ</div>
            </div>
            <div className="text-center">
              <div className="font-score text-3xl font-bold text-rose-500 tabular-nums">
                {h2h.losses}
              </div>
              <div className="text-[10px] text-muted-foreground">Хожигдол</div>
            </div>
            <div className="ml-2 text-xs text-muted-foreground">
              {h2h.totalGames} тоглоом
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
