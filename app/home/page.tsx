"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="w-20" />
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

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
            aria-label="Буцах"
          >
            <ArrowLeft className="w-4 h-4" />
            БУЦАХ
          </Button>
        </Link>
        <h1 className="font-display text-2xl tracking-wider">ХӨТӨЧ</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Leaderboard - takes 2 cols on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <TopPlayersCard
              players={leaderboard}
              showAll={showAll}
              onToggleShowAll={() => setShowAll(!showAll)}
            />
          </motion.div>

          {/* Live Stats - 1 col on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LiveStatsCard stats={liveStats} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
