"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Calendar, Users, Link2, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamHistoryCard } from "@/components/history/TeamHistoryCard";

type GameTypeFilter = "all" | "series" | "team";

export default function HistoryPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [gameTypeFilter, setGameTypeFilter] = useState<GameTypeFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getMe,
    clerkUser ? {} : "skip"
  );

  // Get series games created by this user
  const createdGames = useQuery(
    api.games.listByCreator,
    currentUser ? {} : "skip"
  );

  // Get team games for this user
  const teamGames = useQuery(
    api.teamGames.listByUser,
    currentUser ? {} : "skip"
  );

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/");
    }
  }, [isLoaded, clerkUser, router]);

  const copyLink = async (gameId: string) => {
    const url = `${window.location.origin}/s/${gameId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(gameId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Combined and sorted games for "all" view
  const allGames = useMemo(() => {
    if (!createdGames || !teamGames) return [];

    // Create unified list with type marker
    const series = createdGames.map((g) => ({ ...g, type: "series" as const }));
    const team = teamGames.map((g) => ({ ...g, type: "team" as const }));

    return [...series, ...team].sort((a, b) => b.startedAt - a.startedAt);
  }, [createdGames, teamGames]);

  // Determine what to show based on filter
  const showSeriesGames = gameTypeFilter === "all" || gameTypeFilter === "series";
  const showTeamGames = gameTypeFilter === "all" || gameTypeFilter === "team";

  // Loading state
  if (!isLoaded || createdGames === undefined || teamGames === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="w-20" />
        </div>
        <div className="max-w-md mx-auto space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalCount =
    (gameTypeFilter === "all" ? allGames.length : 0) ||
    (gameTypeFilter === "series" ? (createdGames?.length ?? 0) : 0) ||
    (gameTypeFilter === "team" ? (teamGames?.length ?? 0) : 0);

  const isEmpty =
    (gameTypeFilter === "all" && allGames.length === 0) ||
    (gameTypeFilter === "series" && (!createdGames || createdGames.length === 0)) ||
    (gameTypeFilter === "team" && (!teamGames || teamGames.length === 0));

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <Trophy className="w-5 h-5" />
        <h1 className="font-display text-2xl tracking-wider">ТҮҮХ</h1>
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* Game type tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
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
        </motion.div>

        {/* No games message */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {gameTypeFilter === "team"
                ? "Та одоогоор багийн тоглоом тоглоогүй байна"
                : gameTypeFilter === "series"
                ? "Та одоогоор цуваа тоглоом үүсгээгүй байна"
                : "Та одоогоор тоглоом үүсгээгүй байна"}
            </p>
            <div className="flex gap-2 justify-center">
              {(gameTypeFilter === "all" || gameTypeFilter === "series") && (
                <Link href="/series/setup">
                  <Button variant="outline">Цуваа эхлүүлэх</Button>
                </Link>
              )}
              {(gameTypeFilter === "all" || gameTypeFilter === "team") && (
                <Link href="/team/setup">
                  <Button>Багийн эхлүүлэх</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Game list */}
        <div className="space-y-4">
          {/* All games - mixed and sorted */}
          {gameTypeFilter === "all" &&
            allGames.map((game, index) => {
              if (game.type === "team") {
                return (
                  <TeamHistoryCard
                    key={game._id}
                    game={game}
                    index={index}
                  />
                );
              }

              // Series game card
              const playersWithScores = game.players.map((p) => ({
                ...p,
                score: p.shots.filter((s) => s === true).length,
              }));
              const maxScore = Math.max(...playersWithScores.map((p) => p.score));
              const winners = playersWithScores.filter((p) => p.score === maxScore);
              const gameDate = new Date(game.startedAt);

              return (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            {gameDate.toLocaleDateString("mn-MN")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {game.playerCount} тоглогч
                          </div>
                        </div>
                        {game.isFinished ? (
                          <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                            Дууссан
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Явагдаж байгаа
                          </span>
                        )}
                      </div>

                      {/* Winner */}
                      {game.isFinished && (
                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                          <Trophy className="w-4 h-4" />
                          <span className="font-medium">
                            {winners.length === 1
                              ? `${winners[0].name} (${maxScore}/20)`
                              : `Түрүүлсэн: ${winners.map((w) => w.name).join(", ")} (${maxScore}/20)`}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {game.isFinished ? (
                          <>
                            <Link href={`/s/${game._id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                Харах
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLink(game._id)}
                              className="gap-1"
                            >
                              {copiedId === game._id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Хуулсан
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-3 h-3" />
                                  Холбоос
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Link href={`/series/game/${game._id}`} className="flex-1">
                            <Button size="sm" className="w-full">
                              Үргэлжлүүлэх
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

          {/* Team games only */}
          {gameTypeFilter === "team" &&
            teamGames?.map((game, index) => (
              <TeamHistoryCard key={game._id} game={game} index={index} />
            ))}

          {/* Series games only */}
          {gameTypeFilter === "series" &&
            createdGames?.map((game, index) => {
              const playersWithScores = game.players.map((p) => ({
                ...p,
                score: p.shots.filter((s) => s === true).length,
              }));
              const maxScore = Math.max(...playersWithScores.map((p) => p.score));
              const winners = playersWithScores.filter((p) => p.score === maxScore);
              const gameDate = new Date(game.startedAt);

              return (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            {gameDate.toLocaleDateString("mn-MN")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {game.playerCount} тоглогч
                          </div>
                        </div>
                        {game.isFinished ? (
                          <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                            Дууссан
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Явагдаж байгаа
                          </span>
                        )}
                      </div>

                      {/* Winner */}
                      {game.isFinished && (
                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                          <Trophy className="w-4 h-4" />
                          <span className="font-medium">
                            {winners.length === 1
                              ? `${winners[0].name} (${maxScore}/20)`
                              : `Түрүүлсэн: ${winners.map((w) => w.name).join(", ")} (${maxScore}/20)`}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {game.isFinished ? (
                          <>
                            <Link href={`/s/${game._id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                Харах
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLink(game._id)}
                              className="gap-1"
                            >
                              {copiedId === game._id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Хуулсан
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-3 h-3" />
                                  Холбоос
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Link href={`/series/game/${game._id}`} className="flex-1">
                            <Button size="sm" className="w-full">
                              Үргэлжлүүлэх
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
