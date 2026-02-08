"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Calendar, Users, Link2, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get games created by this user
  const createdGames = useQuery(
    api.games.listByCreator,
    currentUser?._id ? { creatorId: currentUser._id } : "skip"
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

  // Loading state
  if (!isLoaded || createdGames === undefined) {
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
        <h1 className="font-display text-2xl tracking-wider">ТҮҮХ</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* No games message */}
        {createdGames && createdGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Та одоогоор тоглоом үүсгээгүй байна
            </p>
            <Link href="/series/setup">
              <Button>Тоглоом эхлүүлэх</Button>
            </Link>
          </motion.div>
        )}

        {/* Game list */}
        <div className="space-y-4">
          {createdGames?.map((game, index) => {
            // Calculate winner
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
