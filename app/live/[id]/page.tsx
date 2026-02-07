"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Radio, Eye } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { PlayerRow } from "@/components/series/PlayerRow";

export default function SpectatorPage() {
  const params = useParams();
  const gameId = typeof params.id === "string" ? (params.id as Id<"games">) : null;

  const game = useQuery(api.games.getLive, gameId ? { id: gameId } : "skip");

  // Loading state
  if (game === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Ачааллаж байна...</div>
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

  const currentShotIndex = game.currentRound - 1;

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
          {!game.isFinished ? (
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

      {/* Round indicator */}
      {!game.isFinished && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-2 text-center text-sm text-muted-foreground"
        >
          Раунд {game.currentRound}/20
        </motion.div>
      )}

      {/* Player Rows - Read-only (no onEditShot) */}
      <div className="px-4 py-4 space-y-3">
        {game.players.map((player, playerIndex) => {
          const score = player.shots.filter((s) => s === true).length;
          const isActive =
            playerIndex === game.currentPlayerIndex && !game.isFinished;

          return (
            <PlayerRow
              key={playerIndex}
              name={player.name}
              shots={player.shots}
              score={score}
              isActive={isActive}
              currentShotIndex={currentShotIndex}
              // No onEditShot - read-only mode
            />
          );
        })}
      </div>

      {/* Game finished overlay */}
      {game.isFinished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent"
        >
          <div className="max-w-md mx-auto">
            <Link href={`/s/${game._id}`}>
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
