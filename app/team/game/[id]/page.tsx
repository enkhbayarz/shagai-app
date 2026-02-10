"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  TeamScoreHeader,
  PhaseSection,
  TeamGameControls,
  TeamFinishedModal,
} from "@/components/team";

export default function TeamGamePage() {
  const params = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Validate route param before casting
  const rawId = params.id;
  if (!rawId || typeof rawId !== "string") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Буруу холбоос</div>
      </div>
    );
  }

  const gameId = rawId as Id<"teamGames">;

  // Fetch game data
  const game = useQuery(api.teamGames.get, { id: gameId });
  const recordShot = useMutation(api.teamGames.recordShot);
  const editShot = useMutation(api.teamGames.editShot);

  // Auto-scroll to active phase
  useEffect(() => {
    if (scrollRef.current && game) {
      const activePhase = scrollRef.current.querySelector("[data-active='true']");
      if (activePhase) {
        activePhase.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [game?.currentPhaseIndex]);

  // Distinguish loading from not found
  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Ачааллаж байна...</div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Тоглолт олдсонгүй</h1>
          <Link href="/">
            <Button>Нүүр хуудас</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentSet = game.sets[game.currentSet - 1];
  const currentPhase = currentSet?.phases[game.currentPhaseIndex];
  const currentShooter = currentPhase?.shooters[game.currentShooterIndex];

  // Get current shooter's name
  const getCurrentShooterName = () => {
    if (!currentShooter) return "";
    if (currentShooter.team === "home") {
      return game.homeTeam.players[currentShooter.playerIndex]?.name ?? "Тоглогч";
    }
    return game.awayTeam.players[currentShooter.playerIndex]?.name ?? "Тоглогч";
  };

  // Handle shot recording with loading state to prevent duplicate calls
  const handleRecordShot = async (isHit: boolean) => {
    if (isRecording) return; // Prevent double-click
    setIsRecording(true);
    try {
      await recordShot({ gameId, isHit });
    } catch (error) {
      console.error("Failed to record shot:", error);
    } finally {
      setIsRecording(false);
    }
  };

  // Handle shot editing
  const handleEditShot = async (
    setIndex: number,
    phaseIndex: number,
    shooterIndex: number,
    shotIndex: number
  ) => {
    try {
      await editShot({ gameId, setIndex, phaseIndex, shooterIndex, shotIndex });
    } catch (error) {
      console.error("Failed to edit shot:", error);
    }
  };

  const isFinished = game.status === "finished";
  const isGoldenPoint = game.goldenPoint?.isActive;

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 touch-manipulation">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-display text-lg tracking-wider">БАГИЙН ХАРВАА</h1>
          <div className="w-10" />
        </div>
      </motion.header>

      {/* Score Header */}
      <div className="px-4 py-4">
        <TeamScoreHeader
          homeClanName={game.homeClanName}
          homeClanTag={game.homeClanTag}
          awayClanName={game.awayClanName}
          awayClanTag={game.awayClanTag}
          homeScore={currentSet?.homeScore ?? 0}
          awayScore={currentSet?.awayScore ?? 0}
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
        />
      </div>

      {/* Golden Point Banner */}
      {isGoldenPoint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 text-center"
        >
          <div className="text-lg font-bold">АЛТАН ОНОО</div>
          <div className="text-sm opacity-90">Эхнийх оногдуулж, дараагийнх алдвал ялна!</div>
        </motion.div>
      )}

      {/* Phases List */}
      <div ref={scrollRef} className="px-4 space-y-4">
        {currentSet?.phases.map((phase, phaseIndex) => {
          const isActive = phaseIndex === game.currentPhaseIndex && !isFinished && !isGoldenPoint;

          return (
            <div key={phaseIndex} data-active={isActive}>
              <PhaseSection
                phase={phase as any}
                isActive={isActive}
                currentShooterIndex={isActive ? game.currentShooterIndex : -1}
                currentShotIndex={isActive ? game.currentShotInTurn : -1}
                homeTeamPlayers={game.homeTeam.players}
                awayTeamPlayers={game.awayTeam.players}
                onEditShot={
                  !isFinished
                    ? (shooterIndex, shotIndex) =>
                        handleEditShot(game.currentSet - 1, phaseIndex, shooterIndex, shotIndex)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      {/* Golden Point Turns Display */}
      {isGoldenPoint && game.goldenPoint && (
        <div className="px-4 mt-4">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
            <h3 className="font-bold text-center mb-3">Алтан оноо</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {game.goldenPoint.turns.map((turn, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    turn.shot === true
                      ? "bg-emerald-500"
                      : turn.shot === false
                      ? "bg-red-500"
                      : "bg-gray-300"
                  }`}
                >
                  {turn.shot === true ? "O" : turn.shot === false ? "X" : "?"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Controls */}
      {!isFinished && currentShooter && (
        <TeamGameControls
          currentShooterName={getCurrentShooterName()}
          currentTeam={currentShooter.team}
          shotNumber={game.currentShotInTurn + 1}
          onHit={() => handleRecordShot(true)}
          onMiss={() => handleRecordShot(false)}
          disabled={isRecording}
        />
      )}

      {/* Finished Modal */}
      {isFinished && game.result && (
        <TeamFinishedModal
          open={isFinished}
          homeClanName={game.homeClanName}
          homeClanTag={game.homeClanTag}
          awayClanName={game.awayClanName}
          awayClanTag={game.awayClanTag}
          result={game.result}
          gameId={gameId}
        />
      )}
    </div>
  );
}
