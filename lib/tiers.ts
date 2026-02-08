export const TIERS = [
  { code: "apprentice", name: "Сурагч", minRating: 0, maxRating: 1199, color: "#a3a3a3" },
  { code: "archer", name: "Харваач", minRating: 1200, maxRating: 1399, color: "#10b981" },
  { code: "marksman", name: "Мэргэн", minRating: 1400, maxRating: 1599, color: "#3b82f6" },
  { code: "legendary", name: "Домогт мэргэн", minRating: 1600, maxRating: 1799, color: "#f59e0b" },
  { code: "grandmaster", name: "Их мэргэн", minRating: 1800, maxRating: Infinity, color: "#ef4444" },
] as const;

export type TierCode = (typeof TIERS)[number]["code"];

export type Tier = {
  code: TierCode;
  name: string;
  minRating: number;
  maxRating: number;
  color: string;
};

export function getTier(rating: number): Tier {
  return (TIERS.find((t) => rating >= t.minRating && rating <= t.maxRating) ??
    TIERS[0]) as Tier;
}
