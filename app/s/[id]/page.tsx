"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, User, Home } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicGamePage() {
  const params = useParams();
  const gameId = params.id as Id<"games">;

  const game = useQuery(api.games.getPublic, { id: gameId });

  // Loading state
  if (game === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Ачааллаж байна…</div>
      </div>
    );
  }

  // Game not found or not finished
  if (game === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-2">Тоглоом олдсонгүй</h1>
          <p className="text-muted-foreground">
            Энэ тоглоом байхгүй эсвэл хараахан дуусаагүй байна
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Нүүр хуудас
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate scores and find winners
  const playersWithScores = game.players.map((player) => ({
    ...player,
    score: player.shots.filter((s) => s === true).length,
  }));

  const maxScore = playersWithScores.length > 0
    ? Math.max(...playersWithScores.map((p) => p.score))
    : 0;
  const winners = playersWithScores.filter((p) => p.score === maxScore);

  // Format date
  const gameDate = new Date(game.startedAt);
  const formattedDate = gameDate.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-4xl tracking-wider mb-2">ШАГАЙ ХАРВАА</h1>
        <p className="text-muted-foreground">{formattedDate}</p>
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* Trophy Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          {winners.length === 1 ? (
            <h2 className="font-display text-2xl text-amber-600">
              {winners[0].name} түрүүлсэн!
            </h2>
          ) : (
            <h2 className="font-display text-2xl text-amber-600">
              Түрүүлсэн: {winners.map((w) => w.name).join(", ")}
            </h2>
          )}
        </motion.div>

        {/* Results */}
        <div className="space-y-4">
          {playersWithScores
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={cn(
                  "rounded-xl p-4",
                  player.score === maxScore
                    ? "bg-amber-500/20 ring-2 ring-amber-500"
                    : "bg-black/5"
                )}
              >
                {/* Player Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-score text-lg font-bold w-6">
                      #{index + 1}
                    </span>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      player.score === maxScore ? "bg-amber-500/30" : "bg-black/10"
                    )}>
                      <User className={cn(
                        "w-5 h-5",
                        player.score === maxScore ? "text-amber-600" : "text-black/50"
                      )} />
                    </div>
                    <span className="font-medium">{player.name}</span>
                    {player.score === maxScore && (
                      <Trophy className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="font-score text-2xl font-bold">
                    {player.score}/20
                  </div>
                </div>

                {/* Shot History */}
                <div className="flex gap-[3px] flex-wrap">
                  {player.shots.map((shot, shotIndex) => (
                    <div
                      key={shotIndex}
                      className={cn(
                        "w-3 h-3 rounded-full",
                        shot === true && "bg-emerald-500",
                        shot === false && "bg-rose-500",
                        shot === null && "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Шагай Харваа руу очих
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
