"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Play, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScoutingCard } from "@/components/series/ScoutingCard";

interface PlayerEntry {
  name: string;
  userId?: Id<"users">;
}

export default function SetupPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerEntry[]>([
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Convex queries and mutations
  const currentUser = useQuery(
    api.users.getMe,
    clerkUser ? {} : "skip"
  );
  const searchResults = useQuery(
    api.users.search,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  const createGame = useMutation(api.games.create);
  const createUser = useMutation(api.users.createOrGetUser);

  // Create user in Convex if doesn't exist (null means not found, undefined means loading)
  useEffect(() => {
    if (clerkUser && currentUser === null) {
      createUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        fullName: clerkUser.fullName || clerkUser.firstName || "User",
        username: clerkUser.username || `user_${clerkUser.id.slice(-6)}`,
      });
    }
  }, [clerkUser, currentUser, createUser]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
  };

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { name, userId: undefined };
    setPlayers(newPlayers);
  };

  const handleSelectUser = (index: number, user: { _id: Id<"users">; fullName: string }) => {
    const newPlayers = [...players];
    newPlayers[index] = { name: user.fullName, userId: user._id };
    setPlayers(newPlayers);
    setActivePlayerIndex(null);
    setSearchQuery("");
  };

  const handleClearUser = (index: number) => {
    const newPlayers = [...players];
    newPlayers[index] = { name: "", userId: undefined };
    setPlayers(newPlayers);
  };

  const handleStart = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const gamePlayers = players.slice(0, playerCount).map((player, i) => ({
        name: player.name || `Тоглогч ${i + 1}`,
        userId: player.userId,
      }));

      const gameId = await createGame({
        playerCount,
        players: gamePlayers,
      });

      router.push(`/series/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      setIsCreating(false);
    }
  };

  const canStart = playerCount >= 1 && !isCreating;

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
        <h1 className="font-display text-2xl tracking-wider">ЦУВАА ХАРВАА</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-md mx-auto space-y-6">
        {/* Player Count Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4">Тоглогчдын тоо</h2>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((num) => (
                  <Button
                    key={num}
                    variant={playerCount === num ? "default" : "outline"}
                    className={`h-14 text-xl font-bold touch-manipulation transition-all ${
                      playerCount === num
                        ? "bg-black text-white ring-2 ring-amber-500"
                        : "border-black/20 hover:bg-black/5"
                    }`}
                    onClick={() => handlePlayerCountChange(num)}
                    aria-pressed={playerCount === num}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player Names */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-medium mb-2">Тоглогчдын нэр</h2>
              {Array.from({ length: playerCount }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      players[index].userId ? "bg-emerald-100" : "bg-black/10"
                    }`}>
                      <User className={`w-5 h-5 ${
                        players[index].userId ? "text-emerald-600" : "text-black/50"
                      }`} />
                    </div>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Тоглогч ${index + 1}…`}
                        value={players[index].name}
                        onChange={(e) => {
                          handleNameChange(index, e.target.value);
                          setSearchQuery(e.target.value);
                        }}
                        onFocus={() => setActivePlayerIndex(index)}
                        className="h-12 pr-10"
                        autoComplete="off"
                      />
                      {players[index].userId && (
                        <button
                          onClick={() => handleClearUser(index)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Results Dropdown */}
                  {activePlayerIndex === index && searchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-13 bg-white rounded-lg border shadow-lg overflow-hidden"
                    >
                      {searchResults.slice(0, 5).map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleSelectUser(index, user)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Scouting card for selected registered user */}
                  {players[index].userId && (
                    <ScoutingCard
                      userId={players[index].userId!}
                      currentUserId={currentUser?._id}
                    />
                  )}
                </motion.div>
              ))}

              <p className="text-xs text-muted-foreground mt-2">
                Бүртгэлтэй хэрэглэгч олохын тулд нэр бичнэ үү
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full h-14 text-lg font-bold gap-2 bg-black text-white hover:bg-black/90 touch-manipulation"
          >
            {isCreating ? (
              "Үүсгэж байна…"
            ) : (
              <>
                <Play className="w-5 h-5" />
                ЭХЛЭХ
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
