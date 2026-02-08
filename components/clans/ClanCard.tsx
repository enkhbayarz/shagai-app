"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";

interface ClanCardProps {
  clan: {
    _id: Id<"clans">;
    name: string;
    tag: string;
    description?: string;
    memberCount: number;
    creatorName: string;
  };
  index: number;
}

export function ClanCard({ clan, index }: ClanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{clan.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {clan.tag}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {clan.memberCount}/50
                </span>
              </div>
            </div>
          </div>

          {clan.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {clan.description}
            </p>
          )}

          <Link href={`/clans/${clan._id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full touch-manipulation"
            >
              Дэлгэрэнгүй
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
