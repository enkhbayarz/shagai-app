"use client";

import { motion } from "framer-motion";
import { TeamPlayerCard } from "./TeamPlayerCard";

interface Shooter {
  team: "home" | "away";
  playerIndex: number;
  shots: (boolean | null)[];
}

interface Phase {
  phaseNumber: number;
  phaseType: "niileg" | "shuvtraga" | "merge";
  cycle: number;
  direction: "rtl" | "ltr";
  shooters: Shooter[];
  isCompleted: boolean;
}

interface PhaseSectionProps {
  phase: Phase;
  isActive: boolean;
  currentShooterIndex: number;
  currentShotIndex: number;
  homeTeamPlayers: { name: string }[];
  awayTeamPlayers: { name: string }[];
  onEditShot?: (shooterIndex: number, shotIndex: number) => void;
  onEditPlayerName?: (team: "home" | "away", playerIndex: number) => void;
}

const phaseTypeLabels: Record<string, string> = {
  niileg: "НИЙЛЛЭГ ҮЕ",
  shuvtraga: "ШУВТРАГА ҮЕ",
  merge: "МЭРГЭ ҮЕ",
};

export function PhaseSection({
  phase,
  isActive,
  currentShooterIndex,
  currentShotIndex,
  homeTeamPlayers,
  awayTeamPlayers,
  onEditShot,
  onEditPlayerName,
}: PhaseSectionProps) {
  const bgColor = isActive ? "bg-amber-50" : "bg-gray-100";
  const borderColor = isActive ? "border-amber-300" : "border-gray-200";

  // Get player name by team and index
  const getPlayerName = (team: "home" | "away", playerIndex: number) => {
    if (team === "home") {
      return homeTeamPlayers[playerIndex]?.name ?? `Тоглогч ${playerIndex + 1}`;
    }
    return awayTeamPlayers[playerIndex]?.name ?? `Тоглогч ${playerIndex + 1}`;
  };

  // For RTL direction, reverse the display order so rightmost shooter appears on the right
  // Visual: Yellow P2 | Blue P2 | Yellow P1 | Blue P1 (left to right)
  // Shooting order (array): Home P1, Away P1, Home P2, Away P2
  const displayShooters = phase.direction === "rtl"
    ? [...phase.shooters].reverse()
    : phase.shooters;

  // Map display index back to original index for callbacks
  const getOriginalIndex = (displayIndex: number) => {
    if (phase.direction === "rtl") {
      return phase.shooters.length - 1 - displayIndex;
    }
    return displayIndex;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 ${borderColor} ${bgColor} p-4 transition-all`}
    >
      {/* Phase Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{phase.cycle}</span>
          <span className="text-sm text-muted-foreground">
            {phaseTypeLabels[phase.phaseType] || phase.phaseType}
          </span>
        </div>
        {phase.isCompleted && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
            Дууссан
          </span>
        )}
      </div>

      {/* Shooters Grid */}
      <div className="flex justify-center gap-1 overflow-x-auto pb-1">
        {displayShooters.map((shooter, displayIndex) => {
          const originalIndex = getOriginalIndex(displayIndex);
          const isCurrentShooter = isActive && originalIndex === currentShooterIndex;

          return (
            <TeamPlayerCard
              key={`${shooter.team}-${shooter.playerIndex}-${displayIndex}`}
              name={getPlayerName(shooter.team, shooter.playerIndex)}
              team={shooter.team}
              playerIndex={shooter.playerIndex}
              shots={shooter.shots}
              isCurrentShooter={isCurrentShooter}
              currentShotIndex={isCurrentShooter ? currentShotIndex : undefined}
              onEditShot={
                onEditShot ? (shotIndex) => onEditShot(originalIndex, shotIndex) : undefined
              }
              onEditName={onEditPlayerName}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
