"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Trophy, Calendar, User, Shield } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get all games
  const allGames = useQuery(api.games.listAll, { limit: 50 });

  // Get all users
  const allUsers = useQuery(api.users.list, { limit: 50 });

  // Check if user is admin (based on role in Convex)
  const isAdmin = currentUser?.role === "admin";

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/");
    }
  }, [isLoaded, clerkUser, router]);

  // Loading state
  if (!isLoaded || currentUser === undefined || allGames === undefined || allUsers === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Ачааллаж байна…</div>
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <Shield className="w-16 h-16 text-gray-300" />
        <div className="text-center">
          <h1 className="font-display text-2xl mb-2">Хандах эрхгүй</h1>
          <p className="text-muted-foreground">
            Энэ хуудас зөвхөн админ эрхтэй хэрэглэгчдэд зориулагдсан
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Нүүр хуудас руу буцах</Button>
        </Link>
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
        <h1 className="font-display text-2xl tracking-wider">АДМИН</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card className="glass">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <div className="font-score text-3xl font-bold">
                {allGames?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Нийт тоглоом</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="font-score text-3xl font-bold">
                {allUsers?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Нийт хэрэглэгч
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Хэрэглэгчид
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allUsers && allUsers.length > 0 ? (
                <div className="space-y-3">
                  {allUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-black/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-black/50" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username} • {user.email}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("mn-MN")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Хэрэглэгч байхгүй
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Games List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Тоглоомууд
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allGames && allGames.length > 0 ? (
                <div className="space-y-3">
                  {allGames.map((game) => {
                    const gameDate = new Date(game.startedAt);
                    const playersWithScores = game.players.map((p) => ({
                      ...p,
                      score: p.shots.filter((s) => s === true).length,
                    }));
                    const maxScore = playersWithScores.length > 0
                      ? Math.max(...playersWithScores.map((p) => p.score))
                      : 0;
                    const winner = playersWithScores.find(
                      (p) => p.score === maxScore
                    );

                    return (
                      <div
                        key={game._id}
                        className="p-3 rounded-lg bg-black/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {gameDate.toLocaleDateString("mn-MN")}{" "}
                            {gameDate.toLocaleTimeString("mn-MN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {game.players.map((p) => p.name).join(", ")}
                          </span>
                        </div>
                        {game.isFinished && winner && (
                          <div className="flex items-center gap-2 mt-1 text-amber-600">
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {winner.name} ({maxScore}/20)
                            </span>
                          </div>
                        )}
                        <div className="mt-2">
                          <Link href={game.isFinished ? `/s/${game._id}` : `/series/game/${game._id}`}>
                            <Button variant="outline" size="sm">
                              {game.isFinished ? "Харах" : "Үргэлжлүүлэх"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Тоглоом байхгүй
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
