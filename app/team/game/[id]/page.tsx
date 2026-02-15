"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, X, Search, User } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TeamScoreHeader,
  PhaseSection,
  TeamGameControls,
  TeamFinishedModal,
} from "@/components/team";

export default function TeamGamePage() {
  const params = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<{
    team: "home" | "away";
    playerIndex: number;
    currentName: string;
  } | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>(undefined);

  // Validate route param before casting
  const rawId = params.id;
  if (!rawId || typeof rawId !== "string") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Буруу холбоос</div>
      </div>
    );
  }

  const gameId = rawId as Id<"teamGames">;

  // Fetch game data
  const game = useQuery(api.teamGames.get, { id: gameId });
  const recordShot = useMutation(api.teamGames.recordShot);
  const editShot = useMutation(api.teamGames.editShot);
  const updateTeamName = useMutation(api.teamGames.updateTeamName);
  const updatePlayerName = useMutation(api.teamGames.updatePlayerName);

  // Search users for player name editing
  const searchResults = useQuery(
    api.users.search,
    editPlayerName.length >= 2 && editingPlayer ? { query: editPlayerName } : "skip"
  );

  // Auto-scroll to active phase
  useEffect(() => {
    if (scrollRef.current && game) {
      const activePhase = scrollRef.current.querySelector("[data-active='true']");
      if (activePhase) {
        activePhase.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [game?.currentPhaseIndex]);

  // Auto-skip for 6v6 first round: if second shooter's teammate already shot, auto-skip
  // ONLY applies to: niileg phase, first cycle (both Set 1 and Set 2)
  useEffect(() => {
    if (!game || game.status === "finished" || isRecording) return;
    if (game.playersPerTeam !== 6) return;

    const currentSetData = game.sets[game.currentSet - 1];
    const currentPhaseData = currentSetData?.phases[game.currentPhaseIndex];
    if (!currentPhaseData) return;

    // Only for niileg phase (НИЙЛЭГ ҮЕ)
    if (currentPhaseData.phaseType !== "niileg") return;

    // Only in first cycle, first round
    if (currentPhaseData.cycle !== 1 || game.currentShotInTurn !== 0) return;

    // Only for shooters 2 and 3 (second shooter from each team)
    if (game.currentShooterIndex < 2) return;

    const shooters = currentPhaseData.shooters;
    const currentShooterData = shooters[game.currentShooterIndex];
    if (!currentShooterData) return;

    // Find teammate (first shooter from same team)
    // If current is index 2 (home second), check index 0 (home first)
    // If current is index 3 (away second), check index 1 (away first)
    const teammateIndex = currentShooterData.team === shooters[0]?.team ? 0 : 1;
    const teammateShot = shooters[teammateIndex]?.shots[0];

    // If teammate shot (hit or miss, not skip), auto-skip this one
    if (teammateShot === true || teammateShot === false) {
      // Auto-skip: trigger skip without user interaction
      recordShot({ gameId, isSkip: true }).catch(console.error);
    }
  }, [game?.currentShooterIndex, game?.currentPhaseIndex, game?.currentShotInTurn, game?.currentSet, gameId, isRecording]);

  // Distinguish loading from not found
  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Ачааллаж байна...</div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Тоглолт олдсонгүй</h1>
          <Link href="/">
            <Button>Нүүр хуудас</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentSet = game.sets[game.currentSet - 1];
  const currentPhase = currentSet?.phases[game.currentPhaseIndex];
  const currentShooter = currentPhase?.shooters[game.currentShooterIndex];

  // Get current shooter's name
  const getCurrentShooterName = () => {
    if (!currentShooter) return "";
    if (currentShooter.team === "home") {
      return game.homeTeam.players[currentShooter.playerIndex]?.name ?? "Тоглогч";
    }
    return game.awayTeam.players[currentShooter.playerIndex]?.name ?? "Тоглогч";
  };

  // Handle shot recording with loading state to prevent duplicate calls
  const handleRecordShot = async (isHit: boolean) => {
    if (isRecording) return; // Prevent double-click
    setIsRecording(true);
    try {
      await recordShot({ gameId, isHit });
    } catch (error) {
      console.error("Failed to record shot:", error);
    } finally {
      setIsRecording(false);
    }
  };

  // Handle skip for 6v6 first round
  const handleRecordSkip = async () => {
    if (isRecording) return;
    setIsRecording(true);
    try {
      await recordShot({ gameId, isSkip: true });
    } catch (error) {
      console.error("Failed to record skip:", error);
    } finally {
      setIsRecording(false);
    }
  };

  // Determine if skip button should be shown (6v6, first cycle of niileg only)
  const shouldShowSkipButton = () => {
    if (!currentPhase || !currentShooter) return false;
    // Only for 6v6 games
    if (game.playersPerTeam !== 6) return false;
    // Only for niileg phase (НИЙЛЭГ ҮЕ)
    if (currentPhase.phaseType !== "niileg") return false;
    // Only for first round (shot index 0)
    if (game.currentShotInTurn !== 0) return false;
    // Only for first cycle
    if (currentPhase.cycle !== 1) return false;
    // Only for first shooter of each team (indices 0 and 1 in the shooter array)
    // Shooter 0: Home first, Shooter 1: Away first
    // Shooter 2: Home second, Shooter 3: Away second
    if (game.currentShooterIndex >= 2) return false;
    return true;
  };

  // Handle shot editing
  const handleEditShot = async (
    setIndex: number,
    phaseIndex: number,
    shooterIndex: number,
    shotIndex: number
  ) => {
    try {
      await editShot({ gameId, setIndex, phaseIndex, shooterIndex, shotIndex });
    } catch (error) {
      console.error("Failed to edit shot:", error);
    }
  };

  // Handle team name editing
  const handleEditTeamName = async (team: "home" | "away", name: string) => {
    try {
      await updateTeamName({ gameId, team, name });
    } catch (error) {
      console.error("Failed to update team name:", error);
    }
  };

  // Handle player name editing - open modal
  const handleOpenEditPlayerName = (team: "home" | "away", playerIndex: number) => {
    const players = team === "home" ? game.homeTeam.players : game.awayTeam.players;
    const currentName = players[playerIndex]?.name ?? `Тоглогч ${playerIndex + 1}`;
    setEditingPlayer({ team, playerIndex, currentName });
    setEditPlayerName(currentName);
    setSelectedUserId(undefined);
  };

  // Handle selecting a user from search results
  const handleSelectUser = (userId: Id<"users">, fullName: string) => {
    setEditPlayerName(fullName);
    setSelectedUserId(userId);
  };

  // Handle player name save
  const handleSavePlayerName = async () => {
    if (!editingPlayer || !editPlayerName.trim()) return;
    try {
      await updatePlayerName({
        gameId,
        team: editingPlayer.team,
        playerIndex: editingPlayer.playerIndex,
        name: editPlayerName.trim(),
        userId: selectedUserId,
      });
      setEditingPlayer(null);
      setEditPlayerName("");
      setSelectedUserId(undefined);
    } catch (error) {
      console.error("Failed to update player name:", error);
    }
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setEditingPlayer(null);
    setEditPlayerName("");
    setSelectedUserId(undefined);
  };

  const isFinished = game.status === "finished";
  const isGoldenPoint = game.goldenPoint?.isActive;

  return (
    <div className="min-h-screen pb-52">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 touch-manipulation">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-display text-lg tracking-wider">БАГИЙН ХАРВАА</h1>
          <div className="w-10" />
        </div>
      </motion.header>

      {/* Score Header */}
      <div className="sticky top-14 z-10 bg-white px-4 py-4">
        <TeamScoreHeader
          homeClanName={game.homeClanName}
          homeClanTag={game.homeClanTag}
          awayClanName={game.awayClanName}
          awayClanTag={game.awayClanTag}
          homeScore={currentSet?.homeScore ?? 0}
          awayScore={currentSet?.awayScore ?? 0}
          currentSet={game.currentSet as 1 | 2}
          set1Result={
            game.currentSet === 2
              ? {
                  homeScore: game.sets[0].homeScore,
                  awayScore: game.sets[0].awayScore,
                  homePulled: game.sets[0].homePulled,
                  awayPulled: game.sets[0].awayPulled,
                }
              : undefined
          }
          onEditTeamName={!isFinished ? handleEditTeamName : undefined}
        />
      </div>

      {/* Golden Point Banner */}
      {isGoldenPoint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 text-center"
        >
          <div className="text-lg font-bold">АЛТАН ОНОО</div>
          <div className="text-sm opacity-90">Эхнийх оногдуулж, дараагийнх алдвал ялна!</div>
        </motion.div>
      )}

      {/* Phases List */}
      <div ref={scrollRef} className="px-4 space-y-4">
        {[...(currentSet?.phases || [])].reverse().map((phase, reversedIndex) => {
          const phaseIndex = (currentSet?.phases.length ?? 0) - 1 - reversedIndex;
          const isActive = phaseIndex === game.currentPhaseIndex && !isFinished && !isGoldenPoint;

          return (
            <div key={phaseIndex} data-active={isActive}>
              <PhaseSection
                phase={phase as any}
                isActive={isActive}
                currentShooterIndex={isActive ? game.currentShooterIndex : -1}
                currentShotIndex={isActive ? game.currentShotInTurn : -1}
                homeTeamPlayers={game.homeTeam.players}
                awayTeamPlayers={game.awayTeam.players}
                onEditShot={
                  !isFinished
                    ? (shooterIndex, shotIndex) =>
                        handleEditShot(game.currentSet - 1, phaseIndex, shooterIndex, shotIndex)
                    : undefined
                }
                onEditPlayerName={!isFinished ? handleOpenEditPlayerName : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Game Controls */}
      {!isFinished && currentShooter && (
        <TeamGameControls
          currentShooterName={getCurrentShooterName()}
          currentTeam={currentShooter.team}
          shotNumber={game.currentShotInTurn + 1}
          onHit={() => handleRecordShot(true)}
          onMiss={() => handleRecordShot(false)}
          onSkip={handleRecordSkip}
          showSkipButton={shouldShowSkipButton()}
          disabled={isRecording}
        />
      )}

      {/* Finished Modal */}
      {isFinished && game.result && (
        <TeamFinishedModal
          open={isFinished}
          homeClanName={game.homeClanName}
          homeClanTag={game.homeClanTag}
          awayClanName={game.awayClanName}
          awayClanTag={game.awayClanTag}
          result={game.result}
          gameId={gameId}
        />
      )}

      {/* Edit Player Name Modal */}
      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={handleCloseEditModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Тоглогчийн нэр засах</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">
                  {editingPlayer.team === "home" ? "Эзэн баг" : "Зочин баг"} - Тоглогч {editingPlayer.playerIndex + 1}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editPlayerName}
                    onChange={(e) => {
                      setEditPlayerName(e.target.value);
                      setSelectedUserId(undefined); // Clear selection when typing
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSavePlayerName()}
                    placeholder="Нэр хайх эсвэл бичих..."
                    className="pl-10"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && !selectedUserId && (
                <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto mb-4">
                  {searchResults.slice(0, 5).map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user._id, user.fullName)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 border-b last:border-b-0 hover:bg-gray-50 text-left"
                    >
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {editPlayerName.length >= 2 && searchResults && searchResults.length === 0 && !selectedUserId && (
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Хэрэглэгч олдсонгүй. Шууд нэр оруулна уу.
                </p>
              )}

              {selectedUserId && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
                  <User className="w-4 h-4" />
                  <span>Бүртгэлтэй хэрэглэгч сонгогдлоо</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseEditModal}
                >
                  Болих
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSavePlayerName}
                  disabled={!editPlayerName.trim()}
                >
                  Хадгалах
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
