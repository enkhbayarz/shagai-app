"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { getTier } from "@/lib/tiers";

interface RatingChartProps {
  data: { timestamp: number; rating: number; ratingChange: number }[];
  currentRating: number;
}

const TIER_LINES = [
  { value: 1200, label: "Харваач" },
  { value: 1400, label: "Мэргэн" },
  { value: 1600, label: "Домогт" },
  { value: 1800, label: "Их мэргэн" },
];

export function RatingChart({ data, currentRating }: RatingChartProps) {
  const tier = getTier(currentRating);

  if (data.length === 0) {
    return (
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display text-lg tracking-wider">
              Рейтингийн түүх
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            Рейтингийн түүх байхгүй
          </div>
        </CardContent>
      </Card>
    );
  }

  const ratings = data.map((d) => d.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const padding = 50;
  const yMin = Math.max(0, Math.floor((minRating - padding) / 100) * 100);
  const yMax = Math.ceil((maxRating + padding) / 100) * 100;

  const chartData = data.map((d, i) => ({
    game: i + 1,
    rating: d.rating,
    change: d.ratingChange,
    date: new Date(d.timestamp).toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-lg tracking-wider">
            Рейтингийн түүх
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="game"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof chartData)[0];
                return (
                  <div className="bg-background border rounded-lg p-2 text-xs shadow-md">
                    <div className="font-medium">{d.date}</div>
                    <div className="font-score tabular-nums">
                      Рейтинг: {d.rating}
                    </div>
                    <div
                      className={`font-score tabular-nums ${d.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {d.change >= 0 ? "+" : ""}
                      {d.change}
                    </div>
                  </div>
                );
              }}
            />
            {TIER_LINES.filter((t) => t.value >= yMin && t.value <= yMax).map(
              (t) => (
                <ReferenceLine
                  key={t.value}
                  y={t.value}
                  stroke="#52525222"
                  strokeDasharray="4 4"
                  label={{
                    value: t.label,
                    position: "right",
                    fontSize: 9,
                    fill: "#737373",
                  }}
                />
              )
            )}
            <Line
              type="monotone"
              dataKey="rating"
              stroke={tier.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: tier.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
