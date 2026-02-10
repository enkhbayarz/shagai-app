"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Copy, Check, Home, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TeamFinishedModalProps {
  open: boolean;
  homeClanName: string;
  homeClanTag: string;
  awayClanName: string;
  awayClanTag: string;
  result: {
    winner: "home" | "away";
    homeSet1Score: number;
    awaySet1Score: number;
    homeSet2Score: number;
    awaySet2Score: number;
    homeTotalPulled: number;
    awayTotalPulled: number;
    wasGoldenPoint: boolean;
  };
  gameId: string;
}

export function TeamFinishedModal({
  open,
  homeClanName,
  homeClanTag,
  awayClanName,
  awayClanTag,
  result,
  gameId,
}: TeamFinishedModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const winnerName = result.winner === "home" ? homeClanName : awayClanName;
  const winnerTag = result.winner === "home" ? homeClanTag : awayClanTag;
  const winnerColor = result.winner === "home" ? "text-blue-500" : "text-orange-500";

  // Set shareUrl client-side to avoid SSR issues
  useEffect(() => {
    setShareUrl(`${window.location.origin}/team/s/${gameId}`);
  }, [gameId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // Clear any existing timeout before setting new one
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            {/* Trophy Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  result.winner === "home" ? "bg-blue-100" : "bg-orange-100"
                }`}
              >
                <Trophy className={`w-10 h-10 ${winnerColor}`} />
              </motion.div>
            </div>

            {/* Winner Announcement */}
            <h2 className="text-2xl font-bold text-center mb-1">Тоглолт дууслаа!</h2>
            <p className={`text-center text-lg font-medium ${winnerColor} mb-4`}>
              [{winnerTag}] {winnerName} ялав!
            </p>

            {/* Golden Point Badge */}
            {result.wasGoldenPoint && (
              <div className="text-center mb-4">
                <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">
                  Алтан оноогоор
                </span>
              </div>
            )}

            {/* Score Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Away Team */}
                <div>
                  <div className="text-xs text-orange-500 font-medium">Зочин</div>
                  <div className="font-medium text-sm">[{awayClanTag}]</div>
                </div>
                <div className="text-xs text-muted-foreground">VS</div>
                {/* Home Team */}
                <div>
                  <div className="text-xs text-blue-500 font-medium">Эзэн</div>
                  <div className="font-medium text-sm">[{homeClanTag}]</div>
                </div>
              </div>

              {/* Set Scores */}
              <div className="mt-3 space-y-1">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="text-orange-600 font-bold">{result.awaySet1Score}</div>
                  <div className="text-xs text-muted-foreground">1-р өрөг</div>
                  <div className="text-blue-600 font-bold">{result.homeSet1Score}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="text-orange-600 font-bold">{result.awaySet2Score}</div>
                  <div className="text-xs text-muted-foreground">2-р өрөг</div>
                  <div className="text-blue-600 font-bold">{result.homeSet2Score}</div>
                </div>
              </div>

              {/* Pulled Points */}
              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Татлаа</div>
                  <div className="font-bold text-orange-600">+{result.awayTotalPulled}</div>
                </div>
                <div />
                <div>
                  <div className="text-xs text-muted-foreground">Татлаа</div>
                  <div className="font-bold text-blue-600">+{result.homeTotalPulled}</div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="space-y-2 mb-4">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Хуулагдлаа!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Линк хуулах
                  </>
                )}
              </Button>
            </div>

            {/* Home Button */}
            <Link href="/">
              <Button className="w-full gap-2">
                <Home className="w-4 h-4" />
                Нүүр хуудас
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
