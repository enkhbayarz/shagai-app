"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShotCircle } from "./ShotCircle";
import { cn } from "@/lib/utils";

interface ShotGroupProps {
  shots: (boolean | null)[];
  startIndex: number;
  currentShotIndex: number;
  isPlayerActive: boolean;
  onEditShot?: (index: number) => void;
}

export function ShotGroup({
  shots,
  startIndex,
  currentShotIndex,
  isPlayerActive,
  onEditShot,
}: ShotGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const groupShots = shots.slice(startIndex, startIndex + 4);

  // Check if any shot in this group has been made
  const hasShots = groupShots.some((shot) => shot !== null);

  const handleGroupClick = () => {
    if (hasShots && onEditShot) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleShotEdit = (localIndex: number) => {
    const globalIndex = startIndex + localIndex;
    if (shots[globalIndex] !== null && onEditShot) {
      onEditShot(globalIndex);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Expanded view - show individual editable shots
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.1)]"
          >
            {groupShots.map((shot, localIndex) => (
              <ShotCircle
                key={localIndex}
                state={shot}
                isActive={
                  isPlayerActive && startIndex + localIndex === currentShotIndex
                }
                onClick={
                  shot !== null ? () => handleShotEdit(localIndex) : undefined
                }
                size="sm"
              />
            ))}
            <button
              onClick={() => setIsExpanded(false)}
              className="ml-1 text-xs text-[#a3a3a3] hover:text-white"
              aria-label="Хаах"
            >
              ✕
            </button>
          </motion.div>
        ) : (
          // Collapsed view - use div, clickable via onClick
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleGroupClick}
            role={hasShots ? "button" : undefined}
            tabIndex={hasShots ? 0 : undefined}
            onKeyDown={hasShots ? (e) => e.key === "Enter" && handleGroupClick() : undefined}
            className={cn(
              "flex gap-0.5 p-1 rounded-lg transition-all",
              hasShots && "hover:bg-[rgba(255,255,255,0.05)] cursor-pointer",
              !hasShots && "cursor-default"
            )}
            aria-label={hasShots ? "Засварлахын тулд дарна уу" : undefined}
          >
            {groupShots.map((shot, localIndex) => (
              <ShotCircle
                key={localIndex}
                state={shot}
                isActive={
                  isPlayerActive && startIndex + localIndex === currentShotIndex
                }
                size="sm"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
