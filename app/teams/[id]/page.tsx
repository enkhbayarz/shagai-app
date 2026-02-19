"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Users,
  Target,
  Swords,
  UserPlus,
  LogOut,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RosterTable } from "@/components/teams/RosterTable";
import { TeamMatchCard } from "@/components/teams/TeamMatchCard";
import { InviteDialog } from "@/components/teams/InviteDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const teamId = typeof rawId === "string" ? (rawId as Id<"clans">) : undefined;
  const { user: clerkUser } = useUser();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  const currentUser = useQuery(
    api.users.getMe,
    clerkUser ? {} : "skip"
  );

  const team = useQuery(api.teams.get, teamId ? { id: teamId } : "skip");
  const members = useQuery(api.teams.getMembers, teamId ? { teamId } : "skip");
  const memberStats = useQuery(api.teams.getMemberStats, teamId ? { teamId } : "skip");
  const teamStats = useQuery(api.teams.getTeamStats, teamId ? { teamId } : "skip");
  const teamMatches = useQuery(api.teams.getTeamMatches, teamId ? {
    teamId,
    limit: 10,
  } : "skip");

  const leaveTeam = useMutation(api.teams.leave);
  const kickMember = useMutation(api.teams.kick);
  const deleteTeam = useMutation(api.teams.deleteTeam);

  // Determine user's role in this team
  const myMembership = members?.find(
    (m) => m.userId === currentUser?._id
  );
  const isLeader = myMembership?.role === "leader";
  const isMember = !!myMembership;

  const handleLeave = async () => {
    if (!currentUser?._id || !teamId || isLeaving) return;
    setActionError("");
    setIsLeaving(true);
    try {
      await leaveTeam({ teamId });
      router.push("/teams");
    } catch (error: any) {
      console.error("Failed to leave:", error);
      setActionError(error.message || "Багаас гарахад алдаа гарлаа");
      setIsLeaving(false);
      setConfirmLeave(false);
    }
  };

  const handleKick = async (targetUserId: string) => {
    if (!currentUser?._id || !teamId || kickingUserId) return;
    setActionError("");
    setKickingUserId(targetUserId);
    try {
      await kickMember({
        teamId,
        targetUserId: targetUserId as Id<"users">,
      });
    } catch (error: any) {
      console.error("Failed to kick:", error);
      setActionError(error.message || "Гишүүнийг хасахад алдаа гарлаа");
    } finally {
      setKickingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!currentUser?._id || !teamId || isDeleting) return;
    setActionError("");
    setIsDeleting(true);
    try {
      await deleteTeam({ teamId });
      router.push("/teams");
    } catch (error: any) {
      console.error("Failed to delete:", error);
      setActionError(error.message || "Багийг устгахад алдаа гарлаа");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Invalid ID
  if (!teamId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-16 h-16 text-gray-300" />
        <p className="text-muted-foreground">Буруу холбоос байна</p>
        <Link href="/teams">
          <Button>Буцах</Button>
        </Link>
      </div>
    );
  }

  // Loading
  if (team === undefined || members === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="w-20" />
        </div>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (team === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-16 h-16 text-gray-300" />
        <p className="text-muted-foreground">Баг олдсонгүй</p>
        <Link href="/teams">
          <Button>Буцах</Button>
        </Link>
      </div>
    );
  }

  // Build roster with stats
  const roster = members.map((m) => {
    const stats = memberStats?.[m.userId] ?? {
      totalGames: 0,
      totalHits: 0,
      avgScore: 0,
    };
    return {
      _id: m._id,
      userId: m.userId,
      fullName: m.fullName,
      username: m.username,
      role: m.role,
      joinedAt: m.joinedAt,
      ...stats,
    };
  });

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <Link href="/teams">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 touch-manipulation"
            aria-label="Буцах"
          >
            <ArrowLeft className="w-4 h-4" />
            БУЦАХ
          </Button>
        </Link>
        <h1 className="font-display text-2xl tracking-wider">БАГ</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Team Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{team.name}</h2>
                    <Badge variant="secondary">{team.tag}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>@{team.creatorName}</span>
                    <span>·</span>
                    <span>
                      {new Date(team.createdAt).toLocaleDateString("mn-MN")}
                    </span>
                  </div>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {isLeader && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInviteDialogOpen(true)}
                    className="gap-1.5 touch-manipulation"
                  >
                    <UserPlus className="w-4 h-4" />
                    Урих
                  </Button>
                )}
                {isMember && !isLeader && (
                  <>
                    {confirmLeave ? (
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleLeave}
                          disabled={isLeaving}
                        >
                          {isLeaving ? "Гарч байна..." : "Тийм, гарах"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmLeave(false)}
                          disabled={isLeaving}
                        >
                          Болих
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmLeave(true)}
                        className="gap-1.5 text-red-600 hover:bg-red-50 touch-manipulation"
                      >
                        <LogOut className="w-4 h-4" />
                        Гарах
                      </Button>
                    )}
                  </>
                )}
                {isLeader && (
                  <>
                    {confirmDelete ? (
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Устгаж байна..." : "Тийм, устгах"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeleting}
                        >
                          Болих
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        className="gap-1.5 text-red-600 hover:bg-red-50 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                        Устгах
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Error display */}
              {actionError && (
                <p className="text-sm text-red-500 mt-3">{actionError}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <Users className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Харваачид</div>
              <div className="font-score text-2xl font-bold tabular-nums">
                {teamStats?.memberCount ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <Target className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Дундаж оноо</div>
              <div className="font-score text-2xl font-bold tabular-nums">
                {teamStats?.avgScore ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <Swords className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Тоглоом</div>
              <div className="font-score text-2xl font-bold tabular-nums">
                {teamStats?.totalMatches ?? 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Roster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-display text-lg tracking-wider">
                  Харваачид
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Бүх харваачид болон тэдний статистик
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <RosterTable
                members={roster}
                isLeader={isLeader}
                currentUserId={currentUser?._id}
                onKick={handleKick}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-display text-lg tracking-wider">
                  Сүүлийн тоглоомууд
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Багийн сүүлийн 10 тоглоом
              </p>
            </CardHeader>
            <CardContent>
              {!teamMatches || teamMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Багийн тоглоом олдсонгүй
                </p>
              ) : (
                <div className="space-y-2">
                  {teamMatches.map((match) => (
                    <TeamMatchCard key={match._id} match={match} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Invite Dialog */}
      {isLeader && currentUser && team.inviteCode && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          teamId={teamId}
          inviteCode={team.inviteCode}
        />
      )}
    </div>
  );
}
