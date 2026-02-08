"use client";

import { motion } from "framer-motion";
import { TierBadge } from "@/components/shared/TierBadge";

interface ProfileHeaderProps {
  fullName: string;
  username: string;
  rating: number;
  createdAt: number;
}

export function ProfileHeader({
  fullName,
  username,
  rating,
  createdAt,
}: ProfileHeaderProps) {
  const initials =
    fullName
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const joinDate = new Date(createdAt).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span className="font-display text-xl text-amber-700">{initials}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold truncate">{fullName}</h2>
          <TierBadge rating={rating} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">@{username}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Нэгдсэн: {joinDate}
        </p>
      </div>
    </motion.div>
  );
}
