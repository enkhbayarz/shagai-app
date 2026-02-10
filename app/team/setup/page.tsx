"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Play, Check, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SelectedPlayer {
  userId: Id<"users">;
  name: string;
  isSubstitute: boolean;
}

type Step = "clan" | "count" | "homePlayers" | "awayPlayers" | "confirm";

export default function TeamSetupPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("clan");

  // Selection state
  const [selectedAwayClanId, setSelectedAwayClanId] = useState<Id<"clans"> | null>(null);
  const [playersPerTeam, setPlayersPerTeam] = useState<4 | 5 | 6>(4);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<SelectedPlayer[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<SelectedPlayer[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Convex queries
  const currentUser = useQuery(api.users.getMe, clerkUser ? {} : "skip");
  const myClans = useQuery(api.clans.myClans, clerkUser ? {} : "skip");
  const allClans = useQuery(api.clans.list, { limit: 50 });
  const createUser = useMutation(api.users.createOrGetUser);
  const createTeamGame = useMutation(api.teamGames.create);
  const addTestPlayers = useMutation(api.clans.addTestPlayers);

  // State for adding test players
  const [isAddingTestPlayers, setIsAddingTestPlayers] = useState(false);

  // Add test players to a clan
  const handleAddTestPlayers = async (clanId: Id<"clans">) => {
    setIsAddingTestPlayers(true);
    try {
      await addTestPlayers({ clanId, count: 5 });
    } catch (error) {
      console.error("Failed to add test players:", error);
    } finally {
      setIsAddingTestPlayers(false);
    }
  };

  // Get the user's first clan as home clan
  const homeClan = myClans?.[0];
  const homeClanId = homeClan?._id;

  // Get members of home clan
  const homeClanMembers = useQuery(
    api.clans.getMembers,
    homeClanId ? { clanId: homeClanId } : "skip"
  );

  // Get members of selected away clan
  const awayClanMembers = useQuery(
    api.clans.getMembers,
    selectedAwayClanId ? { clanId: selectedAwayClanId } : "skip"
  );

  // Filter out home clan from available opponent clans
  const opponentClans = useMemo(() => {
    if (!allClans || !homeClanId) return [];
    return allClans.filter((clan) => clan._id !== homeClanId);
  }, [allClans, homeClanId]);

  // Create user in Convex if doesn't exist
  useEffect(() => {
    if (clerkUser && currentUser === null) {
      createUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        fullName: clerkUser.fullName || clerkUser.firstName || "User",
        username: clerkUser.username || `user_${clerkUser.id.slice(-6)}`,
      });
    }
  }, [clerkUser, currentUser, createUser]);

  // Handle player selection for home team
  const handleToggleHomePlayer = (member: { userId: Id<"users">; fullName: string }) => {
    const existing = homeTeamPlayers.find((p) => p.userId === member.userId);
    if (existing) {
      setHomeTeamPlayers(homeTeamPlayers.filter((p) => p.userId !== member.userId));
    } else {
      // Check if we can add more players
      const regularCount = homeTeamPlayers.filter((p) => !p.isSubstitute).length;
      const subCount = homeTeamPlayers.filter((p) => p.isSubstitute).length;

      if (regularCount < playersPerTeam) {
        setHomeTeamPlayers([
          ...homeTeamPlayers,
          { userId: member.userId, name: member.fullName, isSubstitute: false },
        ]);
      } else if (subCount < 1) {
        setHomeTeamPlayers([
          ...homeTeamPlayers,
          { userId: member.userId, name: member.fullName, isSubstitute: true },
        ]);
      }
    }
  };

  // Handle player selection for away team
  const handleToggleAwayPlayer = (member: { userId: Id<"users">; fullName: string }) => {
    const existing = awayTeamPlayers.find((p) => p.userId === member.userId);
    if (existing) {
      setAwayTeamPlayers(awayTeamPlayers.filter((p) => p.userId !== member.userId));
    } else {
      const regularCount = awayTeamPlayers.filter((p) => !p.isSubstitute).length;
      const subCount = awayTeamPlayers.filter((p) => p.isSubstitute).length;

      if (regularCount < playersPerTeam) {
        setAwayTeamPlayers([
          ...awayTeamPlayers,
          { userId: member.userId, name: member.fullName, isSubstitute: false },
        ]);
      } else if (subCount < 1) {
        setAwayTeamPlayers([
          ...awayTeamPlayers,
          { userId: member.userId, name: member.fullName, isSubstitute: true },
        ]);
      }
    }
  };

  // Reset players when count changes
  useEffect(() => {
    setHomeTeamPlayers([]);
    setAwayTeamPlayers([]);
  }, [playersPerTeam]);

  // Navigation
  const goToNextStep = () => {
    if (currentStep === "clan") setCurrentStep("count");
    else if (currentStep === "count") setCurrentStep("homePlayers");
    else if (currentStep === "homePlayers") setCurrentStep("awayPlayers");
    else if (currentStep === "awayPlayers") setCurrentStep("confirm");
  };

  const goToPrevStep = () => {
    if (currentStep === "count") setCurrentStep("clan");
    else if (currentStep === "homePlayers") setCurrentStep("count");
    else if (currentStep === "awayPlayers") setCurrentStep("homePlayers");
    else if (currentStep === "confirm") setCurrentStep("awayPlayers");
  };

  // Validation
  const homeRegularCount = homeTeamPlayers.filter((p) => !p.isSubstitute).length;
  const awayRegularCount = awayTeamPlayers.filter((p) => !p.isSubstitute).length;

  const canProceedFromClan = selectedAwayClanId !== null;
  const canProceedFromCount = true;
  const canProceedFromHomePlayers = homeRegularCount === playersPerTeam;
  const canProceedFromAwayPlayers = awayRegularCount === playersPerTeam;

  // Start game
  const handleStart = async () => {
    if (isCreating || !homeClanId || !selectedAwayClanId) return;
    setIsCreating(true);

    try {
      const gameId = await createTeamGame({
        homeClanId,
        awayClanId: selectedAwayClanId,
        playersPerTeam,
        homeTeamPlayers: homeTeamPlayers.map((p) => ({
          userId: p.userId,
          isSubstitute: p.isSubstitute,
        })),
        awayTeamPlayers: awayTeamPlayers.map((p) => ({
          userId: p.userId,
          isSubstitute: p.isSubstitute,
        })),
      });

      router.push(`/team/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create team game:", error);
      setIsCreating(false);
    }
  };

  // Check if user has a clan
  if (myClans && myClans.length === 0) {
    return (
      <div className="min-h-screen px-4 py-6">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl tracking-wider text-center">БАГИЙН ХАРВАА</h1>
        </motion.header>

        <div className="max-w-md mx-auto">
          <Card className="glass">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-medium mb-2">Клан байхгүй</h2>
              <p className="text-muted-foreground mb-4">
                Багийн харваанд оролцохын тулд эхлээд клан үүсгэх эсвэл клан руу нэгдэх шаардлагатай.
              </p>
              <Link href="/clans">
                <Button className="w-full">Клан руу очих</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedAwayClan = allClans?.find((c) => c._id === selectedAwayClanId);

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-2xl tracking-wider text-center">БАГИЙН ХАРВАА</h1>
      </motion.header>

      {/* Progress indicator */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-center gap-2">
          {["clan", "count", "homePlayers", "awayPlayers", "confirm"].map((step, i) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentStep === step
                  ? "bg-black"
                  : i < ["clan", "count", "homePlayers", "awayPlayers", "confirm"].indexOf(currentStep)
                  ? "bg-emerald-500"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Step 1: Select Opponent Clan */}
        {currentStep === "clan" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    Э
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Эзэн баг</div>
                    <div className="font-medium">{homeClan?.name ?? "..."}</div>
                  </div>
                </div>

                <h2 className="text-lg font-medium mb-4">Өрсөлдөгч баг сонгох</h2>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {opponentClans.map((clan) => (
                    <button
                      key={clan._id}
                      onClick={() => setSelectedAwayClanId(clan._id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedAwayClanId === clan._id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                            {clan.tag?.[0] ?? "?"}
                          </div>
                          <div>
                            <div className="font-medium">{clan.name}</div>
                            <div className="text-xs text-muted-foreground">
                              [{clan.tag}] • {clan.memberCount} гишүүн
                            </div>
                          </div>
                        </div>
                        {selectedAwayClanId === clan._id && (
                          <Check className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {opponentClans.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Өрсөлдөх клан олдсонгүй
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={goToNextStep}
              disabled={!canProceedFromClan}
              className="w-full mt-4 h-12 gap-2"
            >
              Үргэлжлүүлэх
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Select Player Count */}
        {currentStep === "count" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass">
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium mb-4">Тоглогчдын тоо</h2>
                <div className="grid grid-cols-3 gap-3">
                  {([4, 5, 6] as const).map((num) => (
                    <Button
                      key={num}
                      variant={playersPerTeam === num ? "default" : "outline"}
                      className={`h-16 text-2xl font-bold touch-manipulation transition-all ${
                        playersPerTeam === num
                          ? "bg-black text-white ring-2 ring-amber-500"
                          : "border-black/20 hover:bg-black/5"
                      }`}
                      onClick={() => setPlayersPerTeam(num)}
                    >
                      {num}v{num}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Баг бүр {playersPerTeam} тоглогч + 1 нөөц тоглогч (заавал биш)
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={goToPrevStep} className="h-12">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={!canProceedFromCount}
                className="flex-1 h-12 gap-2"
              >
                Үргэлжлүүлэх
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Home Team Players */}
        {currentStep === "homePlayers" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    Э
                  </div>
                  <div>
                    <div className="font-medium">{homeClan?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {homeRegularCount}/{playersPerTeam} тоглогч сонгосон
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {homeClanMembers?.map((member) => {
                    const selected = homeTeamPlayers.find((p) => p.userId === member.userId);
                    const regularCount = homeTeamPlayers.filter((p) => !p.isSubstitute).length;
                    const subCount = homeTeamPlayers.filter((p) => p.isSubstitute).length;
                    const canSelect =
                      selected || regularCount < playersPerTeam || subCount < 1;

                    return (
                      <button
                        key={member._id}
                        onClick={() => handleToggleHomePlayer(member)}
                        disabled={!canSelect}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selected
                            ? selected.isSubstitute
                              ? "border-amber-500 bg-amber-50"
                              : "border-blue-500 bg-blue-50"
                            : canSelect
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-100 bg-gray-50 opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              @{member.username}
                            </div>
                          </div>
                          {selected && (
                            <div
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                selected.isSubstitute
                                  ? "bg-amber-200 text-amber-700"
                                  : "bg-blue-200 text-blue-700"
                              }`}
                            >
                              {selected.isSubstitute ? "Нөөц" : "Тоглогч"}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Add test players button - only show if not enough members */}
                {homeClanMembers && homeClanMembers.length < playersPerTeam && homeClanId && (
                  <Button
                    onClick={() => handleAddTestPlayers(homeClanId)}
                    disabled={isAddingTestPlayers}
                    variant="outline"
                    className="w-full mt-3 gap-2 border-dashed"
                  >
                    <Plus className="w-4 h-4" />
                    {isAddingTestPlayers ? "Нэмж байна..." : "Тест тоглогч нэмэх (5)"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={goToPrevStep} className="h-12">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={!canProceedFromHomePlayers}
                className="flex-1 h-12 gap-2"
              >
                Үргэлжлүүлэх
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Select Away Team Players */}
        {currentStep === "awayPlayers" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                    З
                  </div>
                  <div>
                    <div className="font-medium">{selectedAwayClan?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {awayRegularCount}/{playersPerTeam} тоглогч сонгосон
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {awayClanMembers?.map((member) => {
                    const selected = awayTeamPlayers.find((p) => p.userId === member.userId);
                    const regularCount = awayTeamPlayers.filter((p) => !p.isSubstitute).length;
                    const subCount = awayTeamPlayers.filter((p) => p.isSubstitute).length;
                    const canSelect =
                      selected || regularCount < playersPerTeam || subCount < 1;

                    return (
                      <button
                        key={member._id}
                        onClick={() => handleToggleAwayPlayer(member)}
                        disabled={!canSelect}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selected
                            ? selected.isSubstitute
                              ? "border-amber-500 bg-amber-50"
                              : "border-orange-500 bg-orange-50"
                            : canSelect
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-100 bg-gray-50 opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              @{member.username}
                            </div>
                          </div>
                          {selected && (
                            <div
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                selected.isSubstitute
                                  ? "bg-amber-200 text-amber-700"
                                  : "bg-orange-200 text-orange-700"
                              }`}
                            >
                              {selected.isSubstitute ? "Нөөц" : "Тоглогч"}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Add test players button - only show if not enough members */}
                {awayClanMembers && awayClanMembers.length < playersPerTeam && selectedAwayClanId && (
                  <Button
                    onClick={() => handleAddTestPlayers(selectedAwayClanId)}
                    disabled={isAddingTestPlayers}
                    variant="outline"
                    className="w-full mt-3 gap-2 border-dashed"
                  >
                    <Plus className="w-4 h-4" />
                    {isAddingTestPlayers ? "Нэмж байна..." : "Тест тоглогч нэмэх (5)"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={goToPrevStep} className="h-12">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={!canProceedFromAwayPlayers}
                className="flex-1 h-12 gap-2"
              >
                Үргэлжлүүлэх
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Confirm */}
        {currentStep === "confirm" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass">
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium mb-4 text-center">Тоглолтын мэдээлэл</h2>

                <div className="grid grid-cols-2 gap-4">
                  {/* Home Team */}
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      Э
                    </div>
                    <div className="font-medium text-sm">{homeClan?.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">[{homeClan?.tag}]</div>
                    <div className="space-y-1">
                      {homeTeamPlayers
                        .filter((p) => !p.isSubstitute)
                        .map((p, i) => (
                          <div key={p.userId} className="text-xs bg-blue-50 rounded px-2 py-1">
                            {i + 1}. {p.name}
                          </div>
                        ))}
                      {homeTeamPlayers
                        .filter((p) => p.isSubstitute)
                        .map((p) => (
                          <div key={p.userId} className="text-xs bg-amber-50 rounded px-2 py-1">
                            Нөөц: {p.name}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      З
                    </div>
                    <div className="font-medium text-sm">{selectedAwayClan?.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">
                      [{selectedAwayClan?.tag}]
                    </div>
                    <div className="space-y-1">
                      {awayTeamPlayers
                        .filter((p) => !p.isSubstitute)
                        .map((p, i) => (
                          <div key={p.userId} className="text-xs bg-orange-50 rounded px-2 py-1">
                            {i + 1}. {p.name}
                          </div>
                        ))}
                      {awayTeamPlayers
                        .filter((p) => p.isSubstitute)
                        .map((p) => (
                          <div key={p.userId} className="text-xs bg-amber-50 rounded px-2 py-1">
                            Нөөц: {p.name}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-center">
                  <div className="text-2xl font-bold">{playersPerTeam}v{playersPerTeam}</div>
                  <div className="text-xs text-muted-foreground">2 өрөг • 15 оноо</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={goToPrevStep} className="h-12">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleStart}
                disabled={isCreating}
                className="flex-1 h-14 text-lg font-bold gap-2 bg-black text-white hover:bg-black/90 touch-manipulation"
              >
                {isCreating ? (
                  "Үүсгэж байна..."
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    ЭХЛЭХ
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
