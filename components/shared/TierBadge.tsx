"use client";

import { getTier } from "@/lib/tiers";

interface TierBadgeProps {
  rating: number;
  size?: "sm" | "md";
}

export function TierBadge({ rating, size = "sm" }: TierBadgeProps) {
  const tier = getTier(rating);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{
        color: tier.color,
        borderColor: `${tier.color}44`,
        backgroundColor: `${tier.color}15`,
      }}
    >
      {tier.name}
    </span>
  );
}
