"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Radio, Users, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveGameCard } from "@/components/live/LiveGameCard";
import { TeamLiveGameCard } from "@/components/live/TeamLiveGameCard";
import { Skeleton } from "@/components/ui/skeleton";

type GameTypeFilter = "all" | "series" | "team";

export default function LivePage() {
  const [gameTypeFilter, setGameTypeFilter] = useState<GameTypeFilter>("all");
  const [playerCountFilter, setPlayerCountFilter] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch live series games with optional player count filter
  const liveGames = useQuery(api.games.listLive, {
    playerCount: playerCountFilter ?? undefined,
  });

  // Fetch live team games
  const liveTeamGames = useQuery(api.teamGames.listLive, {});

  // Client-side search filter for series games
  const filteredSeriesGames = useMemo(() => {
    if (!liveGames) return [];
    if (!searchQuery.trim()) return liveGames;

    const query = searchQuery.toLowerCase();
    return liveGames.filter((game) =>
      game.players.some((p) => p.name.toLowerCase().includes(query))
    );
  }, [liveGames, searchQuery]);

  // Client-side search filter for team games
  const filteredTeamGames = useMemo(() => {
    if (!liveTeamGames) return [];
    if (!searchQuery.trim()) return liveTeamGames;

    const query = searchQuery.toLowerCase();
    return liveTeamGames.filter(
      (game) =>
        game.homeClanName.toLowerCase().includes(query) ||
        game.awayClanName.toLowerCase().includes(query)
    );
  }, [liveTeamGames, searchQuery]);

  // Determine what to show based on filter
  const showSeriesGames = gameTypeFilter === "all" || gameTypeFilter === "series";
  const showTeamGames = gameTypeFilter === "all" || gameTypeFilter === "team";

  // Loading state
  if (liveGames === undefined || liveTeamGames === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
          <div className="w-20" />
        </div>
        <div className="max-w-md mx-auto space-y-3">
          <Skeleton className="h-10 rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalGamesCount = filteredSeriesGames.length + filteredTeamGames.length;
  const isEmpty =
    (gameTypeFilter === "all" && totalGamesCount === 0) ||
    (gameTypeFilter === "series" && filteredSeriesGames.length === 0) ||
    (gameTypeFilter === "team" && filteredTeamGames.length === 0);

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <Radio className="w-5 h-5 text-red-500 animate-pulse" />
        <h1 className="font-display text-2xl tracking-wider">ШУУД</h1>
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-3"
        >
          {/* Game type tabs */}
          <div className="flex gap-2">
            {(["all", "series", "team"] as GameTypeFilter[]).map((type) => (
              <Button
                key={type}
                variant={gameTypeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setGameTypeFilter(type)}
                className="flex-1 touch-manipulation"
              >
                {type === "all" && "Бүгд"}
                {type === "series" && "Цуваа"}
                {type === "team" && "Багийн"}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                gameTypeFilter === "team"
                  ? "Баг хайх..."
                  : "Тоглогч хайх..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Player count filter - only for series games */}
          {gameTypeFilter !== "team" && (
            <div className="flex gap-2">
              {[null, 1, 2, 3, 4].map((count) => (
                <Button
                  key={count ?? "all"}
                  variant={playerCountFilter === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlayerCountFilter(count)}
                  className="flex-1 touch-manipulation"
                >
                  {count ? `${count}` : "Бүгд"}
                  {count && <Users className="w-3 h-3 ml-1" />}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Empty state */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "Хайлтад тохирох тоглоом олдсонгүй"
                : gameTypeFilter === "team"
                ? "Одоогоор багийн шууд тоглоом байхгүй байна"
                : gameTypeFilter === "series"
                ? "Одоогоор цуваа шууд тоглоом байхгүй байна"
                : "Одоогоор шууд тоглоом байхгүй байна"}
            </p>
          </motion.div>
        )}

        {/* Live games list */}
        <div className="space-y-4">
          {/* Team games section */}
          {showTeamGames && filteredTeamGames.length > 0 && (
            <>
              {gameTypeFilter === "all" && (
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-orange-200 to-blue-200" />
                  <span className="text-xs text-muted-foreground font-medium px-2">
                    БАГИЙН ТОГЛООМ ({filteredTeamGames.length})
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-orange-200 to-blue-200" />
                </div>
              )}
              {filteredTeamGames.map((game, index) => (
                <TeamLiveGameCard key={game._id} game={game} index={index} />
              ))}
            </>
          )}

          {/* Series games section */}
          {showSeriesGames && filteredSeriesGames.length > 0 && (
            <>
              {gameTypeFilter === "all" && filteredTeamGames.length > 0 && (
                <div className="flex items-center gap-2 mt-4 mb-2">
                  <div className="h-px flex-1 bg-amber-200" />
                  <span className="text-xs text-muted-foreground font-medium px-2">
                    ЦУВАА ТОГЛООМ ({filteredSeriesGames.length})
                  </span>
                  <div className="h-px flex-1 bg-amber-200" />
                </div>
              )}
              {filteredSeriesGames.map((game, index) => (
                <LiveGameCard key={game._id} game={game} index={index} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
