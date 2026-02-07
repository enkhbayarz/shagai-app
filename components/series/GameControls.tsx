"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameControlsProps {
  currentShot: number;
  totalShots: number;
  onHit: () => void;
  onMiss: () => void;
  disabled?: boolean;
}

export function GameControls({
  currentShot,
  totalShots,
  onHit,
  onMiss,
  disabled,
}: GameControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-4">
          {/* Hit Button */}
          <Button
            onClick={onHit}
            disabled={disabled}
            className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 touch-manipulation"
            aria-label="Онсон"
          >
            <Check className="w-10 h-10" strokeWidth={3} />
          </Button>

          {/* Miss Button */}
          <Button
            onClick={onMiss}
            disabled={disabled}
            className="w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 touch-manipulation"
            aria-label="Алдсан"
          >
            <X className="w-10 h-10" strokeWidth={3} />
          </Button>

          {/* Round Counter */}
          <div className="ml-4 text-center">
            <div className="font-score text-3xl font-bold tabular-nums">
              {currentShot} / {totalShots}
            </div>
            <div className="text-xs text-muted-foreground">харваа</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
