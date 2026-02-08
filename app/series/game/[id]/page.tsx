"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { PlayerRow } from "@/components/series/PlayerRow";
import { GameControls } from "@/components/series/GameControls";
import { FinishedModal } from "@/components/series/FinishedModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as Id<"games">;

  const [showFinished, setShowFinished] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Convex queries and mutations
  const game = useQuery(api.games.get, { id: gameId });
  const recordShotMutation = useMutation(api.games.recordShot);
  const editShotMutation = useMutation(api.games.editShot);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show finished modal when game is complete
  useEffect(() => {
    if (game?.isFinished) {
      setShowFinished(true);
    }
  }, [game?.isFinished]);

  // Record a shot
  const recordShot = async (isHit: boolean) => {
    if (!game || game.isFinished) return;
    await recordShotMutation({ gameId, isHit });
  };

  // Edit a past shot (toggle hit/miss)
  const editShot = async (playerIndex: number, shotIndex: number) => {
    if (!game) return;
    await editShotMutation({ gameId, playerIndex, shotIndex });
  };

  // Go home
  const goHome = () => {
    router.push("/");
  };

  // Loading state
  if (game === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="max-w-md mx-auto space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  // Game not found
  if (game === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-muted-foreground">Тоглоом олдсонгүй</div>
        <Link href="/">
          <Button variant="outline">Нүүр хуудас руу буцах</Button>
        </Link>
      </div>
    );
  }

  const currentShotIndex = game.currentRound - 1;
  const displayShot = Math.min(game.currentRound, 20);

  return (
    <>
      <div className="min-h-screen pb-32">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[rgba(0,0,0,0.1)]"
        >
          <div className="font-score text-sm text-[#737373] tabular-nums">
            {currentTime.toLocaleDateString("mn-MN")}{" "}
            {currentTime.toLocaleTimeString("mn-MN")}
          </div>
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[#737373] hover:text-black touch-manipulation"
              aria-label="Буцах"
            >
              <ArrowLeft className="w-4 h-4" />
              БУЦАХ
            </Button>
          </Link>
        </motion.header>

        {/* Player Rows */}
        <div className="px-4 py-4 space-y-3">
          {game.players.map((player, playerIndex) => {
            const score = player.shots.filter((s) => s === true).length;
            const isActive = playerIndex === game.currentPlayerIndex;

            return (
              <PlayerRow
                key={playerIndex}
                name={player.name}
                shots={player.shots}
                score={score}
                isActive={isActive && !game.isFinished}
                currentShotIndex={currentShotIndex}
                onEditShot={(shotIndex) => editShot(playerIndex, shotIndex)}
              />
            );
          })}
        </div>
      </div>

      {/* Game Controls */}
      {!game.isFinished && (
        <GameControls
          currentShot={displayShot}
          totalShots={20}
          onHit={() => recordShot(true)}
          onMiss={() => recordShot(false)}
        />
      )}

      {/* Finished Modal */}
      <FinishedModal
        open={showFinished}
        players={game.players}
        gameId={gameId}
        onGoHome={goHome}
      />
    </>
  );
}
