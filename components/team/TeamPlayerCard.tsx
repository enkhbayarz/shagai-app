"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";

interface TeamPlayerCardProps {
  name: string;
  team: "home" | "away";
  shots: (boolean | null)[];
  isCurrentShooter?: boolean;
  currentShotIndex?: number;
  onEditShot?: (shotIndex: number) => void;
}

export function TeamPlayerCard({
  name,
  team,
  shots,
  isCurrentShooter = false,
  currentShotIndex,
  onEditShot,
}: TeamPlayerCardProps) {
  const borderColor = team === "home" ? "border-blue-500" : "border-orange-500";
  const bgColor = isCurrentShooter
    ? team === "home"
      ? "bg-blue-50"
      : "bg-orange-50"
    : "bg-white";

  // Truncate name to max 8 characters
  const displayName = name.length > 8 ? name.slice(0, 8) + "…" : name;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-lg border-2 ${borderColor} ${bgColor} p-2 w-[72px] flex-shrink-0 transition-all ${
        isCurrentShooter ? "ring-2 ring-amber-400 ring-offset-1" : ""
      }`}
    >
      {/* Player Avatar */}
      <div className="flex justify-center mb-1">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            team === "home" ? "bg-blue-100" : "bg-orange-100"
          }`}
        >
          <User
            className={`w-4 h-4 ${
              team === "home" ? "text-blue-600" : "text-orange-600"
            }`}
          />
        </div>
      </div>

      {/* Player Name */}
      <div className="text-center text-[10px] font-medium truncate mb-1 leading-tight">
        {displayName}
      </div>

      {/* Shot Indicators - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-1 justify-items-center">
        {shots.map((shot, i) => {
          const isCurrentShot = isCurrentShooter && i === currentShotIndex;
          let bgClass = "bg-gray-300"; // unshot
          let ariaLabel = `Сум ${i + 1}: хараахан харваагүй`;
          if (shot === true) {
            bgClass = "bg-emerald-500"; // hit
            ariaLabel = `Сум ${i + 1}: оносон`;
          }
          if (shot === false) {
            bgClass = "bg-red-500"; // miss
            ariaLabel = `Сум ${i + 1}: алдсан`;
          }

          return (
            <button
              key={i}
              onClick={() => shot !== null && onEditShot?.(i)}
              disabled={shot === null}
              aria-label={ariaLabel}
              className={`w-3 h-3 rounded-full transition-all ${bgClass} ${
                isCurrentShot ? "ring-2 ring-amber-400 scale-125" : ""
              } ${shot !== null ? "cursor-pointer hover:opacity-80" : ""}`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
