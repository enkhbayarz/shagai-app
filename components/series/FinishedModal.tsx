"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Link2, Home, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Player {
  name: string;
  shots: (boolean | null)[];
}

interface FinishedModalProps {
  open: boolean;
  players: Player[];
  gameId?: string;
  onGoHome: () => void;
}

export function FinishedModal({
  open,
  players,
  gameId,
  onGoHome,
}: FinishedModalProps) {
  const [copied, setCopied] = useState(false);

  // Calculate scores and find winner
  const playersWithScores = players.map((player) => ({
    ...player,
    score: player.shots.filter((s) => s === true).length,
  }));

  const maxScore = Math.max(...playersWithScores.map((p) => p.score));
  const winners = playersWithScores.filter((p) => p.score === maxScore);

  const handleCopyLink = async () => {
    if (!gameId) return;

    const shareUrl = `${window.location.origin}/s/${gameId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm glass" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-amber-500" />
            Тоглоом дууссан!
          </DialogTitle>
          <DialogDescription className="text-center">
            Бүх харваа амжилттай бүртгэгдлээ
          </DialogDescription>
        </DialogHeader>

        {/* Results */}
        <div className="space-y-3 my-4">
          {playersWithScores
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.score === maxScore
                    ? "bg-amber-500/20 ring-1 ring-amber-500"
                    : "bg-black/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-score text-lg font-bold w-6">
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{player.name}</span>
                      {player.score === maxScore && (
                        <Trophy className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    {/* Shot dots - single row */}
                    <div className="flex gap-[3px] mt-1">
                      {player.shots.map((shot, shotIndex) => (
                        <div
                          key={shotIndex}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            shot === true && "bg-emerald-500",
                            shot === false && "bg-rose-500",
                            shot === null && "bg-gray-300",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="font-score text-xl font-bold">
                  {player.score}/20
                </span>
              </motion.div>
            ))}
        </div>

        {/* Winner announcement */}
        {winners.length === 1 && (
          <p className="text-center text-amber-500 font-medium mb-4">
            🏆 {winners[0].name} түрүүлсэн!
          </p>
        )}
        {winners.length > 1 && (
          <p className="text-center text-amber-500 font-medium mb-4">
            🏆 Түрүүлсэн: {winners.map((w) => w.name).join(", ")}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {gameId && (
            <Button
              onClick={handleCopyLink}
              className="w-full h-12 gap-2 bg-black text-white hover:bg-black/90 touch-manipulation"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Хуулагдсан!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Холбоос хуулах
                </>
              )}
            </Button>
          )}
          <Button
            onClick={onGoHome}
            variant="outline"
            className="w-full h-12 gap-2 touch-manipulation"
          >
            <Home className="w-4 h-4" />
            Нүүр хуудас
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
