"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShotCircleProps {
  state: boolean | null; // true = hit, false = miss, null = not shot
  isActive?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function ShotCircle({ state, isActive, onClick, size = "md" }: ShotCircleProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
  };

  const className = cn(
    "rounded-full flex items-center justify-center font-score transition-all",
    sizeClasses[size],
    state === true && "bg-[#10b981] text-white", // Hit - emerald-500
    state === false && "bg-[#f43f5e] text-white", // Miss - rose-500
    state === null && "bg-[rgba(0,0,0,0.08)] border border-[#d4d4d8]", // Not shot - light gray
    isActive && state === null && "ring-2 ring-[#f59e0b] ring-offset-2 ring-offset-white",
    onClick && "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-black/20",
    !onClick && "cursor-default"
  );

  const content = (
    <>
      {state === true && "●"}
      {state === false && "○"}
    </>
  );

  // Use div for non-interactive, button only when clickable
  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        className={className}
        aria-label={
          state === true ? "Онсон - засах" : state === false ? "Алдсан - засах" : "Хараахан харваагүй"
        }
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={className}
      aria-label={
        state === true ? "Онсон" : state === false ? "Алдсан" : "Хараахан харваагүй"
      }
    >
      {content}
    </motion.div>
  );
}
