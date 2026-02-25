"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { User, Play, X, Users, Target } from "lucide-react";
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

// Custom color palette for each player slot
const PLAYER_THEMES = [
  { id: 1, light: "bg-blue-50", accent: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-500" },
  { id: 2, light: "bg-emerald-50", accent: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-500" },
  { id: 3, light: "bg-amber-50", accent: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500" },
  { id: 4, light: "bg-rose-50", accent: "bg-rose-500", text: "text-rose-600", ring: "ring-rose-500" },
];

export default function SetupPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerEntry[]>(Array(4).fill({ name: "" }));
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const currentUser = useQuery(api.users.getMe, clerkUser ? {} : "skip");
  const searchResults = useQuery(
    api.users.search,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  const createGame = useMutation(api.games.create);
  const createUser = useMutation(api.users.createOrGetUser);

  useEffect(() => {
    if (clerkUser && currentUser === null) {
      createUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        fullName: clerkUser.fullName || clerkUser.firstName || "User",
        username: clerkUser.username || `user_${clerkUser.id.slice(-6)}`,
      });
    }
  }, [clerkUser, currentUser, createUser]);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name, userId: undefined };
    setPlayers(newPlayers);
  };

  const handleSelectUser = (index: number, user: { _id: Id<"users">; fullName: string }) => {
    const newPlayers = [...players];
    newPlayers[index] = { name: user.fullName, userId: user._id };
    setPlayers(newPlayers);
    setActivePlayerIndex(null);
    setSearchQuery("");
  };

  const handleStart = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const gamePlayers = players.slice(0, playerCount).map((p, i) => ({
        name: p.name || `Тоглогч ${i + 1}`,
        userId: p.userId,
      }));
      const gameId = await createGame({ playerCount, players: gamePlayers });
      router.push(`/series/game/${gameId}`);
    } catch (e) {
      console.error(e);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-[#f8fafc]">
      <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 pt-4">
        <h1 className="font-display text-2xl tracking-[0.25em] text-center font-black text-slate-900 uppercase">ЦУВАА ХАРВАА</h1>
      </motion.header>

      <div className="max-w-md mx-auto space-y-6">
        {/* Segmented Slider Selection */}
        <Card className="border-none shadow-sm bg-white/80 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-slate-600">
              <Users className="w-4 h-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">Харваачдын тоо</h2>
            </div>
            
            <div className="relative flex p-1 bg-slate-100 rounded-xl">
              {/* Sliding Background Indicator */}
              <motion.div
                className="absolute inset-y-1 bg-white rounded-lg shadow-sm"
                initial={false}
                animate={{
                  width: `${100 / 4}%`,
                  x: `${(playerCount - 1) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  className={`relative z-10 flex-1 py-3 text-lg font-bold transition-colors ${
                    playerCount === num ? "text-black" : "text-slate-400"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Slim Player Slots with Custom Colors */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {players.slice(0, playerCount).map((player, index) => {
              const theme = PLAYER_THEMES[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  layout
                >
                  <Card className={`overflow-hidden border-none shadow-sm transition-all duration-200 ${activePlayerIndex === index ? `ring-2 ${theme.ring}` : ""}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center">
                        {/* Themed Color Indicator */}
                        <div className={`w-1.5 self-stretch ${theme.accent}`} />
                        
                        <div className="flex items-center gap-3 p-2 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${player.userId ? theme.light : "bg-slate-50"}`}>
                            <User className={`w-4 h-4 ${player.userId ? theme.text : "text-slate-300"}`} />
                          </div>
                          
                          <div className="flex-1">
                            <Input
                              placeholder={`Харваач ${index + 1}-ийн нэр`}
                              value={player.name}
                              maxLength={30}
                              onChange={(e) => handleNameChange(index, e.target.value)}
                              onFocus={() => setActivePlayerIndex(index)}
                              enterKeyHint={index === playerCount - 1 ? "done" : "next"} // Dynamic keyboard button
                              className="border-none bg-transparent p-0 text-lg font-medium focus-visible:ring-0 placeholder:text-slate-300"
                              autoComplete="off"
                            />
                          </div>

                          {player.name && (
                            <button 
                              onClick={() => handleNameChange(index, "")} 
                              className="p-3 -mr-2 hover:bg-slate-50 rounded-full transition-colors">
                              <X className="w-4 h-4 text-slate-300" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search Results Dropdown */}
                      <AnimatePresence>
                        {activePlayerIndex === index && searchQuery.length >= 2 && searchResults && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-white border-t overflow-hidden">
                            {searchResults.slice(0, 2).map((u) => (
                              <button
                                key={u._id}
                                onClick={() => handleSelectUser(index, u)}
                                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 border-b last:border-0"
                              >
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                  <User className="w-3 h-3 text-slate-400" />
                                </div>
                                <div className="text-left leading-tight">
                                  <p className="text-[11px] font-bold text-slate-800">{u.fullName}</p>
                                  <p className="text-[9px] text-slate-400">@{u.username}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {player.userId && (
                        <div className="bg-slate-50/50 border-t">
                          <ScoutingCard userId={player.userId} currentUserId={currentUser?._id} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Start Button Area */}
        <div className="pt-4 space-y-4">
          <Button
            onClick={handleStart}
            disabled={isCreating}
            className="w-full h-14 text-base font-black bg-slate-900 text-white hover:bg-black rounded-xl shadow-lg active:scale-[0.97] transition-all"
          >
            {isCreating ? "ҮҮСГЭЖ БАЙНА..." : (
              <div className="flex items-center gap-3">
                <Play className="w-4 h-4 fill-current" />
                ЭХЛЭХ
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
