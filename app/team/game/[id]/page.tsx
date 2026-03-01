"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Search, User, RefreshCw } from "lucide-react";
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
import { TeamColor, getTeamColors } from "@/lib/team-colors";

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
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>(
    undefined,
  );
  const [viewingSet, setViewingSet] = useState<1 | 2>(1);
  const [showSetTransitionModal, setShowSetTransitionModal] = useState(false);
  const [showScoreLimitError, setShowScoreLimitError] = useState(false);
  const [isInEditMode, setIsInEditMode] = useState(false);

  // Portal target for header action button
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHeaderEl(document.getElementById("header-action"));
  }, []);

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
  const substitutePlayer = useMutation(api.teamGames.substitutePlayer);
  const confirmSetTransitionMutation = useMutation(api.teamGames.confirmSetTransition);

  // Substitution state
  const [substitutingTeam, setSubstitutingTeam] = useState<
    "home" | "away" | null
  >(null);
  const [isSubstituting, setIsSubstituting] = useState(false);

  // Search users for player name editing
  const searchResults = useQuery(
    api.users.search,
    editPlayerName.length >= 2 && editingPlayer
      ? { query: editPlayerName }
      : "skip",
  );

  // Auto-scroll to active phase
  useEffect(() => {
    if (scrollRef.current && game) {
      const activePhase = scrollRef.current.querySelector(
        "[data-active='true']",
      );
      if (activePhase) {
        activePhase.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [game?.currentPhaseIndex]);

  // Sync viewingSet with game's currentSet when it changes (skip if pending transition)
  useEffect(() => {
    if (game?.currentSet && !game.pendingSetTransition) {
      setViewingSet(game.currentSet as 1 | 2);
    }
  }, [game?.currentSet, game?.pendingSetTransition]);

  // Detect pendingSetTransition and show confirmation modal
  useEffect(() => {
    if (game?.pendingSetTransition === true) {
      setShowSetTransitionModal(true);
      setViewingSet(1);
    }
  }, [game?.pendingSetTransition]);

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
  }, [
    game?.currentShooterIndex,
    game?.currentPhaseIndex,
    game?.currentShotInTurn,
    game?.currentSet,
    gameId,
    isRecording,
  ]);

  // Distinguish loading from not found
  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Ачааллаж байна...
        </div>
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

  const awayColor = (game?.awayTeamColor as TeamColor) ?? undefined;
  const homeColor = (game?.homeTeamColor as TeamColor) ?? undefined;

  const currentSet = game.sets[game.currentSet - 1];
  const currentPhase = currentSet?.phases[game.currentPhaseIndex];
  const currentShooter = currentPhase?.shooters[game.currentShooterIndex];

  // Displayed set data (based on viewingSet, not game.currentSet)
  const displayedSet = game.sets[viewingSet - 1];
  // Check if Set 2 has started (Set 1 is completed)
  const set2HasStarted = game.sets[0]?.isCompleted === true;

  // Get current shooter's name
  const getCurrentShooterName = () => {
    if (!currentShooter) return "";
    if (currentShooter.team === "home") {
      return (
        game.homeTeam.players[currentShooter.playerIndex]?.name ?? "Тоглогч"
      );
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
    shotIndex: number,
  ) => {
    try {
      const result = await editShot({ gameId, setIndex, phaseIndex, shooterIndex, shotIndex });

      if (result?.pendingCleared) {
        // Score dropped below 30, exit edit mode, game resumes normally
        setIsInEditMode(false);
        setShowSetTransitionModal(false);
      } else if (result?.shouldShowTransitionModal) {
        // Miss→hit edit, score still >= 30, re-show confirmation modal
        setShowSetTransitionModal(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("30 оноо хязгаарлалт")) {
        setShowScoreLimitError(true);
      } else {
        console.error("Failed to edit shot:", error);
      }
    }
  };

  // Handle confirming set transition (Тийм)
  const handleConfirmSetTransition = async () => {
    try {
      await confirmSetTransitionMutation({ gameId });
      setShowSetTransitionModal(false);
      setIsInEditMode(false);
    } catch (error) {
      console.error("Failed to confirm set transition:", error);
    }
  };

  // Handle declining set transition (Үгүй) — enter edit mode
  const handleDeclineSetTransition = () => {
    setShowSetTransitionModal(false);
    setIsInEditMode(true);
    setViewingSet(1);
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
  const handleOpenEditPlayerName = (
    team: "home" | "away",
    playerIndex: number,
  ) => {
    const players =
      team === "home" ? game.homeTeam.players : game.awayTeam.players;
    const currentName =
      players[playerIndex]?.name ?? `Тоглогч ${playerIndex + 1}`;
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

  // Handle substitution
  const handleSubstitute = async (outPlayerIndex: number) => {
    if (!substitutingTeam || isSubstituting) return;
    setIsSubstituting(true);
    try {
      await substitutePlayer({
        gameId,
        team: substitutingTeam,
        outPlayerIndex,
      });
      setSubstitutingTeam(null);
    } catch (error) {
      console.error("Failed to substitute player:", error);
    } finally {
      setIsSubstituting(false);
    }
  };

  // Get bench player for a team
  const getBenchPlayer = (team: "home" | "away") => {
    const players =
      team === "home" ? game.homeTeam.players : game.awayTeam.players;
    return players.find((p) => p.isSubstitute === true);
  };

  // Check if team can substitute
  const canSubstitute = (team: "home" | "away") => {
    if (isFinished) return false;
    const subUsed =
      team === "home" ? game.homeSubstitutionUsed : game.awaySubstitutionUsed;
    if (subUsed) return false;
    const benchPlayer = getBenchPlayer(team);
    return benchPlayer !== undefined;
  };

  // Get starters (non-bench players) for substitution modal
  const getStarters = (team: "home" | "away") => {
    const players =
      team === "home" ? game.homeTeam.players : game.awayTeam.players;
    return players
      .map((p, index) => ({ ...p, index }))
      .filter((p) => !p.isSubstitute);
  };

  const isFinished = game.status === "finished";
  const isGoldenPoint = game.goldenPoint?.isActive;

  return (
    <div className="min-h-screen pb-52">
      {/* Header Portal Buttons */}
      {headerEl &&
        createPortal(
          <>
            {/* Set toggle when Set 2 started (and not in pending transition) */}
            {set2HasStarted && !game.pendingSetTransition && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingSet(viewingSet === 1 ? 2 : 1)}
                className="text-xs"
              >
                {viewingSet === 1 ? "Дунд өрөг" : "Эхэн өрөг"} руу очих
              </Button>
            )}
            {/* Manual transition trigger in edit mode */}
            {game.pendingSetTransition && isInEditMode && (
              <Button
                size="sm"
                onClick={() => setShowSetTransitionModal(true)}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white"
              >
                Дунд өрөг рүү
              </Button>
            )}
          </>,
          headerEl,
        )}
      {/* Score Header */}
      <div className="sticky top-[61px] lg:top-0 z-10 bg-white px-4 py-2">
        <TeamScoreHeader
          homeClanName={game.homeClanName}
          homeClanTag={game.homeClanTag}
          awayClanName={game.awayClanName}
          awayClanTag={game.awayClanTag}
          homeScore={displayedSet?.homeScore ?? 0}
          awayScore={displayedSet?.awayScore ?? 0}
          homePulled={displayedSet?.homePulled ?? 0}
          awayPulled={displayedSet?.awayPulled ?? 0}
          currentSet={viewingSet}
          set1Result={
            viewingSet === 2
              ? {
                  homeScore: game.sets[0].homeScore,
                  awayScore: game.sets[0].awayScore,
                  homePulled: game.sets[0].homePulled,
                  awayPulled: game.sets[0].awayPulled,
                }
              : undefined
          }
          onEditTeamName={!isFinished ? handleEditTeamName : undefined}
          awayColor={awayColor}
          homeColor={homeColor}
        />

      </div>

      {/* Golden Point Banner */}
      {isGoldenPoint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 text-center"
        >
          <div className="text-lg font-bold">ДҮҮЖИН</div>
        </motion.div>
      )}

      {/* Phases List */}
      <div ref={scrollRef} className="px-4 space-y-4">
        {[...(displayedSet?.phases || [])]
          .reverse()
          .map((phase, reversedIndex) => {
            const phaseIndex =
              (displayedSet?.phases.length ?? 0) - 1 - reversedIndex;
            // Only show as active if viewing the current active set
            const isActive =
              viewingSet === game.currentSet &&
              phaseIndex === game.currentPhaseIndex &&
              !isFinished &&
              !isGoldenPoint;

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
                    !isFinished && (viewingSet === game.currentSet || isInEditMode)
                      ? (shooterIndex, shotIndex) =>
                          handleEditShot(
                            viewingSet - 1,
                            phaseIndex,
                            shooterIndex,
                            shotIndex,
                          )
                      : undefined
                  }
                  onEditPlayerName={
                    !isFinished ? handleOpenEditPlayerName : undefined
                  }
                  awayColor={awayColor}
                  homeColor={homeColor}
                />
              </div>
            );
          })}
      </div>

      {/* Game Controls */}
      {!isFinished && currentShooter && !game.pendingSetTransition && viewingSet === game.currentSet && (
        <TeamGameControls
          currentShooterName={getCurrentShooterName()}
          currentTeam={currentShooter.team}
          shotNumber={game.currentShotInTurn + 1}
          onHit={() => handleRecordShot(true)}
          onMiss={() => handleRecordShot(false)}
          onSkip={handleRecordSkip}
          showSkipButton={shouldShowSkipButton()}
          disabled={isRecording}
          awayColor={awayColor}
          homeColor={homeColor}
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
          awayColor={awayColor}
          homeColor={homeColor}
          sets={game.sets}
          homeTeamPlayers={game.homeTeam.players}
          awayTeamPlayers={game.awayTeam.players}
        />
      )}

      {/* Edit Player Name Modal */}
      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 pt-20 pb-8"
            onClick={handleCloseEditModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl mb-auto"
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
                  {editingPlayer.team === "home" ? "Баг 2" : "Баг 1"} - Тоглогч{" "}
                  {editingPlayer.playerIndex + 1}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editPlayerName}
                    onChange={(e) => {
                      setEditPlayerName(e.target.value);
                      setSelectedUserId(undefined); // Clear selection when typing
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSavePlayerName()
                    }
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
                        <div className="text-sm font-medium truncate">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {editPlayerName.length >= 2 &&
                searchResults &&
                searchResults.length === 0 &&
                !selectedUserId && (
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

              {/* Substitution Button */}
              {editingPlayer &&
                canSubstitute(editingPlayer.team) &&
                !(
                  (editingPlayer.team === "home"
                    ? game.homeTeam.players
                    : game.awayTeam.players
                  )[editingPlayer.playerIndex]?.isSubstitute
                ) && (
                  <Button
                    variant="outline"
                    className={`w-full mt-3 text-xs gap-1 ${
                      editingPlayer.team === "home"
                        ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                        : "border-blue-300 text-blue-700 hover:bg-blue-50"
                    }`}
                    size="sm"
                    onClick={() => {
                      const team = editingPlayer.team;
                      handleCloseEditModal();
                      setSubstitutingTeam(team);
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Солих (Сэлгээ) — {getBenchPlayer(editingPlayer.team)?.name}
                  </Button>
                )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Substitution Modal */}
      <AnimatePresence>
        {substitutingTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setSubstitutingTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Тоглогч солих</h3>
                <button
                  onClick={() => setSubstitutingTeam(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div
                  className={`text-sm font-medium mb-2 ${substitutingTeam === "home" ? "text-orange-600" : "text-blue-600"}`}
                >
                  {substitutingTeam === "home"
                    ? game.homeTeamName || "Баг 2"
                    : game.awayTeamName || "Баг 1"}
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Сэлгээ:{" "}
                  <span className="font-medium">
                    {getBenchPlayer(substitutingTeam)?.name}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Хэнийг солих вэ?
                </div>
              </div>

              {/* Starters list */}
              <div className="space-y-2 mb-4">
                {getStarters(substitutingTeam).map((player) => (
                  <button
                    key={player.index}
                    onClick={() => handleSubstitute(player.index)}
                    disabled={isSubstituting}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-colors ${
                      substitutingTeam === "home"
                        ? "border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                        : "border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    } ${isSubstituting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <RefreshCw
                      className={`w-4 h-4 ${substitutingTeam === "home" ? "text-orange-400" : "text-blue-400"}`}
                    />
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSubstitutingTeam(null)}
              >
                Болих
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Transition Confirmation Modal */}
      <AnimatePresence>
        {showSetTransitionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              {/* App Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center"
                >
                  <img
                    src="/app_icon.svg"
                    alt="Шагай Харваа"
                    className="w-10 h-10"
                  />
                </motion.div>
              </div>

              <h2 className="text-xl font-bold mb-2">Эхэн өрөг дууслаа!</h2>
              <p className="text-muted-foreground mb-4">
                Дунд өрөг рүү үргэлжлүүлэх үү?
              </p>

              {/* Score Summary */}
              {(() => {
                const ac = getTeamColors(awayColor, "orange");
                const hc = getTeamColors(homeColor, "blue");
                const set1 = game.sets[0];
                return (
                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    {/* Team Names Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 text-center">
                        <div className={`flex items-center justify-center gap-1.5`}>
                          <div className={`w-7 h-7 rounded-full ${ac.bg100} flex items-center justify-center`}>
                            <span className={`text-xs font-bold ${ac.text600}`}>
                              {game.awayClanName?.charAt(0) ?? "Б"}
                            </span>
                          </div>
                          <span className="text-sm font-medium truncate max-w-[80px]">
                            {game.awayClanName}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 text-xs text-muted-foreground font-medium">VS</div>
                      <div className="flex-1 text-center">
                        <div className={`flex items-center justify-center gap-1.5`}>
                          <span className="text-sm font-medium truncate max-w-[80px]">
                            {game.homeClanName}
                          </span>
                          <div className={`w-7 h-7 rounded-full ${hc.bg100} flex items-center justify-center`}>
                            <span className={`text-xs font-bold ${hc.text600}`}>
                              {game.homeClanName?.charAt(0) ?? "Б"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Score Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        <span className={`text-2xl font-bold ${ac.text500}`}>
                          {Math.min(set1?.awayScore ?? 0, 15)}
                        </span>
                        {(set1?.awayScore ?? 0) > 15 && (
                          <span className={`text-sm font-normal ${ac.text500} ml-0.5`}>
                            (+{(set1?.awayScore ?? 0) - 15})
                          </span>
                        )}
                      </div>
                      <div className="px-3">
                        <span className="text-[10px] text-muted-foreground bg-white px-2 py-0.5 rounded-full">
                          Эхэн өрөг
                        </span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className={`text-2xl font-bold ${hc.text500}`}>
                          {Math.min(set1?.homeScore ?? 0, 15)}
                        </span>
                        {(set1?.homeScore ?? 0) > 15 && (
                          <span className={`text-sm font-normal ${hc.text500} ml-0.5`}>
                            (+{(set1?.homeScore ?? 0) - 15})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDeclineSetTransition}
                >
                  Үгүй
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleConfirmSetTransition}
                >
                  Тийм
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Limit Error Modal */}
      <AnimatePresence>
        {showScoreLimitError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowScoreLimitError(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="text-red-500 text-lg font-bold mb-2">
                Засах боломжгүй
              </div>
              <p className="text-muted-foreground mb-4">
                Эхэн өрөгт 30 оноо хязгаарлалт байгаа тул засах боломжгүй
              </p>
              <Button
                onClick={() => setShowScoreLimitError(false)}
                className="w-full"
              >
                Ойлголоо
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
