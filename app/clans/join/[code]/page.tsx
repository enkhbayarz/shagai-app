"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Shield, Users, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function JoinClanPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user: clerkUser, isLoaded } = useUser();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  const currentUser = useQuery(
    api.users.getMe,
    clerkUser ? {} : "skip"
  );

  const clan = useQuery(api.clans.getByInviteCode, { inviteCode: code });
  const members = useQuery(
    api.clans.getMembers,
    clan?._id ? { clanId: clan._id } : "skip"
  );
  const joinByCode = useMutation(api.clans.joinByCode);

  const isAlreadyMember =
    currentUser?._id && members
      ? members.some((m) => m.userId === currentUser._id)
      : false;

  const handleJoin = async () => {
    if (!currentUser?._id || isJoining) return;
    setError("");
    setIsJoining(true);

    try {
      const clanId = await joinByCode({
        inviteCode: code,
      });
      setJoined(true);
      setTimeout(() => {
        router.push(`/clans/${clanId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Алдаа гарлаа");
      setIsJoining(false);
    }
  };

  // Loading
  if (!isLoaded || clan === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Skeleton className="w-20 h-20 rounded-2xl mx-auto" />
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-5 w-28 mx-auto" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  // Not found
  if (clan === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <Shield className="w-16 h-16 text-gray-300" />
        <p className="text-muted-foreground">
          Урилга олдсонгүй эсвэл хүчинтэй бус байна
        </p>
        <Link href="/clans">
          <Button>Кланууд руу буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <Card className="glass">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-gray-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">{clan.name}</h1>
              <Badge variant="secondary" className="mt-2">
                {clan.tag}
              </Badge>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {clan.memberCount}/50 гишүүн
              </span>
            </div>

            {isAlreadyMember ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Та аль хэдийн энэ кланд нэгдсэн байна
                </p>
                <Link href={`/clans/${clan._id}`}>
                  <Button className="w-full h-12 bg-black text-white hover:bg-black/90 touch-manipulation">
                    Клан руу очих
                  </Button>
                </Link>
              </div>
            ) : clan.memberCount >= 50 ? (
              <p className="text-sm text-red-500">Клан дүүрсэн байна</p>
            ) : !clerkUser ? (
              <SignInButton mode="modal">
                <Button className="w-full h-12 bg-black text-white hover:bg-black/90 touch-manipulation">
                  Нэвтэрч нэгдэх
                </Button>
              </SignInButton>
            ) : joined ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Нэгдлээ!</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleJoin}
                  disabled={isJoining || !currentUser}
                  className="w-full h-12 bg-black text-white hover:bg-black/90 touch-manipulation"
                >
                  {isJoining ? "Нэгдэж байна..." : "НЭГДЭХ"}
                </Button>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
