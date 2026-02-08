"use client";

import { motion } from "framer-motion";
import {
  Footprints,
  Trophy,
  Star,
  Target,
  Flame,
  Zap,
  Swords,
  Gem,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { LucideIcon } from "lucide-react";

interface AchievementGridProps {
  unlocked: { code: string; unlockedAt: number }[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints,
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  zap: Zap,
  swords: Swords,
  gem: Gem,
};

export function AchievementGrid({ unlocked }: AchievementGridProps) {
  const unlockedSet = new Set(unlocked.map((a) => a.code));
  const unlockedMap = new Map(unlocked.map((a) => [a.code, a.unlockedAt]));

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-display text-lg tracking-wider">Амжилтууд</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map((achievement, index) => {
            const isUnlocked = unlockedSet.has(achievement.code);
            const Icon = ICON_MAP[achievement.icon] ?? Star;
            const unlockedAt = unlockedMap.get(achievement.code);

            return (
              <motion.div
                key={achievement.code}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex flex-col items-center text-center p-2 rounded-lg ${
                  isUnlocked ? "bg-amber-50" : "opacity-30"
                }`}
                title={`${achievement.name}: ${achievement.description}`}
              >
                <Icon
                  className={`w-6 h-6 mb-1 ${
                    isUnlocked ? "text-amber-500" : "text-muted-foreground"
                  }`}
                />
                <span className="text-[10px] font-medium leading-tight">
                  {achievement.name}
                </span>
                {isUnlocked && unlockedAt && (
                  <span className="text-[8px] text-muted-foreground mt-0.5">
                    {new Date(unlockedAt).toLocaleDateString("mn-MN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
