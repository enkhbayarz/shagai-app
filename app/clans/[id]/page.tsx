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
import { RosterTable } from "@/components/clans/RosterTable";
import { ClanMatchCard } from "@/components/clans/ClanMatchCard";
import { InviteDialog } from "@/components/clans/InviteDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const clanId = typeof rawId === "string" ? (rawId as Id<"clans">) : undefined;
  const { user: clerkUser } = useUser();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const clan = useQuery(api.clans.get, clanId ? { id: clanId } : "skip");
  const members = useQuery(api.clans.getMembers, clanId ? { clanId } : "skip");
  const memberStats = useQuery(api.clans.getMemberStats, clanId ? { clanId } : "skip");
  const clanStats = useQuery(api.clans.getClanStats, clanId ? { clanId } : "skip");
  const clanMatches = useQuery(api.clans.getClanMatches, clanId ? {
    clanId,
    limit: 10,
  } : "skip");

  const leaveClan = useMutation(api.clans.leave);
  const kickMember = useMutation(api.clans.kick);
  const deleteClan = useMutation(api.clans.deleteClan);

  // Determine user's role in this clan
  const myMembership = members?.find(
    (m) => m.userId === currentUser?._id
  );
  const isLeader = myMembership?.role === "leader";
  const isMember = !!myMembership;

  const handleLeave = async () => {
    if (!currentUser?._id || !clanId) return;
    try {
      await leaveClan({ clanId, userId: currentUser._id });
      router.push("/clans");
    } catch (error) {
      console.error("Failed to leave:", error);
    }
  };

  const handleKick = async (targetUserId: string) => {
    if (!currentUser?._id || !clanId) return;
    try {
      await kickMember({
        clanId,
        leaderId: currentUser._id,
        targetUserId: targetUserId as Id<"users">,
      });
    } catch (error) {
      console.error("Failed to kick:", error);
    }
  };

  const handleDelete = async () => {
    if (!currentUser?._id || !clanId) return;
    try {
      await deleteClan({ clanId, userId: currentUser._id });
      router.push("/clans");
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Invalid ID
  if (!clanId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-16 h-16 text-gray-300" />
        <p className="text-muted-foreground">Буруу холбоос байна</p>
        <Link href="/clans">
          <Button>Буцах</Button>
        </Link>
      </div>
    );
  }

  // Loading
  if (clan === undefined || members === undefined) {
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

  if (clan === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-16 h-16 text-gray-300" />
        <p className="text-muted-foreground">Клан олдсонгүй</p>
        <Link href="/clans">
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
        <Link href="/clans">
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
        <h1 className="font-display text-2xl tracking-wider">КЛАН</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Clan Header */}
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
                    <h2 className="text-xl font-bold">{clan.name}</h2>
                    <Badge variant="secondary">{clan.tag}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>@{clan.creatorName}</span>
                    <span>·</span>
                    <span>
                      {new Date(clan.createdAt).toLocaleDateString("mn-MN")}
                    </span>
                  </div>
                  {clan.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {clan.description}
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
                        >
                          Тийм, гарах
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmLeave(false)}
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
                        >
                          Тийм, устгах
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDelete(false)}
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
              <div className="text-xs text-muted-foreground">Гишүүд</div>
              <div className="font-score text-2xl font-bold tabular-nums">
                {clanStats?.memberCount ?? 0}
                <span className="text-sm text-muted-foreground font-normal">
                  /50
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <Target className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Дундаж оноо</div>
              <div className="font-score text-2xl font-bold tabular-nums">
                {clanStats?.avgScore ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <Swords className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Тоглоом</div>
              <div className="font-score text-2xl font-bold tabular-nums">
                {clanStats?.totalMatches ?? 0}
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
                  Гишүүд
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Бүх гишүүд болон тэдний статистик
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
                Кланы сүүлийн 10 тоглоом
              </p>
            </CardHeader>
            <CardContent>
              {!clanMatches || clanMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Кланы тоглоом олдсонгүй
                </p>
              ) : (
                <div className="space-y-2">
                  {clanMatches.map((match) => (
                    <ClanMatchCard key={match._id} match={match} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Invite Dialog */}
      {isLeader && currentUser && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          clanId={clanId}
          inviterId={currentUser._id}
          inviteCode={clan.inviteCode}
        />
      )}
    </div>
  );
}
