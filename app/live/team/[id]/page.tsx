"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Radio, Eye, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { TeamScoreHeader } from "@/components/team/TeamScoreHeader";
import { PhaseSection } from "@/components/team/PhaseSection";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamSpectatorPage() {
  const params = useParams();
  const gameId = typeof params.id === "string" ? (params.id as Id<"teamGames">) : null;

  const game = useQuery(api.teamGames.getLive, gameId ? { id: gameId } : "skip");

  // Loading state
  if (game === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-32" />
          <div className="w-20" />
        </div>
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  // Invalid or missing game ID, or game not found
  if (!gameId || game === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-2">Тоглоом олдсонгүй</h1>
          <p className="text-muted-foreground">Энэ тоглоом байхгүй байна</p>
        </div>
        <Link href="/live">
          <Button variant="outline" className="gap-2">
            <Radio className="w-4 h-4" />
            Шууд тоглоомууд
          </Button>
        </Link>
      </div>
    );
  }

  const currentSet = game.sets[game.currentSet - 1];
  const isFinished = game.status === "finished";

  // Build team player arrays for PhaseSection
  const homeTeamPlayers = game.homeTeam.players;
  const awayTeamPlayers = game.awayTeam.players;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[rgba(0,0,0,0.1)]"
      >
        <Link href="/live">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 touch-manipulation"
          >
            <Radio className="w-4 h-4" />
            ШУУД
          </Button>
        </Link>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          {!isFinished ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-sm font-medium">ШУУД</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">ДУУССАН</span>
          )}
        </div>

        {/* Spectator badge */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          Үзэгч
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-4">
        {/* Score Header */}
        <TeamScoreHeader
          homeClanName={game.homeClanName}
          homeClanTag={game.homeClanTag}
          awayClanName={game.awayClanName}
          awayClanTag={game.awayClanTag}
          homeScore={currentSet.homeScore}
          awayScore={currentSet.awayScore}
          currentSet={game.currentSet as 1 | 2}
          set1Result={
            game.currentSet === 2
              ? {
                  homeScore: game.sets[0].homeScore,
                  awayScore: game.sets[0].awayScore,
                  homePulled: game.sets[0].homePulled,
                  awayPulled: game.sets[0].awayPulled,
                }
              : undefined
          }
          // No onEditTeamName - read-only mode
        />

        {/* Golden Point Indicator */}
        {game.goldenPoint?.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">АЛТАН ОНОО</span>
            </div>
          </motion.div>
        )}

        {/* Phases (read-only) */}
        <div className="space-y-3">
          {currentSet.phases
            .slice()
            .reverse()
            .map((phase, reversedIndex) => {
              const actualIndex = currentSet.phases.length - 1 - reversedIndex;
              const isActivePhase = actualIndex === game.currentPhaseIndex;

              return (
                <PhaseSection
                  key={`${game.currentSet}-${actualIndex}`}
                  phase={phase}
                  isActive={isActivePhase && !isFinished}
                  currentShooterIndex={game.currentShooterIndex}
                  currentShotIndex={game.currentShotInTurn}
                  homeTeamPlayers={homeTeamPlayers}
                  awayTeamPlayers={awayTeamPlayers}
                  // No onEditShot - read-only mode
                />
              );
            })}
        </div>
      </div>

      {/* Game finished overlay */}
      {isFinished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent"
        >
          <div className="max-w-md mx-auto">
            <Link href={`/team/s/${game._id}`}>
              <Button className="w-full" size="lg">
                Үр дүн харах
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
