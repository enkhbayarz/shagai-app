"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Quarter {
  label: string;
  accuracy: number;
  hits: number;
  total: number;
}

interface AccuracyBreakdownProps {
  quarters: Quarter[];
}

export function AccuracyBreakdown({ quarters }: AccuracyBreakdownProps) {
  const hasData = quarters.some((q) => q.total > 0);

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="font-display text-xl tracking-wider">
            Харвааны задаргаа
          </h2>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Өгөгдөл хангалтгүй
          </div>
        ) : (
          <div className="space-y-3">
            {quarters.map((q, index) => {
              const pct = Math.round(q.accuracy * 100);
              return (
                <motion.div
                  key={q.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-xs font-medium text-muted-foreground">
                      {q.label}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.6,
                          delay: 0.2 + index * 0.08,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${0.3 + q.accuracy * 0.7})`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right font-score text-sm font-bold tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="ml-13 text-[10px] text-muted-foreground">
                    {q.hits}/{q.total} оноо
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
