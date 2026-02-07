"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { ShotGroup } from "./ShotGroup";
import { cn } from "@/lib/utils";

interface PlayerRowProps {
  name: string;
  shots: (boolean | null)[];
  score: number;
  isActive: boolean;
  currentShotIndex: number;
  onEditShot?: (index: number) => void;
}

export function PlayerRow({
  name,
  shots,
  score,
  isActive,
  currentShotIndex,
  onEditShot,
}: PlayerRowProps) {
  // Split shots into groups of 4
  const groups = [0, 4, 8, 12, 16]; // Starting indices for each group

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl p-3 transition-all",
        isActive
          ? "bg-[rgba(255,255,255,0.1)] ring-2 ring-[#f59e0b] active-glow"
          : "bg-[rgba(255,255,255,0.05)]"
      )}
    >
      {/* Player Info Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isActive ? "bg-[rgba(245,158,11,0.2)]" : "bg-[rgba(255,255,255,0.1)]"
            )}
            data-html2canvas-ignore="true"
          >
            <User
              className={cn(
                "w-4 h-4",
                isActive ? "text-[#f59e0b]" : "text-[rgba(255,255,255,0.7)]"
              )}
            />
          </div>
          <span className="font-medium truncate max-w-[120px]">{name}</span>
        </div>
        <div className="font-score text-2xl font-bold tabular-nums">
          {score}
        </div>
      </div>

      {/* Shots Row */}
      <div className="flex flex-wrap gap-1">
        {groups.map((startIndex) => (
          <ShotGroup
            key={startIndex}
            shots={shots}
            startIndex={startIndex}
            currentShotIndex={currentShotIndex}
            isPlayerActive={isActive}
            onEditShot={onEditShot}
          />
        ))}
      </div>
    </motion.div>
  );
}
