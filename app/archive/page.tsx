"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, History, Plus, User, X, Save, Target, 
  MapPin, Phone, Award, BabyIcon, ShieldCheck, Edit2, 
  Trash2, Map, ChevronDown
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Constants ---

const DEGREES = [
  "Цолгүй", 
  "Аймгийн Дэд Мэргэн", 
  "Аймгийн Мэргэн", 
  "Аймгийн Гоц Мэргэн",
  "Улсын Өсөх Идэр Мэргэн", 
  "Хүндэт Харваач", 
  "Улсын Харьшгүй Мэргэн", 
  "Улсын Мэргэн", 
  "Улсын Хошой Мэргэн", 
  "Улсын Гарамгай Мэргэн", 
  "Улсын Дархан Мэргэн", 
  "Улсын Үлэмж Дархан Мэргэн",
  "Улсын Даяар Дуурсах Дархан Мэргэн"
];

// --- Types ---

interface ArchivePlayer {
  name: string;
  degree: string;
  age: string;
  country: string;
  city: string;
  state: string;
}

interface ArchiveTeam {
  id: string;
  name: string;
  contact: string;
  country: string;
  city: string;
  state: string;
  players: ArchivePlayer[];
  isEditing: boolean;
}

export default function ArchivePage() {
  const { isLoaded } = useUser();
  const saveArchive = useMutation(api.archives.create);
  const updateArchive = useMutation(api.archives.update);
  const savedArchives = useQuery(api.archives.get);
  const deleteArchive = useMutation(api.archives.remove);

  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [archiveData, setArchiveData] = useState({
    title: "",
    organizerName: "",
    organizerContact: "",
    startDate: "",
    endDate: "",
    locationName: "",
    mapAddress: "",
    country: "",
    city: "",
    state: "",
    teams: [] as ArchiveTeam[],
    teamRankings: { gold: "", silver: "", bronze: "" },
    individualRankings: { gold: "", silver: "", bronze: "" },
  });

  // --- Logic Functions ---

  const resetForm = () => {
    setEditingId(null);
    setArchiveData({
      title: "", organizerName: "", organizerContact: "", startDate: "", endDate: "",
      locationName: "", mapAddress: "", country: "", city: "", state: "",
      teams: [], teamRankings: { gold: "", silver: "", bronze: "" },
      individualRankings: { gold: "", silver: "", bronze: "" },
    });
  };

  const isTeamNameDuplicate = (name: string, currentId: string) => {
    if (!name.trim()) return false;
    return archiveData.teams.some(
      (t) => t.name.toLowerCase().trim() === name.toLowerCase().trim() && t.id !== currentId
    );
  };

  const createTeam = () => {
    const newTeam: ArchiveTeam = {
      id: crypto.randomUUID(),
      name: "", contact: "", country: "", city: "", state: "",
      isEditing: true,
      players: [{ name: "", degree: "Цолгүй", age: "", country: "", city: "", state: "" }]
    };
    setArchiveData({ ...archiveData, teams: [newTeam, ...archiveData.teams] });
  };

  const updateTeamField = (id: string, field: keyof ArchiveTeam, val: any) => {
    setArchiveData({
      ...archiveData,
      teams: archiveData.teams.map(t => t.id === id ? { ...t, [field]: val } : t)
    });
  };

  const updatePlayerField = (tId: string, pIdx: number, field: keyof ArchivePlayer, val: string) => {
    setArchiveData({
      ...archiveData,
      teams: archiveData.teams.map(t => {
        if (t.id === tId) {
          const newPlayers = [...t.players];
          newPlayers[pIdx] = { ...newPlayers[pIdx], [field]: val };
          return { ...t, players: newPlayers };
        }
        return t;
      })
    });
  };

  const isFormValid = useMemo(() => {
    const hasBasic = archiveData.title.trim() !== "" && archiveData.organizerName.trim() !== "" && archiveData.startDate !== "";
    const hasTeams = archiveData.teams.length > 0 && archiveData.teams.every(t => t.name.trim() !== "" && !t.isEditing);
    return hasBasic && hasTeams;
  }, [archiveData]);

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        await updateArchive({ id: editingId as any, data: archiveData });
      } else {
        await saveArchive({ data: archiveData });
      }
      alert("Амжилттай хадгалагдлаа!");
      resetForm();
    } catch (e) { alert("Алдаа гарлаа"); }
    finally { setIsSaving(false); }
  };

  const handleDeleteArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Та энэ тэмцээнийг архиваас бүрмөсөн устгахдаа итгэлтэй байна уу?")) {
      try {
        await deleteArchive({ id: id as any });
        if (editingId === id) resetForm();
        alert("Амжилттай устгагдлаа.");
      } catch (error) { alert("Устгахад алдаа гарлаа."); }
    }
  };

  if (!isLoaded) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Ачаалж байна...</div>;

  return (
    <div className="min-h-screen px-4 py-6 bg-slate-50/50">
      <header className="flex items-center justify-between mb-6 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-600" />
          <h1 className="font-display text-2xl font-bold uppercase text-slate-800 tracking-tighter">Тэмцээний Архив</h1>
        </div>
        {editingId && (
          <Button variant="ghost" size="sm" onClick={resetForm} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50">
            ШИНЭЭР НЭМЭХ
          </Button>
        )}
      </header>

      <div className="max-w-md mx-auto space-y-8 pb-20">
        
        {/* TOURNAMENT INFO */}
        <section className="space-y-3 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest px-1">
            <History className="w-4 h-4" /> Ерөнхий мэдээлэл
          </h2>
          <Input placeholder="Тэмцээний нэр *" value={archiveData.title} onChange={e => setArchiveData({...archiveData, title: e.target.value})} />
          
          <div className="grid grid-cols-1 gap-2 py-2 border-y border-slate-50">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <Input className="pl-9 bg-slate-50/50" placeholder="Зохион байгуулагч *" value={archiveData.organizerName} onChange={e => setArchiveData({...archiveData, organizerName: e.target.value})} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9 bg-slate-50/50" placeholder="Утас" value={archiveData.organizerContact} onChange={e => setArchiveData({...archiveData, organizerContact: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] ml-1 text-slate-400 font-bold uppercase">Эхлэх *</label>
              <Input type="date" value={archiveData.startDate} onChange={e => setArchiveData({...archiveData, startDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] ml-1 text-slate-400 font-bold uppercase">Дуусах</label>
              <Input type="date" value={archiveData.endDate} onChange={e => setArchiveData({...archiveData, endDate: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t mt-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="Байршил *" value={archiveData.locationName} onChange={e => setArchiveData({...archiveData, locationName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Хот" value={archiveData.city} onChange={e => setArchiveData({...archiveData, city: e.target.value})} />
              <Input placeholder="Аймаг" value={archiveData.state} onChange={e => setArchiveData({...archiveData, state: e.target.value})} />
            </div>
          </div>
        </section>

        {/* TEAMS CRUD */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Users className="w-4 h-4" /> Багийн бүртгэл ({archiveData.teams.length})
            </h2>
            <Button onClick={createTeam} size="sm" className="h-7 bg-slate-900 text-[10px] font-bold rounded-full hover:bg-black">
              <Plus className="w-3 h-3 mr-1" /> БАГ НЭМЭХ
            </Button>
          </div>

          <div className="space-y-3">
            {archiveData.teams.map((team) => {
              const duplicateError = isTeamNameDuplicate(team.name, team.id);
              const canConfirm = team.name.trim() !== "" && !duplicateError;

              return (
                <Card key={team.id} className={`overflow-hidden border-slate-200 shadow-sm transition-all ${
                  team.isEditing ? (duplicateError ? "ring-2 ring-red-500" : "ring-2 ring-emerald-500/20") : "bg-white"
                }`}>
                  <div className={`p-2 flex justify-between items-center gap-2 ${
                    team.isEditing ? (duplicateError ? "bg-red-50" : "bg-slate-900") : "bg-slate-50"
                  }`}>
                    {team.isEditing ? (
                      <div className="flex-1">
                        <Input 
                          placeholder="Багийн нэр *" value={team.name}
                          className={`h-8 bg-transparent border-none font-bold p-1 focus-visible:ring-0 ${
                            duplicateError ? "text-red-600 placeholder:text-red-300" : "text-white placeholder:text-slate-500"
                          }`}
                          onChange={e => updateTeamField(team.id, 'name', e.target.value)}
                        />
                        {duplicateError && <p className="text-[8px] text-red-500 font-bold px-1 uppercase">Нэр давхардаж байна!</p>}
                      </div>
                    ) : (
                      <span className="font-bold text-sm text-slate-700 px-2">{team.name}</span>
                    )}
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" size="sm" 
                        disabled={team.isEditing && !canConfirm}
                        onClick={() => updateTeamField(team.id, 'isEditing', !team.isEditing)} 
                        className={`h-8 px-2 ${team.isEditing ? (canConfirm ? "text-emerald-400" : "text-slate-500") : "text-slate-400"}`}
                      >
                        {team.isEditing ? <><ShieldCheck className="w-4 h-4 mr-1"/> OK</> : <><Edit2 className="w-3 h-3 mr-1"/> Засах</>}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 h-8 w-8 p-0" onClick={() => setArchiveData({...archiveData, teams: archiveData.teams.filter(t => t.id !== team.id)})}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {team.isEditing && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <CardContent className="p-4 space-y-4">
                          <Input className="h-8 text-xs" placeholder="Багийн холбоо барих утас" value={team.contact} onChange={e => updateTeamField(team.id, 'contact', e.target.value)} />
                          
                          <div className="space-y-3">
                            {team.players.map((p, pIdx) => (
                              <div key={pIdx} className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                  <span className="text-[10px] font-black text-blue-600 uppercase">Харваач {pIdx+1}</span>
                                  {team.players.length > 1 && (
                                    <button onClick={() => {
                                      const newPlayers = team.players.filter((_, i) => i !== pIdx);
                                      updateTeamField(team.id, 'players', newPlayers);
                                    }} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3"/></button>
                                  )}
                                </div>

                                <ArchivePlayerInput value={p.name} placeholder="Овог Нэр *" icon={<User className="w-3 h-3"/>} onChange={(v:string) => updatePlayerField(team.id, pIdx, 'name', v)} />
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative flex items-center">
                                    <Award className="absolute left-2.5 w-3 h-3 text-slate-400 z-10" />
                                    <select
                                      value={p.degree}
                                      onChange={(e) => updatePlayerField(team.id, pIdx, 'degree', e.target.value)}
                                      className="w-full pl-8 h-8 text-[11px] bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer outline-none"
                                    >
                                      {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 w-3 h-3 text-slate-300 pointer-events-none" />
                                  </div>
                                  <ArchivePlayerInput type="number" value={p.age} placeholder="Нас" icon={<BabyIcon className="w-3 h-3"/>} onChange={(v:string) => updatePlayerField(team.id, pIdx, 'age', v)} />
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button variant="ghost" className="w-full h-9 text-[10px] border-dashed border-slate-300 text-slate-500 hover:bg-slate-50" onClick={() => updateTeamField(team.id, 'players', [...team.players, { name: "", degree: "Цолгүй", age: "", country: "", city: "", state: "" }])}>
                            + ХАРВААЧ НЭМЭХ
                          </Button>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </section>

        {/* GLOBAL ACTION */}
        <Button 
          onClick={handleGlobalSave} disabled={!isFormValid || isSaving}
          className={`w-full h-16 font-bold text-lg rounded-2xl shadow-xl transition-all ${isFormValid ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
        >
          <Save className="w-6 h-6 mr-2" />
          {isSaving ? "ТҮР ХҮЛЭЭНЭ ҮҮ..." : editingId ? "ӨӨРЧЛӨЛТИЙГ ХАДГАЛАХ" : "АРХИВЫГ ХАДГАЛАХ"}
        </Button>

        {/* LIST OF SAVED ARCHIVES */}
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Хадгалагдсан тэмцээнүүд</h2>
          <div className="space-y-2">
            {savedArchives?.map((arc: any) => (
              <Card 
                key={arc._id} 
                className={`p-4 flex justify-between items-center cursor-pointer transition-all hover:bg-slate-50 ${editingId === arc._id ? "border-blue-500 bg-blue-50/30 shadow-inner" : "bg-white"}`}
                onClick={() => {
                  setEditingId(arc._id);
                  setArchiveData({...arc, teams: arc.teams.map((t:any) => ({...t, isEditing: false}))});
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 leading-tight">{arc.title}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">{arc.startDate} • {arc.teams.length} баг</p>
                </div>
                <div className="flex items-center gap-2">
                  <Edit2 className={`w-4 h-4 ${editingId === arc._id ? "text-blue-500" : "text-slate-300"}`} />
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={(e) => handleDeleteArchive(e, arc._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ArchivePlayerInput({ value, placeholder, icon, onChange, type = "text" }: any) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-2.5 text-slate-400 pointer-events-none">{icon}</div>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8 h-8 text-[11px] bg-white border-slate-200 focus-visible:ring-emerald-500" />
    </div>
  );
}