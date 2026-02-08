"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { AccuracyBreakdown } from "@/components/profile/AccuracyBreakdown";
import { HeadToHead } from "@/components/profile/HeadToHead";
import { RatingChart } from "@/components/profile/RatingChart";
import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { RecentGamesList } from "@/components/profile/RecentGamesList";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: clerkUser } = useUser();

  const profile = useQuery(api.profiles.getProfile, { username });

  const currentUser = useQuery(
    api.users.getMe,
    clerkUser ? {} : "skip"
  );
  const currentUserId = currentUser?._id as Id<"users"> | undefined;

  const userId = profile?.user?._id as Id<"users"> | undefined;

  const ratingHistory = useQuery(
    api.profiles.getRatingHistory,
    userId ? { userId } : "skip"
  );

  const recentGames = useQuery(
    api.profiles.getRecentGames,
    userId ? { userId } : "skip"
  );

  const accuracyData = useQuery(
    api.profiles.getAccuracyBreakdown,
    userId ? { userId } : "skip"
  );

  // Loading
  if (profile === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="w-20" />
        </div>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  // Not found
  if (profile === null) {
    return (
      <div className="min-h-screen px-4 py-6">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4" />
              БУЦАХ
            </Button>
          </Link>
          <h1 className="font-display text-2xl tracking-wider">ПРОФАЙЛ</h1>
          <div className="w-20" />
        </motion.header>
        <div className="max-w-lg mx-auto text-center py-12">
          <UserX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Тоглогч олдсонгүй</p>
          <p className="text-sm text-muted-foreground mt-1">
            @{username} нэртэй тоглогч бүртгэлгүй байна
          </p>
        </div>
      </div>
    );
  }

  const { user, stats, achievements } = profile;
  const currentRating = stats?.rating ?? 1500;

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            БУЦАХ
          </Button>
        </Link>
        <h1 className="font-display text-2xl tracking-wider">ПРОФАЙЛ</h1>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Profile header */}
        <ProfileHeader
          fullName={user.fullName}
          username={user.username}
          rating={currentRating}
          createdAt={user.createdAt}
        />

        {/* Stats grid */}
        {stats ? (
          <StatsGrid
            totalGames={stats.totalGames}
            totalWins={stats.totalWins}
            avgAccuracy={stats.avgAccuracy}
            rating={stats.rating}
            currentStreak={stats.currentStreak}
            bestStreak={stats.bestStreak}
            last10Results={stats.last10Results}
          />
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Тоглоом тоглоогүй байна
          </div>
        )}

        {/* Accuracy breakdown */}
        {accuracyData === undefined ? (
          <Card className="glass">
            <CardContent className="p-4">
              <div className="h-32 animate-pulse bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ) : (
          <AccuracyBreakdown quarters={accuracyData} />
        )}

        {/* Head-to-head */}
        {userId && (
          <HeadToHead userId={userId} currentUserId={currentUserId} />
        )}

        {/* Rating chart */}
        <RatingChart
          data={ratingHistory ?? []}
          currentRating={currentRating}
        />

        {/* Achievements */}
        <AchievementGrid unlocked={achievements} />

        {/* Recent games */}
        <RecentGamesList games={recentGames ?? []} />
      </div>
    </div>
  );
}
