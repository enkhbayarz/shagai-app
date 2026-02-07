"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SetupPage() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", ""]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    // Create game data and store in sessionStorage for now
    // Later this will be stored in Convex
    const gameData = {
      playerCount,
      players: playerNames.slice(0, playerCount).map((name, i) => ({
        name: name || `Тоглогч ${i + 1}`,
        shots: Array(20).fill(null),
      })),
      currentRound: 1,
      currentPlayerIndex: 0,
      isFinished: false,
      startedAt: Date.now(),
    };

    sessionStorage.setItem("shagai-game", JSON.stringify(gameData));
    router.push("/series/game");
  };

  const canStart = playerCount >= 1;

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
                        ? "bg-white text-black ring-2 ring-amber-500"
                        : "border-white/20 hover:bg-white/5"
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
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white/70" />
                  </div>
                  <Input
                    placeholder={`Тоглогч ${index + 1}…`}
                    value={playerNames[index]}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="h-12 flex-1"
                    autoComplete="off"
                  />
                </motion.div>
              ))}
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
            className="w-full h-14 text-lg font-bold gap-2 bg-white text-black hover:bg-white/90 touch-manipulation"
          >
            <Play className="w-5 h-5" />
            ЭХЛЭХ
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
