"use client";

import { motion } from "framer-motion";
import { User, Edit2 } from "lucide-react";
import { type TeamColor, getTeamColors } from "@/lib/team-colors";

interface TeamPlayerCardProps {
  name: string;
  team: "home" | "away";
  playerIndex: number;
  shots: (boolean | null | "skip")[];
  isCurrentShooter?: boolean;
  currentShotIndex?: number;
  onEditShot?: (shotIndex: number) => void;
  onEditName?: (team: "home" | "away", playerIndex: number) => void;
  displayColor?: TeamColor;
  compact?: boolean;
}

export function TeamPlayerCard({
  name,
  team,
  playerIndex,
  shots,
  isCurrentShooter = false,
  currentShotIndex,
  onEditShot,
  onEditName,
  displayColor,
  compact = false,
}: TeamPlayerCardProps) {
  const effectiveColor = displayColor ?? (team === "home" ? "blue" : "orange");
  const c = getTeamColors(effectiveColor, "orange");

  // Truncate name to max 8 characters
  const displayName = name.length > 8 ? name.slice(0, 8) + "…" : name;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-lg ${compact ? "border p-1 w-full min-w-0" : "border-2 p-2 w-[90px] flex-shrink-0"} ${c.border500} ${isCurrentShooter ? c.bg50 : "bg-white"} transition-all ${
        isCurrentShooter ? "ring-2 ring-amber-400 ring-offset-1" : ""
      }`}
    >
      {/* Player Avatar & Name - Tappable for editing */}
      <button
        onClick={() => onEditName?.(team, playerIndex)}
        disabled={!onEditName}
        className={`w-full ${onEditName ? "cursor-pointer hover:opacity-80" : ""}`}
      >
        <div className="flex justify-center mb-1 relative">
          <div
            className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full flex items-center justify-center ${c.bg100}`}
          >
            <User className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${c.text600}`} />
          </div>
          {onEditName && (
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-200 rounded-full flex items-center justify-center">
              <Edit2 className="w-2 h-2 text-gray-500" />
            </div>
          )}
        </div>

        {/* Player Name */}
        <div className={`${compact ? "text-[8px]" : "text-[10px]"} text-center font-medium truncate mb-1 leading-tight`}>
          {displayName}
        </div>
      </button>

      {/* Shot Indicators - 2-Column Grid */}
      <div className={`grid grid-cols-2 ${compact ? "gap-0.5" : "gap-1"} justify-items-center`}>
        {shots.map((shot, i) => {
          const isCurrentShot = isCurrentShooter && i === currentShotIndex;
          let bgClass = "bg-gray-300"; // unshot
          let ariaLabel = `Сум ${i + 1}: хараахан харваагүй`;
          if (shot === true) {
            bgClass = "bg-emerald-500"; // hit
            ariaLabel = `Сум ${i + 1}: оносон`;
          } else if (shot === false) {
            bgClass = "bg-red-500"; // miss
            ariaLabel = `Сум ${i + 1}: алдсан`;
          } else if (shot === "skip") {
            bgClass = "bg-gray-400"; // skipped
            ariaLabel = `Сум ${i + 1}: алгассан`;
          }

          const isEditable = shot !== null && shot !== "skip";

          return (
            <button
              key={i}
              onClick={() => isEditable && onEditShot?.(i)}
              disabled={!isEditable}
              aria-label={ariaLabel}
              className={`${compact ? "w-3 h-3" : "w-4 h-4"} rounded-full transition-all ${bgClass} ${
                isCurrentShot ? "ring-2 ring-amber-400 scale-125" : ""
              } ${isEditable ? "cursor-pointer hover:opacity-80" : ""}`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
