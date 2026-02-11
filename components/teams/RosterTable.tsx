"use client";

import { motion } from "framer-motion";
import { User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MemberEntry {
  _id: string;
  userId: string;
  fullName: string;
  username: string;
  role: "leader" | "member";
  joinedAt: number;
  totalGames: number;
  totalHits: number;
  avgScore: number;
}

interface RosterTableProps {
  members: MemberEntry[];
  isLeader: boolean;
  currentUserId?: string;
  onKick?: (userId: string) => void;
}

export function RosterTable({
  members,
  isLeader,
  currentUserId,
  onKick,
}: RosterTableProps) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center px-3 py-2 text-xs text-muted-foreground border-b">
        <span className="flex-1">Тоглогч</span>
        <span className="w-14 text-center">Үүрэг</span>
        <span className="w-14 text-right">Тоглоом</span>
        <span className="w-14 text-right">Нийт</span>
        <span className="w-14 text-right">Дундаж</span>
        <span className="w-20 text-right">Нэгдсэн</span>
        {isLeader && <span className="w-8" />}
      </div>

      {members.map((member, index) => (
        <motion.div
          key={member.userId}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          className={`flex items-center px-3 py-2.5 rounded-lg ${
            member.role === "leader" ? "bg-amber-50/50" : "hover:bg-gray-50"
          }`}
        >
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                member.role === "leader" ? "bg-amber-100" : "bg-gray-100"
              }`}
            >
              <User
                className={`w-3.5 h-3.5 ${
                  member.role === "leader" ? "text-amber-600" : "text-gray-400"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {member.fullName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                @{member.username}
              </div>
            </div>
          </div>

          <span className="w-14 text-center">
            <Badge
              variant={member.role === "leader" ? "default" : "secondary"}
              className={`text-[10px] px-1.5 ${
                member.role === "leader"
                  ? "bg-amber-500 text-white hover:bg-amber-500"
                  : ""
              }`}
            >
              {member.role === "leader" ? "Ахлагч" : "Харваач"}
            </Badge>
          </span>

          <span className="w-14 text-right font-score text-sm tabular-nums text-muted-foreground">
            {member.totalGames}
          </span>
          <span className="w-14 text-right font-score text-sm font-bold tabular-nums">
            {member.totalHits}
          </span>
          <span className="w-14 text-right font-score text-sm tabular-nums text-muted-foreground">
            {member.avgScore}
          </span>
          <span className="w-20 text-right text-xs text-muted-foreground">
            {member.joinedAt > 0
              ? new Date(member.joinedAt).toLocaleDateString("mn-MN")
              : "—"}
          </span>

          {isLeader && currentUserId && member.userId !== currentUserId && onKick ? (
            <span className="w-8 flex justify-end">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onKick(member.userId)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                aria-label={`${member.fullName}-г хасах`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </span>
          ) : isLeader ? (
            <span className="w-8" />
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
