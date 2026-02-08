"use client";

import Link from "next/link";
import { Trophy, Calendar } from "lucide-react";

interface ClanMatchProps {
  match: {
    _id: string;
    startedAt: number;
    finishedAt?: number;
    playerCount: number;
    players: {
      name: string;
      userId?: string;
      score: number;
    }[];
  };
}

export function ClanMatchCard({ match }: ClanMatchProps) {
  if (match.players.length === 0) return null;

  const maxScore = Math.max(...match.players.map((p) => p.score));
  const winners = match.players.filter((p) => p.score === maxScore);
  const date = new Date(match.startedAt);

  return (
    <Link href={`/s/${match._id}`} className="block">
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100 hover:bg-gray-100/80 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-sm">
              {winners.length === 1
                ? winners[0].name
                : winners.map((w) => w.name).join(", ")}
            </span>
          </div>
          <span className="font-score text-sm font-bold tabular-nums">
            {maxScore}/20
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {date.toLocaleDateString("mn-MN")}
        </div>
      </div>
    </Link>
  );
}
