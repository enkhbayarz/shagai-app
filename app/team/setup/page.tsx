"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, User, GripVertical, X, Edit2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TeamColor, getTeamColors } from "@/lib/team-colors";

import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";

interface TeamPlayer {
  name: string;
}

const AWAY_PREDEFINED = ["Бат", "Дорж", "Пүрэв", "Ганбаатар", "Лхагва", "Сүхээ", "Чинзо", "Даваа"];
const HOME_PREDEFINED = ["Тулга", "Зоригт", "Эрдэнэ", "Баяр", "Чингүүн", "Мөнх", "Төрөө", "Болд"];

export default function TeamSetupPage() {
  const router = useRouter();
  const MAX_PLAYERS = 8;
  const [playersPerTeam, setPlayersPerTeam] = useState<3 | 4 | 5 | 6 | 7 | 8>(6);
  const [homeTeamName] = useState("Баг 2");
  const [awayTeamName] = useState("Баг 1");
  const [awayTeamColor] = useState<TeamColor>("orange");
  const [homeTeamColor] = useState<TeamColor>("blue");
  const [isCreating, setIsCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const generatePlayers = () => Array.from({ length: MAX_PLAYERS }, () => ({ name: "" }));

  const [homePlayers, setHomePlayers] = useState<TeamPlayer[]>(generatePlayers());
  const [awayPlayers, setAwayPlayers] = useState<TeamPlayer[]>(generatePlayers());

  const createTeamGame = useMutation(api.teamGames.create);

  const isAssigned = (name: string) => {
    if (!name) return false;
    return [...homePlayers, ...awayPlayers].some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const playerName = active.id as string;
    const [team, indexStr] = (over.id as string).split("-");
    const index = parseInt(indexStr);

    const setter = team === "home" ? setHomePlayers : setAwayPlayers;
    const current = team === "home" ? homePlayers : awayPlayers;
    
    const updated = [...current];
    updated[index] = { name: playerName };
    setter(updated);
  };

  const handleManualEdit = (team: "home" | "away", index: number, value: string) => {
    const setter = team === "home" ? setHomePlayers : setAwayPlayers;
    const updated = [...(team === "home" ? homePlayers : awayPlayers)];
    updated[index] = { name: value };
    setter(updated);
  };

  const handleStart = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const gameId = await createTeamGame({
        playersPerTeam,
        homeTeamName,
        awayTeamName,
        homeTeamPlayers: homePlayers.slice(0, playersPerTeam).map((p, i) => ({ name: p.name || `Харваач ${i + 1}`, isSubstitute: false })),
        awayTeamPlayers: awayPlayers.slice(0, playersPerTeam).map((p, i) => ({ name: p.name || `Харваач ${i + 1}`, isSubstitute: false })),
        homeTeamColor,
        awayTeamColor,
      });
      router.push(`/team/game/${gameId}`);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  const ac = getTeamColors(awayTeamColor, "orange");
  const hc = getTeamColors(homeTeamColor, "blue");

  // Traditional Rounds
  const rounds = [
    { label: "Нийллэг үе", indices: [0, 1] },
    { label: "Шувтарга үе", indices: [2, 3] },
    { label: "Мэргэ үе", indices: [4, 5] },
  ];

  // Bench indices are only relevant for 7 and 8
  const showBench = playersPerTeam >= 7;
  const benchIndices = showBench ? (playersPerTeam === 7 ? [6] : [6, 7]) : [];

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
      <div className="min-h-screen px-4 py-6 bg-slate-50/50">
        <h1 className="font-display text-2xl tracking-wider text-center font-bold uppercase mb-6">Багийн Тохиргоо</h1>

        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <PlayerPool title={awayTeamName} players={AWAY_PREDEFINED} colorSet={ac} isAssigned={isAssigned} />
            <PlayerPool title={homeTeamName} players={HOME_PREDEFINED} colorSet={hc} isAssigned={isAssigned} />
          </div>

          <div className="flex flex-wrap gap-2 justify-center py-2">
            {([8, 7, 6, 5, 4, 3] as const).map((num) => (
              <Button 
                key={num} 
                variant={playersPerTeam === num ? "default" : "outline"} 
                className={`h-9 px-4 text-xs font-bold transition-all ${playersPerTeam === num ? "bg-black text-white scale-105" : ""}`}
                onClick={() => setPlayersPerTeam(num)}
              >
                {num}v{num}
              </Button>
            ))}
          </div>

          <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            {/* MAIN ROUNDS (0-5) */}
            {rounds.map((round) => {
              const visibleIndices = round.indices.filter(idx => idx < Math.min(playersPerTeam, 6));
              if (visibleIndices.length === 0) return null;
              return (
                <div key={round.label} className="space-y-4">
                  <RoundSeparator label={round.label} />
                  <div className="grid grid-cols-2 gap-4">
                    {visibleIndices.map((idx) => (
                      <div key={idx} className="contents">
                        <DroppableInput id={`away-${idx}`} value={awayPlayers[idx].name} colorSet={ac} onChange={(v: string) => handleManualEdit("away", idx, v)} onClear={() => handleManualEdit("away", idx, "")} />
                        <DroppableInput id={`home-${idx}`} value={homePlayers[idx].name} colorSet={hc} onChange={(v: string) => handleManualEdit("home", idx, v)} onClear={() => handleManualEdit("home", idx, "")} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* BENCH SECTION (Only for 7v7 or 8v8) */}
            {showBench && (
              <div className="pt-4 mt-4 border-t border-dashed border-slate-200">
                <RoundSeparator label="Сэлгээ / Bench" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {benchIndices.map((idx) => (
                    <div key={idx} className="contents">
                      <DroppableInput id={`away-${idx}`} value={awayPlayers[idx].name} colorSet={ac} isBench onChange={(v: string) => handleManualEdit("away", idx, v)} onClear={() => handleManualEdit("away", idx, "")} />
                      <DroppableInput id={`home-${idx}`} value={homePlayers[idx].name} colorSet={hc} isBench onChange={(v: string) => handleManualEdit("home", idx, v)} onClear={() => handleManualEdit("home", idx, "")} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleStart} disabled={isCreating} className="w-full h-14 text-lg font-bold bg-black text-white shadow-xl rounded-2xl">
            {isCreating ? "Үүсгэж байна..." : "ТОГЛООМ ЭХЛҮҮЛЭХ"}
          </Button>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="px-4 py-2 bg-white border-2 border-black rounded-xl shadow-2xl flex items-center gap-2 text-sm font-bold cursor-grabbing">
            <User className="w-4 h-4" /> {activeId}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function RoundSeparator({ label }: { label: string }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-slate-100"></div>
      <span className="mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{label}</span>
      <div className="flex-grow border-t border-slate-100"></div>
    </div>
  );
}

function PlayerPool({ title, players, colorSet, isAssigned }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-tight">{title}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((name: string) => (
          <DraggablePlayer key={name} name={name} colorSet={colorSet} disabled={isAssigned(name)} />
        ))}
      </div>
    </div>
  );
}

function DraggablePlayer({ name, colorSet, disabled }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: name, disabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...(!disabled ? listeners : {})} {...(!disabled ? attributes : {})}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 border transition-all
        ${disabled ? 'bg-slate-50 border-slate-100 text-slate-300 opacity-40' : `${colorSet.bg50} ${colorSet.border200} hover:border-slate-400 shadow-sm cursor-grab active:cursor-grabbing`}`}
    >
      {!disabled && <GripVertical className="w-3 h-3 text-slate-400" />}
      {name}
    </div>
  );
}

function DroppableInput({ id, value, colorSet, onClear, onChange, isBench }: any) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`relative flex items-center gap-2 p-1 rounded-xl transition-all border-2 
      ${isOver ? 'border-dashed border-blue-400 bg-blue-50' : 'border-transparent'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isBench ? 'bg-slate-100 text-slate-400' : colorSet.bg100 + ' ' + colorSet.text600}`}>
        <User className="w-4 h-4" />
      </div>
      <div className="relative flex-1 group">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={isBench ? "Сэлгээ..." : "Нэр..."}
          className={`h-10 text-xs border-none bg-slate-50/50 focus-visible:ring-1 font-medium pr-8 ${isBench ? 'italic' : ''}`} />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <button onClick={onClear} className="w-5 h-5 flex items-center justify-center bg-white rounded border border-slate-200 text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          ) : <Edit2 className="w-3 h-3 text-slate-200 group-hover:text-slate-400" />}
        </div>
      </div>
    </div>
  );
}