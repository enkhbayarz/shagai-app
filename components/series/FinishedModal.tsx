"use client";

import { motion } from "framer-motion";
import { Trophy, Download, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Player {
  name: string;
  shots: (boolean | null)[];
}

interface FinishedModalProps {
  open: boolean;
  players: Player[];
  onDownload: () => void;
  onGoHome: () => void;
}

export function FinishedModal({
  open,
  players,
  onDownload,
  onGoHome,
}: FinishedModalProps) {
  // Calculate scores and find winner
  const playersWithScores = players.map((player) => ({
    ...player,
    score: player.shots.filter((s) => s === true).length,
  }));

  const maxScore = Math.max(...playersWithScores.map((p) => p.score));
  const winners = playersWithScores.filter((p) => p.score === maxScore);

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
                  <span className="font-medium">{player.name}</span>
                  {player.score === maxScore && (
                    <Trophy className="w-4 h-4 text-amber-500" />
                  )}
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
            🏆 {winners[0].name} ялагч!
          </p>
        )}
        {winners.length > 1 && (
          <p className="text-center text-amber-500 font-medium mb-4">
            🏆 Тэнцсэн: {winners.map((w) => w.name).join(", ")}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onDownload}
            className="w-full h-12 gap-2 bg-black text-white hover:bg-black/90 touch-manipulation"
          >
            <Download className="w-4 h-4" />
            Зураг татах
          </Button>
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
