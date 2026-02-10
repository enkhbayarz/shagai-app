"use client";

import { motion } from "framer-motion";

interface SetResult {
  homeScore: number;
  awayScore: number;
  homePulled?: number;
  awayPulled?: number;
}

interface TeamScoreHeaderProps {
  homeClanName: string;
  homeClanTag: string;
  awayClanName: string;
  awayClanTag: string;
  homeScore: number;
  awayScore: number;
  currentSet: 1 | 2;
  set1Result?: SetResult;
}

export function TeamScoreHeader({
  homeClanName,
  homeClanTag,
  awayClanName,
  awayClanTag,
  homeScore,
  awayScore,
  currentSet,
  set1Result,
}: TeamScoreHeaderProps) {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-xl p-4">
      {/* Set 1 Result (if in Set 2) */}
      {currentSet === 2 && set1Result && (
        <div className="flex justify-center items-center gap-4 mb-2 text-xs text-gray-400">
          <span>1-р өрөг:</span>
          <span className="text-orange-400">{set1Result.awayScore}</span>
          <span>-</span>
          <span className="text-blue-400">{set1Result.homeScore}</span>
          {(set1Result.homePulled !== undefined && set1Result.homePulled > 0) && (
            <span className="text-blue-300">(+{set1Result.homePulled})</span>
          )}
          {(set1Result.awayPulled !== undefined && set1Result.awayPulled > 0) && (
            <span className="text-orange-300">(+{set1Result.awayPulled})</span>
          )}
        </div>
      )}

      {/* Current Set Label */}
      <div className="text-center mb-2">
        <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
          {currentSet}-р өрөг
        </span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-center justify-between">
        {/* Away Team (Left) */}
        <div className="flex-1 text-center">
          <div className="text-orange-400 text-xs font-medium mb-1">Зочин</div>
          <div className="font-display text-xl">{awayClanName}</div>
          <div className="text-xs text-gray-400">[{awayClanTag}]</div>
          <motion.div
            key={awayScore}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-orange-400 mt-2"
          >
            {awayScore}
            <span className="text-lg text-gray-500">/15</span>
          </motion.div>
        </div>

        {/* VS Divider */}
        <div className="px-4">
          <div className="text-2xl font-bold text-gray-600">VS</div>
        </div>

        {/* Home Team (Right) */}
        <div className="flex-1 text-center">
          <div className="text-blue-400 text-xs font-medium mb-1">Эзэн</div>
          <div className="font-display text-xl">{homeClanName}</div>
          <div className="text-xs text-gray-400">[{homeClanTag}]</div>
          <motion.div
            key={homeScore}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-blue-400 mt-2"
          >
            {homeScore}
            <span className="text-lg text-gray-500">/15</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
