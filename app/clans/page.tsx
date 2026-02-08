"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Check, X, Plus } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClanCard } from "@/components/clans/ClanCard";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "browse" | "my" | "create";

export default function ClansPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [clanName, setClanName] = useState("");
  const [clanTag, setClanTag] = useState("");
  const [clanDescription, setClanDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const currentUser = useQuery(
    api.users.getMe,
    clerkUser ? {} : "skip"
  );

  const allClans = useQuery(api.clans.list, { limit: 50 });

  const myClans = useQuery(
    api.clans.myClans,
    currentUser ? {} : "skip"
  );

  const myInvites = useQuery(
    api.clans.myInvites,
    currentUser ? {} : "skip"
  );

  const createClan = useMutation(api.clans.create);
  const acceptInvite = useMutation(api.clans.acceptInvite);
  const declineInvite = useMutation(api.clans.declineInvite);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/");
    }
  }, [isLoaded, clerkUser, router]);

  const handleCreate = async () => {
    if (!currentUser?._id || isCreating) return;
    setCreateError("");

    const trimmedName = clanName.trim();
    const trimmedTag = clanTag.trim();
    if (!trimmedName) {
      setCreateError("Нэр оруулна уу");
      return;
    }
    if (trimmedTag.length < 2 || trimmedTag.length > 6) {
      setCreateError("Tag 2-6 тэмдэгт байх ёстой");
      return;
    }

    setIsCreating(true);
    try {
      const clanId = await createClan({
        name: trimmedName,
        tag: trimmedTag,
        description: clanDescription.trim() || undefined,
      });
      router.push(`/clans/${clanId}`);
    } catch (error: any) {
      setCreateError(error.message || "Алдаа гарлаа");
      setIsCreating(false);
    }
  };

  const handleAcceptInvite = async (inviteId: any) => {
    if (!currentUser?._id) return;
    try {
      await acceptInvite({ inviteId });
    } catch (error) {
      console.error("Failed to accept invite:", error);
    }
  };

  const handleDeclineInvite = async (inviteId: any) => {
    if (!currentUser?._id) return;
    try {
      await declineInvite({ inviteId });
    } catch (error) {
      console.error("Failed to decline invite:", error);
    }
  };

  // Loading state
  if (!isLoaded || allClans === undefined) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="w-20" />
        </div>
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-md" />
            ))}
          </div>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "browse", label: "Кланууд" },
    { key: "my", label: "Миний клан" },
    { key: "create", label: "Клан үүсгэх" },
  ];

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <Link href="/">
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
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h1 className="font-display text-2xl tracking-wider">КЛАН</h1>
        </div>
        <div className="w-20" />
      </motion.header>

      <div className="max-w-md mx-auto">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 touch-manipulation"
            >
              {tab.label}
            </Button>
          ))}
        </motion.div>

        {/* Browse Tab */}
        {activeTab === "browse" && (
          <div className="space-y-4">
            {allClans.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Одоогоор клан байхгүй байна
                </p>
              </motion.div>
            ) : (
              allClans.map((clan, index) => (
                <ClanCard key={clan._id} clan={clan} index={index} />
              ))
            )}
          </div>
        )}

        {/* My Clans Tab */}
        {activeTab === "my" && (
          <div className="space-y-6">
            {/* Pending Invites */}
            {myInvites && myInvites.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Урилгууд
                </h3>
                {myInvites.map((invite) => (
                  <motion.div
                    key={invite._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="glass">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {invite.clanName}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {invite.clanTag}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {invite.inviterName} урьсан
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleAcceptInvite(invite._id)}
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleDeclineInvite(invite._id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* My Clans List */}
            <div className="space-y-4">
              {!myClans || myClans.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Та ямар нэг кланд нэгдээгүй байна
                  </p>
                  <Button onClick={() => setActiveTab("browse")}>
                    Клан хайх
                  </Button>
                </motion.div>
              ) : (
                myClans.map((clan, index) =>
                  clan ? (
                    <ClanCard
                      key={clan._id}
                      clan={{
                        ...clan,
                        creatorName: "",
                      }}
                      index={index}
                    />
                  ) : null
                )
              )}
            </div>
          </div>
        )}

        {/* Create Tab */}
        {activeTab === "create" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Кланы нэр</label>
                  <Input
                    placeholder="Жишээ: The InfinityX"
                    value={clanName}
                    onChange={(e) => setClanName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tag (2-6 тэмдэгт)
                  </label>
                  <Input
                    placeholder="Жишээ: INFYx"
                    value={clanTag}
                    onChange={(e) => setClanTag(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Тайлбар (заавал биш)
                  </label>
                  <Input
                    placeholder="Кланы тухай товч..."
                    value={clanDescription}
                    onChange={(e) => setClanDescription(e.target.value)}
                    maxLength={200}
                  />
                </div>

                {createError && (
                  <p className="text-sm text-red-500">{createError}</p>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !clanName.trim() || clanTag.length < 2}
                  className="w-full h-12 gap-2 bg-black text-white hover:bg-black/90 touch-manipulation"
                >
                  {isCreating ? (
                    "Үүсгэж байна..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      КЛАН ҮҮСГЭХ
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
