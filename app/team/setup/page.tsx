"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, Edit2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TeamPlayer {
  name: string;
  isEditing: boolean;
}

export default function TeamSetupPage() {
  const router = useRouter();

  // Game settings
  const [playersPerTeam, setPlayersPerTeam] = useState<4 | 5 | 6>(4);
  const [homeTeamName, setHomeTeamName] = useState("Эзэн баг");
  const [awayTeamName, setAwayTeamName] = useState("Зочин баг");
  const [isEditingHomeName, setIsEditingHomeName] = useState(false);
  const [isEditingAwayName, setIsEditingAwayName] = useState(false);

  // Generate default player names
  const generatePlayers = (count: number): TeamPlayer[] =>
    Array.from({ length: count }, (_, i) => ({
      name: `Тоглогч ${i + 1}`,
      isEditing: false,
    }));

  const [homePlayers, setHomePlayers] = useState<TeamPlayer[]>(generatePlayers(4));
  const [awayPlayers, setAwayPlayers] = useState<TeamPlayer[]>(generatePlayers(4));
  const [isCreating, setIsCreating] = useState(false);

  const createTeamGame = useMutation(api.teamGames.create);

  // Handle player count change
  const handlePlayerCountChange = (count: 4 | 5 | 6) => {
    setPlayersPerTeam(count);
    setHomePlayers(generatePlayers(count));
    setAwayPlayers(generatePlayers(count));
  };

  // Handle player name edit
  const handlePlayerNameChange = (
    team: "home" | "away",
    index: number,
    name: string
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
      updated[index] = { ...updated[index], isEditing: !updated[index].isEditing };
      setHomePlayers(updated);
    } else {
      const updated = [...awayPlayers];
      updated[index] = { ...updated[index], isEditing: !updated[index].isEditing };
      setAwayPlayers(updated);
    }
  };

  // Start game - always available!
  const handleStart = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const gameId = await createTeamGame({
        playersPerTeam,
        homeTeamName,
        awayTeamName,
        homeTeamPlayers: homePlayers.map((p) => ({
          name: p.name,
          isSubstitute: false,
        })),
        awayTeamPlayers: awayPlayers.map((p) => ({
          name: p.name,
          isSubstitute: false,
        })),
      });

      router.push(`/team/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create team game:", error);
      setIsCreating(false);
    }
  };

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
        >
          <Card className="glass">
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground text-center mb-2">
                Тоглогчдын тоо
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([4, 5, 6] as const).map((num) => (
                  <Button
                    key={num}
                    variant={playersPerTeam === num ? "default" : "outline"}
                    className={`h-12 text-lg font-bold touch-manipulation transition-all ${
                      playersPerTeam === num
                        ? "bg-black text-white ring-2 ring-amber-500"
                        : "border-black/20 hover:bg-black/5"
                    }`}
                    onClick={() => handlePlayerCountChange(num)}
                  >
                    {num}v{num}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Teams */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Home Team */}
          <Card className="glass border-blue-200">
            <CardContent className="py-4">
              {/* Team Name */}
              <div className="flex items-center justify-center gap-1 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  Э
                </div>
                {isEditingHomeName ? (
                  <Input
                    value={homeTeamName}
                    onChange={(e) => setHomeTeamName(e.target.value)}
                    onBlur={() => setIsEditingHomeName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingHomeName(false)}
                    className="h-7 text-sm font-medium text-center w-24"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingHomeName(true)}
                    className="text-sm font-medium flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    {homeTeamName}
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Players */}
              <div className="space-y-1.5">
                {homePlayers.map((player, index) => (
                  <div key={index}>
                    {player.isEditing ? (
                      <Input
                        value={player.name}
                        onChange={(e) =>
                          handlePlayerNameChange("home", index, e.target.value)
                        }
                        onBlur={() => togglePlayerEdit("home", index)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && togglePlayerEdit("home", index)
                        }
                        className="h-8 text-xs text-center"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => togglePlayerEdit("home", index)}
                        className="w-full text-xs bg-blue-50 hover:bg-blue-100 rounded px-2 py-1.5 text-left transition-colors flex items-center justify-between"
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

          {/* Away Team */}
          <Card className="glass border-orange-200">
            <CardContent className="py-4">
              {/* Team Name */}
              <div className="flex items-center justify-center gap-1 mb-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                  З
                </div>
                {isEditingAwayName ? (
                  <Input
                    value={awayTeamName}
                    onChange={(e) => setAwayTeamName(e.target.value)}
                    onBlur={() => setIsEditingAwayName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingAwayName(false)}
                    className="h-7 text-sm font-medium text-center w-24"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingAwayName(true)}
                    className="text-sm font-medium flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    {awayTeamName}
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Players */}
              <div className="space-y-1.5">
                {awayPlayers.map((player, index) => (
                  <div key={index}>
                    {player.isEditing ? (
                      <Input
                        value={player.name}
                        onChange={(e) =>
                          handlePlayerNameChange("away", index, e.target.value)
                        }
                        onBlur={() => togglePlayerEdit("away", index)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && togglePlayerEdit("away", index)
                        }
                        className="h-8 text-xs text-center"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => togglePlayerEdit("away", index)}
                        className="w-full text-xs bg-orange-50 hover:bg-orange-100 rounded px-2 py-1.5 text-left transition-colors flex items-center justify-between"
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground"
        >
          Багийн нэр, тоглогчдын нэрийг засах боломжтой.
          <br />
          Тоглолтын үед ч нэр засах боломжтой.
        </motion.div>

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
