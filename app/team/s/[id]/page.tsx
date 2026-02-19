"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export default function TeamSharePage() {
  const params = useParams();
  const gameId = params.id as Id<"teamGames">;

  const game = useQuery(api.teamGames.getPublic, { id: gameId });

  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Ачааллаж байна...</div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Тоглолт олдсонгүй</h1>
          <p className="text-muted-foreground mb-4">
            Энэ тоглолт олдсонгүй эсвэл хараахан дуусаагүй байна.
          </p>
          <Link href="/">
            <Button>Нүүр хуудас руу</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Validate result exists
  if (!game.result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Тоглолт дуусаагүй</h1>
          <p className="text-muted-foreground mb-4">
            Энэ тоглолт дуусаагүй байна.
          </p>
          <Link href="/">
            <Button>Нүүр хуудас руу</Button>
          </Link>
        </div>
      </div>
    );
  }

  const result = game.result;
  const winnerName = result.winner === "home" ? game.homeClanName : game.awayClanName;
  const winnerTag = result.winner === "home" ? game.homeClanTag : game.awayClanTag;
  const winnerColor = result.winner === "home" ? "text-blue-500" : "text-orange-500";

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 touch-manipulation">
            <ArrowLeft className="w-4 h-4" />
            БУЦАХ
          </Button>
        </Link>
        <h1 className="font-display text-xl tracking-wider">БАГИЙН ХАРВАА</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* Winner Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-6"
        >
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              result.winner === "home" ? "bg-blue-100" : "bg-orange-100"
            }`}
          >
            <Trophy className={`w-10 h-10 ${winnerColor}`} />
          </div>
          <h2 className="text-2xl font-bold">Тоглолт дууслаа!</h2>
          <p className={`text-lg font-medium ${winnerColor} mt-1`}>
            [{winnerTag}] {winnerName} хожлоо!
          </p>
          {result.wasGoldenPoint && (
            <span className="inline-block mt-2 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">
              Дүүжингээр
            </span>
          )}
        </motion.div>

        {/* Match Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border p-6 mb-6"
        >
          {/* Teams Header */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Away Team */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 mx-auto mb-2 flex items-center justify-center">
                <span className="text-orange-600 font-bold">
                  {game.awayClanTag?.[0] ?? game.awayClanName?.[0] ?? "З"}
                </span>
              </div>
              <div className="font-medium text-sm">{game.awayClanName}</div>
              {game.awayClanTag && (
                <div className="text-xs text-muted-foreground">[{game.awayClanTag}]</div>
              )}
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <span className="text-xl font-bold text-gray-400">VS</span>
            </div>

            {/* Home Team */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 mx-auto mb-2 flex items-center justify-center">
                <span className="text-blue-600 font-bold">
                  {game.homeClanTag?.[0] ?? game.homeClanName?.[0] ?? "Э"}
                </span>
              </div>
              <div className="font-medium text-sm">{game.homeClanName}</div>
              {game.homeClanTag && (
                <div className="text-xs text-muted-foreground">[{game.homeClanTag}]</div>
              )}
            </div>
          </div>

          {/* Set Scores */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center py-2 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{result.awaySet1Score}</div>
              <div className="text-sm text-muted-foreground self-center">Эхэн өрөг</div>
              <div className="text-xl font-bold text-blue-600">{result.homeSet1Score}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center py-2 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{result.awaySet2Score}</div>
              <div className="text-sm text-muted-foreground self-center">Дунд өрөг</div>
              <div className="text-xl font-bold text-blue-600">{result.homeSet2Score}</div>
            </div>
          </div>

          {/* Pulled Points Per Set */}
          <div className="space-y-2 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm font-bold text-orange-600">+{result.awaySet1Pulled ?? 0}</div>
              <div className="text-xs text-muted-foreground self-center">Эхэн өрөг таталт</div>
              <div className="text-sm font-bold text-blue-600">+{result.homeSet1Pulled ?? 0}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm font-bold text-orange-600">+{result.awaySet2Pulled ?? 0}</div>
              <div className="text-xs text-muted-foreground self-center">Дунд өрөг таталт</div>
              <div className="text-sm font-bold text-blue-600">+{result.homeSet2Pulled ?? 0}</div>
            </div>
          </div>
        </motion.div>

        {/* Player Lists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {/* Away Players */}
          <div className="bg-orange-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-orange-700 mb-2">Баг 1</h3>
            <div className="space-y-1">
              {game.awayTeam.players
                .filter((p) => !p.isSubstitute)
                .map((p, i) => (
                  <div key={i} className="text-sm">{p.name}</div>
                ))}
              {game.awayTeam.players
                .filter((p) => p.isSubstitute)
                .map((p, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    Нөөц: {p.name}
                  </div>
                ))}
            </div>
          </div>

          {/* Home Players */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Баг 2</h3>
            <div className="space-y-1">
              {game.homeTeam.players
                .filter((p) => !p.isSubstitute)
                .map((p, i) => (
                  <div key={i} className="text-sm">{p.name}</div>
                ))}
              {game.homeTeam.players
                .filter((p) => p.isSubstitute)
                .map((p, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    Нөөц: {p.name}
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Date */}
        <div className="text-center text-xs text-muted-foreground">
          {game.finishedAt && new Date(game.finishedAt).toLocaleString("mn-MN")}
        </div>
      </div>
    </div>
  );
}
