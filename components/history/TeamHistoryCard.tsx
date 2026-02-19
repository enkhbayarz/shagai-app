"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Calendar, Users, Link2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";

interface TeamGameResult {
  winner: "home" | "away";
  homeSet1Score: number;
  awaySet1Score: number;
  homeSet2Score: number;
  awaySet2Score: number;
  homeTotalPulled: number;
  awayTotalPulled: number;
  wasGoldenPoint: boolean;
}

interface TeamGameSummary {
  _id: Id<"teamGames">;
  startedAt: number;
  finishedAt?: number;
  status: "in_progress" | "finished";
  playersPerTeam: number;
  homeClanName: string;
  homeClanTag: string;
  awayClanName: string;
  awayClanTag: string;
  result?: TeamGameResult;
}

interface TeamHistoryCardProps {
  game: TeamGameSummary;
  index: number;
}

export function TeamHistoryCard({ game, index }: TeamHistoryCardProps) {
  const [copiedId, setCopiedId] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/team/s/${game._id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isFinished = game.status === "finished";
  const gameDate = new Date(game.startedAt);

  // Determine winner info
  const winnerName = game.result?.winner === "home" ? game.homeClanName : game.awayClanName;
  const winnerTag = game.result?.winner === "home" ? game.homeClanTag : game.awayClanTag;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass overflow-hidden">
        {/* Gradient header bar */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-blue-500" />

        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                {gameDate.toLocaleDateString("mn-MN")}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {game.playersPerTeam}v{game.playersPerTeam}
              </div>
            </div>
            {isFinished ? (
              <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                Дууссан
              </span>
            ) : (
              <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                Явагдаж байгаа
              </span>
            )}
          </div>

          {/* Team matchup */}
          <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-lg p-2">
            {/* Home team */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 text-xs font-bold">
                  {game.homeClanTag?.[0] || game.homeClanName[0]}
                </span>
              </div>
              <span className="text-sm font-medium truncate max-w-[70px]">
                {game.homeClanName}
              </span>
            </div>

            {/* Score or VS */}
            <div className="px-2 text-center">
              {isFinished && game.result ? (
                <div className="flex items-center gap-1 text-sm font-bold">
                  <span className="text-orange-600">
                    {game.result.homeSet1Score + game.result.homeSet2Score}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className="text-blue-600">
                    {game.result.awaySet1Score + game.result.awaySet2Score}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-medium">VS</span>
              )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-medium truncate max-w-[70px]">
                {game.awayClanName}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">
                  {game.awayClanTag?.[0] || game.awayClanName[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Winner */}
          {isFinished && game.result && (
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Trophy className="w-4 h-4" />
              <span className="font-medium text-sm">
                {winnerTag ? `[${winnerTag}] ` : ""}{winnerName} хожлоо
                {game.result.wasGoldenPoint && " (Алтан оноо)"}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isFinished ? (
              <>
                <Link href={`/team/s/${game._id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Харах
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className="gap-1"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3" />
                      Хуулсан
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      Холбоос
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Link href={`/team/game/${game._id}`} className="flex-1">
                <Button size="sm" className="w-full">
                  Үргэлжлүүлэх
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
