"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Home, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type TeamColor, getTeamColors } from "@/lib/team-colors";

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
    homeSet1Pulled?: number;
    awaySet1Pulled?: number;
    homeSet2Pulled?: number;
    awaySet2Pulled?: number;
    wasGoldenPoint: boolean;
  };
  gameId: string;
  awayColor?: TeamColor;
  homeColor?: TeamColor;
}

export function TeamFinishedModal({
  open,
  homeClanName,
  homeClanTag,
  awayClanName,
  awayClanTag,
  result,
  gameId,
  awayColor,
  homeColor,
}: TeamFinishedModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ac = getTeamColors(awayColor, "orange");
  const hc = getTeamColors(homeColor, "blue");

  const winnerName = result.winner === "home" ? homeClanName : awayClanName;
  const winnerTag = result.winner === "home" ? homeClanTag : awayClanTag;
  const wc = result.winner === "home" ? hc : ac;

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
                className={`w-20 h-20 rounded-full flex items-center justify-center ${wc.bg100}`}
              >
                <img src="/app_icon.svg" alt="Шагай Харваа" className="w-10 h-10" />
              </motion.div>
            </div>

            {/* Winner Announcement */}
            <h2 className="text-2xl font-bold text-center mb-1">Тоглолт дууслаа!</h2>
            <p className={`text-center text-lg font-medium ${wc.text500} mb-4`}>
              {winnerTag ? `[${winnerTag}] ` : ""}{winnerName} хожлоо!
            </p>

            {/* Golden Point Badge */}
            {result.wasGoldenPoint && (
              <div className="text-center mb-4">
                <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">
                  Дүүжингээр
                </span>
              </div>
            )}

            {/* Score Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Away Team */}
                <div>
                  <div className={`font-medium text-sm truncate ${ac.text600}`}>
                    {awayClanTag ? `[${awayClanTag}]` : awayClanName}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">VS</div>
                {/* Home Team */}
                <div>
                  <div className={`font-medium text-sm truncate ${hc.text600}`}>
                    {homeClanTag ? `[${homeClanTag}]` : homeClanName}
                  </div>
                </div>
              </div>

              {/* Set Scores */}
              <div className="mt-3 space-y-1">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className={`${ac.text600} font-bold`}>
                    {result.awaySet1Score - (result.awaySet1Pulled ?? 0)}
                    {(result.awaySet1Pulled ?? 0) > 0 && (
                      <span className="text-xs font-normal ml-0.5">(+{result.awaySet1Pulled})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Эхэн өрөг</div>
                  <div className={`${hc.text600} font-bold`}>
                    {result.homeSet1Score - (result.homeSet1Pulled ?? 0)}
                    {(result.homeSet1Pulled ?? 0) > 0 && (
                      <span className="text-xs font-normal ml-0.5">(+{result.homeSet1Pulled})</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className={`${ac.text600} font-bold`}>
                    {result.awaySet2Score - (result.awaySet2Pulled ?? 0)}
                    {(result.awaySet2Pulled ?? 0) > 0 && (
                      <span className="text-xs font-normal ml-0.5">(+{result.awaySet2Pulled})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Дунд өрөг</div>
                  <div className={`${hc.text600} font-bold`}>
                    {result.homeSet2Score - (result.homeSet2Pulled ?? 0)}
                    {(result.homeSet2Pulled ?? 0) > 0 && (
                      <span className="text-xs font-normal ml-0.5">(+{result.homeSet2Pulled})</span>
                    )}
                  </div>
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
