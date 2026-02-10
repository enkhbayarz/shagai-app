"use client";

import { motion } from "framer-motion";

interface TeamGameControlsProps {
  currentShooterName: string;
  currentTeam: "home" | "away";
  shotNumber: number; // 1-4
  onHit: () => void;
  onMiss: () => void;
  disabled?: boolean;
}

export function TeamGameControls({
  currentShooterName,
  currentTeam,
  shotNumber,
  onHit,
  onMiss,
  disabled = false,
}: TeamGameControlsProps) {
  const teamColor = currentTeam === "home" ? "text-blue-600" : "text-orange-600";
  const teamLabel = currentTeam === "home" ? "Эзэн" : "Зочин";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
      {/* Current Shooter Info */}
      <div className="text-center mb-3">
        <div className="text-xs text-muted-foreground">{teamLabel} баг</div>
        <div className={`font-medium ${teamColor}`}>{currentShooterName}</div>
        <div className="text-xs text-muted-foreground">
          {shotNumber}/4 сум
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 justify-center">
        {/* Miss Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onMiss}
          disabled={disabled}
          className={`w-20 h-20 rounded-full bg-red-500 text-white font-bold text-lg shadow-lg transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 active:bg-red-700"}
          `}
        >
          Алдаа
        </motion.button>

        {/* Hit Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onHit}
          disabled={disabled}
          className={`w-20 h-20 rounded-full bg-emerald-500 text-white font-bold text-lg shadow-lg transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-600 active:bg-emerald-700"}
          `}
        >
          Оноо
        </motion.button>
      </div>
    </div>
  );
}
