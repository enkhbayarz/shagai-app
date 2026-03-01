"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, Edit2, Users, User } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type TeamColor, TEAM_COLOR_OPTIONS, getTeamColors, teamColorMap } from "@/lib/team-colors";

interface TeamPlayer {
  name: string;
  isEditing: boolean;
  userId?: Id<"users"> | null;
}

export default function TeamSetupPage() {
  const router = useRouter();

  // Game settings
  const [playersPerTeam, setPlayersPerTeam] = useState<3 | 4 | 5 | 6>(6);
  const [homeTeamName, setHomeTeamName] = useState("Баг 2");
  const [awayTeamName, setAwayTeamName] = useState("Баг 1");
  const [awayTeamColor, setAwayTeamColor] = useState<TeamColor>("orange");
  const [homeTeamColor, setHomeTeamColor] = useState<TeamColor>("blue");
  const [awayColorOpen, setAwayColorOpen] = useState(false);
  const [homeColorOpen, setHomeColorOpen] = useState(false);
  const [isEditingHomeName, setIsEditingHomeName] = useState(false);
  const [isEditingAwayName, setIsEditingAwayName] = useState(false);

  // Team search state
  const [selectedHomeClanId, setSelectedHomeClanId] =
    useState<Id<"clans"> | null>(null);
  const [selectedAwayClanId, setSelectedAwayClanId] =
    useState<Id<"clans"> | null>(null);

  // Player search state - track which player is being edited
  const [activeHomePlayerIndex, setActiveHomePlayerIndex] = useState<
    number | null
  >(null);
  const [activeAwayPlayerIndex, setActiveAwayPlayerIndex] = useState<
    number | null
  >(null);

  // Generate default player names
  const generatePlayers = (count: number): TeamPlayer[] =>
    Array.from({ length: count }, (_, i) => ({
      name: `Тоглогч ${i + 1}`,
      isEditing: false,
      userId: null,
    }));

  const [homePlayers, setHomePlayers] = useState<TeamPlayer[]>(
    generatePlayers(6),
  );
  const [awayPlayers, setAwayPlayers] = useState<TeamPlayer[]>(
    generatePlayers(6),
  );
  // Bench players (one per team)
  const [homeBenchPlayer, setHomeBenchPlayer] = useState<TeamPlayer>({
    name: "Сэлгээ",
    isEditing: false,
    userId: null,
  });
  const [awayBenchPlayer, setAwayBenchPlayer] = useState<TeamPlayer>({
    name: "Сэлгээ",
    isEditing: false,
    userId: null,
  });
  const [isCreating, setIsCreating] = useState(false);

  const createTeamGame = useMutation(api.teamGames.create);

  // Team search queries (triggered when editing and 2+ chars)
  const homeSearchResults = useQuery(
    api.teams.search,
    isEditingHomeName && homeTeamName.length >= 2
      ? { query: homeTeamName }
      : "skip",
  );
  const awaySearchResults = useQuery(
    api.teams.search,
    isEditingAwayName && awayTeamName.length >= 2
      ? { query: awayTeamName }
      : "skip",
  );

  // Player search queries - use existing api.users.search
  const homePlayerSearchQuery =
    activeHomePlayerIndex !== null
      ? (homePlayers[activeHomePlayerIndex]?.name ?? "")
      : "";
  const awayPlayerSearchQuery =
    activeAwayPlayerIndex !== null
      ? (awayPlayers[activeAwayPlayerIndex]?.name ?? "")
      : "";

  const homePlayerSearchResults = useQuery(
    api.users.search,
    activeHomePlayerIndex !== null && homePlayerSearchQuery.length >= 2
      ? { query: homePlayerSearchQuery }
      : "skip",
  );
  const awayPlayerSearchResults = useQuery(
    api.users.search,
    activeAwayPlayerIndex !== null && awayPlayerSearchQuery.length >= 2
      ? { query: awayPlayerSearchQuery }
      : "skip",
  );

  // Handle team selection from search
  const handleSelectHomeTeam = (team: {
    _id: Id<"clans">;
    name: string;
    tag: string;
  }) => {
    setHomeTeamName(team.name);
    setSelectedHomeClanId(team._id);
    setIsEditingHomeName(false);
  };

  const handleSelectAwayTeam = (team: {
    _id: Id<"clans">;
    name: string;
    tag: string;
  }) => {
    setAwayTeamName(team.name);
    setSelectedAwayClanId(team._id);
    setIsEditingAwayName(false);
  };

  // Handle player selection from search
  const handleSelectHomePlayer = (
    index: number,
    user: { _id: Id<"users">; fullName?: string | null },
  ) => {
    const updated = [...homePlayers];
    updated[index] = {
      ...updated[index],
      name: user.fullName || "Unknown",
      userId: user._id,
      isEditing: false,
    };
    setHomePlayers(updated);
    setActiveHomePlayerIndex(null);
  };

  const handleSelectAwayPlayer = (
    index: number,
    user: { _id: Id<"users">; fullName?: string | null },
  ) => {
    const updated = [...awayPlayers];
    updated[index] = {
      ...updated[index],
      name: user.fullName || "Unknown",
      userId: user._id,
      isEditing: false,
    };
    setAwayPlayers(updated);
    setActiveAwayPlayerIndex(null);
  };

  // Handle player count change
  const handlePlayerCountChange = (count: 3 | 4 | 5 | 6) => {
    setPlayersPerTeam(count);
    setHomePlayers(generatePlayers(count));
    setAwayPlayers(generatePlayers(count));
  };

  // Handle player name edit
  const handlePlayerNameChange = (
    team: "home" | "away",
    index: number,
    name: string,
  ) => {
    if (team === "home") {
      const updated = [...homePlayers];
      updated[index] = { ...updated[index], name };
      setHomePlayers(updated);
    } else {
      const updated = [...awayPlayers];
      updated[index] = { ...updated[index], name };
      setAwayPlayers(updated);
    }
  };

  // Toggle player edit mode
  const togglePlayerEdit = (team: "home" | "away", index: number) => {
    if (team === "home") {
      const updated = [...homePlayers];
      updated[index] = {
        ...updated[index],
        isEditing: !updated[index].isEditing,
      };
      setHomePlayers(updated);
    } else {
      const updated = [...awayPlayers];
      updated[index] = {
        ...updated[index],
        isEditing: !updated[index].isEditing,
      };
      setAwayPlayers(updated);
    }
  };

  // Start game - always available!
  const handleStart = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      // Build player arrays with bench player at the end (isSubstitute: true)
      const homeTeamPlayersWithBench = [
        ...homePlayers.map((p) => ({
          name: p.name,
          userId: p.userId ?? undefined,
          isSubstitute: false,
        })),
        {
          name: homeBenchPlayer.name,
          userId: homeBenchPlayer.userId ?? undefined,
          isSubstitute: true,
        },
      ];

      const awayTeamPlayersWithBench = [
        ...awayPlayers.map((p) => ({
          name: p.name,
          userId: p.userId ?? undefined,
          isSubstitute: false,
        })),
        {
          name: awayBenchPlayer.name,
          userId: awayBenchPlayer.userId ?? undefined,
          isSubstitute: true,
        },
      ];

      const gameId = await createTeamGame({
        playersPerTeam,
        homeTeamName,
        awayTeamName,
        homeClanId: selectedHomeClanId ?? undefined,
        awayClanId: selectedAwayClanId ?? undefined,
        homeTeamPlayers: homeTeamPlayersWithBench,
        awayTeamPlayers: awayTeamPlayersWithBench,
        homeTeamColor: homeTeamColor,
        awayTeamColor: awayTeamColor,
      });

      router.push(`/team/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create team game:", error);
      setIsCreating(false);
    }
  };

  const ac = getTeamColors(awayTeamColor, "orange"); // away colors
  const hc = getTeamColors(homeTeamColor, "blue");   // home colors

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl tracking-wider text-center">
          БАГИЙН ХАРВАА
        </h1>
      </motion.header>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Player Count Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 justify-center"
        >
          {([6, 5, 4, 3] as const).map((num) => (
            <Button
              key={num}
              variant={playersPerTeam === num ? "default" : "outline"}
              className={`h-9 px-4 text-sm font-bold touch-manipulation transition-all ${
                playersPerTeam === num
                  ? "bg-black text-white ring-2 ring-amber-500"
                  : "border-black/20 hover:bg-black/5"
              }`}
              onClick={() => handlePlayerCountChange(num)}
            >
              {num}v{num}
            </Button>
          ))}
        </motion.div>

        {/* Teams */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Away Team (Left) */}
          <Card className={`glass ${ac.border200}`}>
            <CardContent className="py-4">
              {/* Team Name */}
              <div className="relative mb-3">
                <div className="flex items-center justify-center gap-1">
                  {/* Tappable badge with radial color picker */}
                  <div className="relative">
                    <button
                      onClick={() => setAwayColorOpen(!awayColorOpen)}
                      className={`w-6 h-6 rounded-full ${ac.bg500} text-white flex items-center justify-center text-xs font-bold touch-manipulation transition-transform ${awayColorOpen ? "scale-110" : ""}`}
                    >
                      1
                    </button>
                    <AnimatePresence>
                      {awayColorOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setAwayColorOpen(false)} />
                          {TEAM_COLOR_OPTIONS.map((color, i) => {
                            const angle = Math.PI - (Math.PI / (TEAM_COLOR_OPTIONS.length - 1)) * i;
                            const radius = 56;
                            const x = radius * Math.cos(angle);
                            const y = radius * Math.sin(angle);
                            const isSelected = awayTeamColor === color;
                            const isTaken = color === homeTeamColor;
                            return (
                              <motion.button
                                key={color}
                                initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                                animate={{ scale: isTaken ? 0.6 : 1, x, y: -y, opacity: isTaken ? 0.3 : 1 }}
                                exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                                transition={{ delay: i * 0.025, type: "spring", stiffness: 500, damping: 25 }}
                                disabled={isTaken}
                                onClick={(e) => { e.stopPropagation(); if (!isTaken) { setAwayTeamColor(color); setAwayColorOpen(false); } }}
                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full shadow-lg touch-manipulation ${isTaken ? "cursor-not-allowed" : ""} ${isSelected ? "ring-[3px] ring-white ring-offset-2" : "border-2 border-white/50"}`}
                                style={{ backgroundColor: teamColorMap[color].hex }}
                              />
                            );
                          })}
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {isEditingAwayName ? (
                    <Input
                      value={awayTeamName}
                      onChange={(e) => {
                        setAwayTeamName(e.target.value);
                        setSelectedAwayClanId(null); // Clear selection when typing
                      }}
                      onBlur={() => {
                        // Delay to allow click on dropdown item
                        setTimeout(() => setIsEditingAwayName(false), 150);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setIsEditingAwayName(false)
                      }
                      className="h-7 text-sm font-medium text-center w-24"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingAwayName(true)}
                      className={`text-sm font-medium flex items-center gap-1 ${ac.hoverText600} transition-colors`}
                    >
                      {awayTeamName}
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Search Dropdown */}
                {isEditingAwayName &&
                  awaySearchResults &&
                  awaySearchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border shadow-lg z-10 overflow-hidden"
                    >
                      {awaySearchResults
                        .filter((team) => team._id !== selectedHomeClanId)
                        .slice(0, 5)
                        .map((team) => (
                          <button
                            key={team._id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectAwayTeam(team)}
                            className={`w-full px-3 py-2 text-left ${ac.hoverBg50} flex items-center gap-2 text-xs border-b last:border-b-0`}
                          >
                            <Users className={`w-3 h-3 ${ac.text400}`} />
                            <span className="font-medium">{team.name}</span>
                            <span className="text-muted-foreground">
                              [{team.tag}]
                            </span>
                          </button>
                        ))}
                    </motion.div>
                  )}
              </div>

              {/* Players */}
              <div className="space-y-1.5">
                {awayPlayers.map((player, index) => (
                  <div key={index} className="relative">
                    {player.isEditing ? (
                      <>
                        <Input
                          value={player.name}
                          onChange={(e) => {
                            // Update name and clear userId in one operation
                            const updated = [...awayPlayers];
                            updated[index] = {
                              ...updated[index],
                              name: e.target.value,
                              userId: null,
                            };
                            setAwayPlayers(updated);
                          }}
                          onFocus={() => setActiveAwayPlayerIndex(index)}
                          onBlur={() => {
                            setTimeout(() => {
                              togglePlayerEdit("away", index);
                              setActiveAwayPlayerIndex(null);
                            }, 150);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && togglePlayerEdit("away", index)
                          }
                          className="h-8 text-xs text-center"
                          autoFocus
                        />
                        {/* Player Search Dropdown */}
                        {activeAwayPlayerIndex === index &&
                          awayPlayerSearchResults &&
                          awayPlayerSearchResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border shadow-lg z-20 overflow-hidden"
                            >
                              {awayPlayerSearchResults
                                .filter(
                                  (user) =>
                                    !awayPlayers.some(
                                      (p, i) =>
                                        i !== index && p.userId === user._id,
                                    ) &&
                                    !homePlayers.some(
                                      (p) => p.userId === user._id,
                                    ),
                                )
                                .slice(0, 5)
                                .map((user) => (
                                  <button
                                    key={user._id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      handleSelectAwayPlayer(index, user)
                                    }
                                    className={`w-full px-3 py-2 text-left ${ac.hoverBg50} flex items-center gap-2 text-xs border-b last:border-b-0`}
                                  >
                                    <User className={`w-3 h-3 ${ac.text400}`} />
                                    <span className="font-medium">
                                      {user.fullName}
                                    </span>
                                    {user.username && (
                                      <span className="text-muted-foreground">
                                        @{user.username}
                                      </span>
                                    )}
                                  </button>
                                ))}
                            </motion.div>
                          )}
                      </>
                    ) : (
                      <button
                        onClick={() => togglePlayerEdit("away", index)}
                        className={`w-full text-xs ${ac.bg50} ${ac.hoverBg100} rounded px-2 py-1.5 text-left transition-colors flex items-center justify-between`}
                      >
                        <span>
                          {index + 1}. {player.name}
                        </span>
                        <Edit2 className="w-2.5 h-2.5 text-muted-foreground opacity-50" />
                      </button>
                    )}
                  </div>
                ))}

              </div>
            </CardContent>
          </Card>

          {/* Home Team (Right) */}
          <Card className={`glass ${hc.border200}`}>
            <CardContent className="py-4">
              {/* Team Name */}
              <div className="relative mb-3">
                <div className="flex items-center justify-center gap-1">
                  {/* Tappable badge with radial color picker */}
                  <div className="relative">
                    <button
                      onClick={() => setHomeColorOpen(!homeColorOpen)}
                      className={`w-6 h-6 rounded-full ${hc.bg500} text-white flex items-center justify-center text-xs font-bold touch-manipulation transition-transform ${homeColorOpen ? "scale-110" : ""}`}
                    >
                      2
                    </button>
                    <AnimatePresence>
                      {homeColorOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setHomeColorOpen(false)} />
                          {TEAM_COLOR_OPTIONS.map((color, i) => {
                            const angle = Math.PI - (Math.PI / (TEAM_COLOR_OPTIONS.length - 1)) * i;
                            const radius = 56;
                            const x = radius * Math.cos(angle);
                            const y = radius * Math.sin(angle);
                            const isSelected = homeTeamColor === color;
                            const isTaken = color === awayTeamColor;
                            return (
                              <motion.button
                                key={color}
                                initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                                animate={{ scale: isTaken ? 0.6 : 1, x, y: -y, opacity: isTaken ? 0.3 : 1 }}
                                exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                                transition={{ delay: i * 0.025, type: "spring", stiffness: 500, damping: 25 }}
                                disabled={isTaken}
                                onClick={(e) => { e.stopPropagation(); if (!isTaken) { setHomeTeamColor(color); setHomeColorOpen(false); } }}
                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full shadow-lg touch-manipulation ${isTaken ? "cursor-not-allowed" : ""} ${isSelected ? "ring-[3px] ring-white ring-offset-2" : "border-2 border-white/50"}`}
                                style={{ backgroundColor: teamColorMap[color].hex }}
                              />
                            );
                          })}
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {isEditingHomeName ? (
                    <Input
                      value={homeTeamName}
                      onChange={(e) => {
                        setHomeTeamName(e.target.value);
                        setSelectedHomeClanId(null); // Clear selection when typing
                      }}
                      onBlur={() => {
                        // Delay to allow click on dropdown item
                        setTimeout(() => setIsEditingHomeName(false), 150);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setIsEditingHomeName(false)
                      }
                      className="h-7 text-sm font-medium text-center w-24"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingHomeName(true)}
                      className={`text-sm font-medium flex items-center gap-1 ${hc.hoverText600} transition-colors`}
                    >
                      {homeTeamName}
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Search Dropdown */}
                {isEditingHomeName &&
                  homeSearchResults &&
                  homeSearchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border shadow-lg z-10 overflow-hidden"
                    >
                      {homeSearchResults
                        .filter((team) => team._id !== selectedAwayClanId)
                        .slice(0, 5)
                        .map((team) => (
                          <button
                            key={team._id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectHomeTeam(team)}
                            className={`w-full px-3 py-2 text-left ${hc.hoverBg50} flex items-center gap-2 text-xs border-b last:border-b-0`}
                          >
                            <Users className={`w-3 h-3 ${hc.text400}`} />
                            <span className="font-medium">{team.name}</span>
                            <span className="text-muted-foreground">
                              [{team.tag}]
                            </span>
                          </button>
                        ))}
                    </motion.div>
                  )}
              </div>

              {/* Players */}
              <div className="space-y-1.5">
                {homePlayers.map((player, index) => (
                  <div key={index} className="relative">
                    {player.isEditing ? (
                      <>
                        <Input
                          value={player.name}
                          onChange={(e) => {
                            // Update name and clear userId in one operation
                            const updated = [...homePlayers];
                            updated[index] = {
                              ...updated[index],
                              name: e.target.value,
                              userId: null,
                            };
                            setHomePlayers(updated);
                          }}
                          onFocus={() => setActiveHomePlayerIndex(index)}
                          onBlur={() => {
                            setTimeout(() => {
                              togglePlayerEdit("home", index);
                              setActiveHomePlayerIndex(null);
                            }, 150);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && togglePlayerEdit("home", index)
                          }
                          className="h-8 text-xs text-center"
                          autoFocus
                        />
                        {/* Player Search Dropdown */}
                        {activeHomePlayerIndex === index &&
                          homePlayerSearchResults &&
                          homePlayerSearchResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border shadow-lg z-20 overflow-hidden"
                            >
                              {homePlayerSearchResults
                                .filter(
                                  (user) =>
                                    !homePlayers.some(
                                      (p, i) =>
                                        i !== index && p.userId === user._id,
                                    ) &&
                                    !awayPlayers.some(
                                      (p) => p.userId === user._id,
                                    ),
                                )
                                .slice(0, 5)
                                .map((user) => (
                                  <button
                                    key={user._id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      handleSelectHomePlayer(index, user)
                                    }
                                    className={`w-full px-3 py-2 text-left ${hc.hoverBg50} flex items-center gap-2 text-xs border-b last:border-b-0`}
                                  >
                                    <User className={`w-3 h-3 ${hc.text400}`} />
                                    <span className="font-medium">
                                      {user.fullName}
                                    </span>
                                    {user.username && (
                                      <span className="text-muted-foreground">
                                        @{user.username}
                                      </span>
                                    )}
                                  </button>
                                ))}
                            </motion.div>
                          )}
                      </>
                    ) : (
                      <button
                        onClick={() => togglePlayerEdit("home", index)}
                        className={`w-full text-xs ${hc.bg50} ${hc.hoverBg100} rounded px-2 py-1.5 text-left transition-colors flex items-center justify-between`}
                      >
                        <span>
                          {index + 1}. {player.name}
                        </span>
                        <Edit2 className="w-2.5 h-2.5 text-muted-foreground opacity-50" />
                      </button>
                    )}
                  </div>
                ))}

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground"
        >
          Багийн нэр, тоглогчдын нэрийг засах боломжтой.
          <br />
          Тоглолтын үед ч нэр засах боломжтой.
        </motion.div> */}

        {/* Start Button - Always enabled! */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleStart}
            disabled={isCreating}
            className="w-full h-14 text-lg font-bold gap-2 bg-black text-white hover:bg-black/90 touch-manipulation"
          >
            {isCreating ? (
              "Үүсгэж байна..."
            ) : (
              <>
                <Play className="w-5 h-5" />
                ЭХЛҮҮЛЭХ
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
