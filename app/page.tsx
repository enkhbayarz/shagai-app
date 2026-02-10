"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TopPlayersCard } from "@/components/home/TopPlayersCard";
import { LiveStatsCard } from "@/components/home/LiveStatsCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [showAll, setShowAll] = useState(false);

  const leaderboard = useQuery(api.dashboard.getLeaderboard, { limit: 50 });
  const liveStats = useQuery(api.dashboard.getLiveStats, {});

  // Loading state
  if (leaderboard === undefined || liveStats === undefined) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TopPlayersCard
              players={leaderboard}
              showAll={showAll}
              onToggleShowAll={() => setShowAll(!showAll)}
            />
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LiveStatsCard stats={liveStats} />
          </motion.div>
        </div>

        {/* Recent Games Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-5 shadow-sm border"
        >
          <h3 className="font-medium mb-4">Сүүлийн тоглоом</h3>
          <div className="text-sm text-muted-foreground text-center py-8">
            Тоглоомын түүх энд харагдана
          </div>
        </motion.div>
      </div>
    </div>
  );
}
