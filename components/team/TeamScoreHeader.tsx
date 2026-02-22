"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type TeamColor, getTeamColors } from "@/lib/team-colors";

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
  homePulled?: number;
  awayPulled?: number;
  currentSet: 1 | 2;
  set1Result?: SetResult;
  onEditTeamName?: (team: "home" | "away", name: string) => void;
  awayColor?: TeamColor;
  homeColor?: TeamColor;
}

export function TeamScoreHeader({
  homeClanName,
  homeClanTag,
  awayClanName,
  awayClanTag,
  homeScore,
  awayScore,
  homePulled,
  awayPulled,
  currentSet,
  set1Result,
  onEditTeamName,
  awayColor,
  homeColor,
}: TeamScoreHeaderProps) {
  const [editingTeam, setEditingTeam] = useState<"home" | "away" | null>(null);
  const [editValue, setEditValue] = useState("");

  const ac = getTeamColors(awayColor, "orange");
  const hc = getTeamColors(homeColor, "blue");

  // Determine which team data goes on which side based on set
  // Left side uses away color, right side uses home color
  // Only team names/data swap between sets
  const leftTeam = currentSet === 1 ? "away" : "home";
  const rightTeam = currentSet === 1 ? "home" : "away";

  const leftName = leftTeam === "home" ? homeClanName : awayClanName;
  const leftScore = leftTeam === "home" ? homeScore : awayScore;
  const leftPulled = leftTeam === "home" ? (homePulled ?? 0) : (awayPulled ?? 0);
  const leftColors = leftTeam === "home" ? hc : ac;

  const rightName = rightTeam === "home" ? homeClanName : awayClanName;
  const rightScore = rightTeam === "home" ? homeScore : awayScore;
  const rightPulled = rightTeam === "home" ? (homePulled ?? 0) : (awayPulled ?? 0);
  const rightColors = rightTeam === "home" ? hc : ac;

  const handleStartEdit = (team: "home" | "away") => {
    if (!onEditTeamName) return;
    setEditingTeam(team);
    setEditValue(team === "home" ? homeClanName : awayClanName);
  };

  const handleSaveEdit = () => {
    if (editingTeam && onEditTeamName && editValue.trim()) {
      onEditTeamName(editingTeam, editValue.trim());
    }
    setEditingTeam(null);
  };
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-xl p-4">
      {/* Set 1 Result (if in Set 2) */}
      {currentSet === 2 && set1Result && (
        <div className="flex justify-center items-center gap-4 mb-2 text-xs text-gray-400">
          <span>Эхэн өрөг:</span>
          <span className={hc.text400}>
            {set1Result.homePulled && set1Result.homePulled > 0
              ? <>15 <span className={hc.text300}>(+{set1Result.homePulled})</span></>
              : set1Result.homeScore}
          </span>
          <span>-</span>
          <span className={ac.text400}>
            {set1Result.awayPulled && set1Result.awayPulled > 0
              ? <>15 <span className={ac.text300}>(+{set1Result.awayPulled})</span></>
              : set1Result.awayScore}
          </span>
        </div>
      )}

      {/* Current Set Label */}
      <div className="text-center mb-2">
        <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
          {currentSet === 1 ? "Эхэн өрөг" : "Дунд өрөг"}
        </span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-center justify-between">
        {/* Left Team */}
        <div className="flex-1 text-center">
          {editingTeam === leftTeam ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="h-7 text-sm font-medium text-center w-24 mx-auto bg-white/10 border-white/20 text-white"
              autoFocus
            />
          ) : (
            <button
              onClick={() => handleStartEdit(leftTeam)}
              className={`font-display text-xl flex items-center justify-center gap-1 ${leftColors.hoverText300} transition-colors mx-auto`}
            >
              {leftName}
              {onEditTeamName && <Edit2 className="w-3 h-3 opacity-50" />}
            </button>
          )}
          <motion.div
            key={`left-${leftScore}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold ${leftColors.text400} mt-2`}
          >
            {leftScore - leftPulled}
            {leftPulled > 0 && (
              <span className="text-lg font-normal ml-0.5">(+{leftPulled})</span>
            )}
            <span className="text-lg text-gray-500">/15</span>
          </motion.div>
        </div>

        {/* VS Divider */}
        <div className="px-4">
          <div className="text-2xl font-bold text-gray-600">VS</div>
        </div>

        {/* Right Team */}
        <div className="flex-1 text-center">
          {editingTeam === rightTeam ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="h-7 text-sm font-medium text-center w-24 mx-auto bg-white/10 border-white/20 text-white"
              autoFocus
            />
          ) : (
            <button
              onClick={() => handleStartEdit(rightTeam)}
              className={`font-display text-xl flex items-center justify-center gap-1 ${rightColors.hoverText300} transition-colors mx-auto`}
            >
              {rightName}
              {onEditTeamName && <Edit2 className="w-3 h-3 opacity-50" />}
            </button>
          )}
          <motion.div
            key={`right-${rightScore}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold ${rightColors.text400} mt-2`}
          >
            {rightScore - rightPulled}
            {rightPulled > 0 && (
              <span className="text-lg font-normal ml-0.5">(+{rightPulled})</span>
            )}
            <span className="text-lg text-gray-500">/15</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
