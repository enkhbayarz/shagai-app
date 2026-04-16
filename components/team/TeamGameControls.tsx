"use client";

import { motion } from "framer-motion";
import { type TeamColor } from "@/lib/team-colors";

interface TeamGameControlsProps {
  currentShooterName: string;
  currentTeam: "home" | "away";
  shotNumber: number; // 1-4
  onHit: () => void;
  onMiss: () => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
  disabled?: boolean;
  awayColor?: TeamColor;
  homeColor?: TeamColor;
}

export function TeamGameControls({
  onHit,
  onMiss,
  onSkip,
  showSkipButton = false,
  disabled = false,
}: TeamGameControlsProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 isolate w-screen max-w-full overflow-hidden border-t bg-white px-3 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg"
      aria-busy={disabled}
    >
      {/* Control Buttons */}
      <div className="mx-auto flex w-full max-w-sm justify-center gap-3 sm:gap-4">
        {/* Miss Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={onMiss}
          disabled={disabled}
          aria-label="Алдаа бүртгэх"
          className={`h-16 w-16 rounded-full bg-red-500 text-sm font-bold text-white shadow-lg transition-all touch-manipulation sm:h-20 sm:w-20 sm:text-lg
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 active:bg-red-700"}
          `}
        >
          Алдаа
        </motion.button>

        {/* Skip Button - Only for 6v6 first round */}
        {showSkipButton && onSkip && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onSkip}
            disabled={disabled}
            aria-label="Харвааг алгасах"
            className={`h-16 w-16 rounded-full bg-gray-400 text-sm font-bold text-white shadow-lg transition-all touch-manipulation sm:h-20 sm:w-20 sm:text-lg
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-500 active:bg-gray-600"}
            `}
          >
            Алгасах
          </motion.button>
        )}

        {/* Hit Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={onHit}
          disabled={disabled}
          aria-label="Оноо бүртгэх"
          className={`h-16 w-16 rounded-full bg-emerald-500 text-sm font-bold text-white shadow-lg transition-all touch-manipulation sm:h-20 sm:w-20 sm:text-lg
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-600 active:bg-emerald-700"}
          `}
        >
          Оноо
        </motion.button>
      </div>
    </div>
  );
}
