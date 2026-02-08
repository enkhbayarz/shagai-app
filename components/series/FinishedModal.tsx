"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Link2, Home, Check, Share2, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShareCard } from "./ShareCard";
import { PostMatchAnalysis } from "./PostMatchAnalysis";
import html2canvas from "html2canvas";

interface Player {
  name: string;
  userId?: string;
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
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Calculate scores and find winner
  const playersWithScores = players.map((player) => ({
    ...player,
    score: player.shots.filter((s) => s === true).length,
  }));

  const maxScore = playersWithScores.length > 0
    ? Math.max(...playersWithScores.map((p) => p.score))
    : 0;
  const winners = playersWithScores.filter((p) => p.score === maxScore);

  const formattedDate = new Date().toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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

  const handleShare = useCallback(async () => {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) {
        console.error("Failed to create image blob");
        return;
      }

      const file = new File([blob], "shagai-result.png", { type: "image/png" });

      // Use native share if available (mobile), otherwise download
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Шагай Харваа - Үр дүн",
          text: gameId
            ? `${window.location.origin}/s/${gameId}`
            : undefined,
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "shagai-result.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // User cancelled share — not an error
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  }, [sharing, gameId]);

  // Check if native share with files is likely supported (share + canShare APIs)
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm glass max-h-[85vh] overflow-y-auto" showCloseButton={false}>
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
                key={player.name}
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
                  {player.score}/{player.shots.filter((s) => s !== null).length || player.shots.length}
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

        {/* Post-match analysis */}
        <PostMatchAnalysis players={players} gameId={gameId} />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Share image button */}
          <Button
            onClick={handleShare}
            disabled={sharing}
            className="w-full h-12 gap-2 bg-amber-500 text-black hover:bg-amber-400 touch-manipulation font-medium"
          >
            {sharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Зураг бэлдэж байна...
              </>
            ) : canNativeShare ? (
              <>
                <Share2 className="w-4 h-4" />
                Хуваалцах
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Зураг татах
              </>
            )}
          </Button>

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

        {/* Hidden ShareCard for html2canvas capture */}
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <ShareCard ref={shareCardRef} players={players} date={formattedDate} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
