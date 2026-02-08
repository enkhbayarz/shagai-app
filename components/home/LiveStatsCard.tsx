"use client";

import { Calendar, Radio, Clock, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LiveStatsData {
  todaysMatches: number;
  weeksMatches: number;
  activeGames: number;
  avgDurationMinutes: number | null;
}

interface LiveStatsCardProps {
  stats: LiveStatsData | undefined;
}

export function LiveStatsCard({ stats }: LiveStatsCardProps) {
  const items = [
    {
      icon: Calendar,
      label: "Өнөөдөр",
      sublabel: "Тоглоом",
      value: stats?.todaysMatches ?? 0,
      color: "text-orange-500",
    },
    {
      icon: CalendarDays,
      label: "Энэ 7 хоног",
      sublabel: "Тоглоом",
      value: stats?.weeksMatches ?? 0,
      color: "text-blue-500",
    },
    {
      icon: Radio,
      label: "Идэвхтэй",
      sublabel: "Тоглоом",
      value: stats?.activeGames ?? 0,
      color: "text-emerald-500",
      pulse: true,
    },
    {
      icon: Clock,
      label: "Дундаж",
      sublabel: "Хугацаа",
      value: stats?.avgDurationMinutes != null ? `${stats.avgDurationMinutes} мин` : "—",
      color: "text-amber-600",
    },
  ];

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-500" />
          <h2 className="font-display text-xl tracking-wider">Статистик</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <item.icon
                className={`w-5 h-5 ${item.color} ${item.pulse ? "animate-pulse" : ""}`}
              />
              <div>
                <div className="text-xs text-muted-foreground">
                  {item.label}
                </div>
                <div className="text-sm font-medium">{item.sublabel}</div>
              </div>
            </div>
            <span className="font-score text-xl font-bold tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
