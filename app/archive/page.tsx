"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, History, Plus, User, X, Save, Target, 
  MapPin, Phone, Award, BabyIcon, ShieldCheck, Edit2, 
  Trash2, Map, ChevronDown, Medal, Globe
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Constants ---

const DEGREES = [
  "Цолгүй", "Аймгийн Дэд Мэргэн", "Аймгийн Мэргэн", "Аймгийн Гоц Мэргэн",
  "Улсын Өсөх Идэр Мэргэн", "Хүндэт Харваач", "Улсын Харьшгүй Мэргэн", 
  "Улсын Мэргэн", "Улсын Хошой Мэргэн", "Улсын Гарамгай Мэргэн", 
  "Улсын Дархан Мэргэн", "Улсын Үлэмж Дархан Мэргэн",
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
    country: "Монгол",
    city: "",
    state: "",
    teams: [] as ArchiveTeam[],
    teamRankings: { gold: "", silver: "", bronze: "" },
    individualRankings: { gold: "", silver: "", bronze: "" },
  });

  // --- Logic ---

  const resetForm = () => {
    setEditingId(null);
    setArchiveData({
      title: "", organizerName: "", organizerContact: "", startDate: "", endDate: "",
      locationName: "", mapAddress: "", country: "Монгол", city: "", state: "",
      teams: [], teamRankings: { gold: "", silver: "", bronze: "" },
      individualRankings: { gold: "", silver: "", bronze: "" },
    });
  };

  const isTeamNameDuplicate = (name: string, currentId: string) => {
    if (!name.trim()) return false;
    return archiveData.teams.some(t => t.name.toLowerCase().trim() === name.toLowerCase().trim() && t.id !== currentId);
  };

  const createTeam = () => {
    const newTeam: ArchiveTeam = {
      id: crypto.randomUUID(),
      name: "", contact: "", country: "Монгол", city: "", state: "",
      isEditing: true,
      players: [{ name: "", degree: "Цолгүй", age: "", country: "Монгол", city: "", state: "" }]
    };
    setArchiveData({ ...archiveData, teams: [newTeam, ...archiveData.teams] });
  };

  const updateTeamField = (id: string, field: keyof ArchiveTeam, val: any) => {
    setArchiveData({ ...archiveData, teams: archiveData.teams.map(t => t.id === id ? { ...t, [field]: val } : t) });
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
    return archiveData.title.trim() !== "" && archiveData.startDate !== "" && archiveData.teams.length > 0 && archiveData.teams.every(t => !t.isEditing);
  }, [archiveData]);

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) await updateArchive({ id: editingId as any, data: archiveData });
      else await saveArchive({ data: archiveData });
      alert("Амжилттай хадгалагдлаа!");
      resetForm();
    } catch (e) { alert("Алдаа гарлаа"); }
    finally { setIsSaving(false); }
  };

  if (!isLoaded) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Ачаалж байна...</div>;

  return (
    <div className="min-h-screen px-4 py-6 bg-slate-50/50">
      <header className="flex items-center justify-between mb-6 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-600" />
          <h1 className="font-display text-2xl font-bold uppercase text-slate-800 tracking-tighter">Тэмцээний Архив</h1>
        </div>
        {editingId && <Button variant="ghost" size="sm" onClick={resetForm} className="text-[10px] font-bold text-blue-600">ШИНЭЭР НЭМЭХ</Button>}
      </header>

      <div className="max-w-md mx-auto space-y-8 pb-20">
        
        {/* SECTION 1: TOURNAMENT INFO */}
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
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Улс" value={archiveData.country} onChange={e => setArchiveData({...archiveData, country: e.target.value})} />
              <Input placeholder="Хот" value={archiveData.city} onChange={e => setArchiveData({...archiveData, city: e.target.value})} />
              <Input placeholder="Аймаг" value={archiveData.state} onChange={e => setArchiveData({...archiveData, state: e.target.value})} />
            </div>
          </div>
        </section>

        {/* SECTION 2: TEAMS */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Users className="w-4 h-4" /> Багийн бүртгэл ({archiveData.teams.length})
            </h2>
            <Button onClick={createTeam} size="sm" className="h-7 bg-slate-900 text-[10px] font-bold rounded-full">
              <Plus className="w-3 h-3 mr-1" /> БАГ НЭМЭХ
            </Button>
          </div>

          <div className="space-y-3">
            {archiveData.teams.map((team) => {
              const duplicateError = isTeamNameDuplicate(team.name, team.id);
              return (
                <Card key={team.id} className={`overflow-hidden border-slate-200 shadow-sm ${team.isEditing ? "ring-2 ring-emerald-500/20" : "bg-white"}`}>
                  <div className={`p-2 flex justify-between items-center gap-2 ${team.isEditing ? "bg-slate-900" : "bg-slate-50"}`}>
                    {team.isEditing ? (
                      <Input 
                        placeholder="Багийн нэр *" value={team.name}
                        className={`h-8 bg-transparent border-none font-bold p-1 focus-visible:ring-0 ${duplicateError ? "text-red-400" : "text-white"}`}
                        onChange={e => updateTeamField(team.id, 'name', e.target.value)}
                      />
                    ) : (
                      <span className="font-bold text-sm text-slate-700 px-2">{team.name}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" disabled={team.isEditing && (!team.name.trim() || duplicateError)} onClick={() => updateTeamField(team.id, 'isEditing', !team.isEditing)} className="text-emerald-400 h-8">
                        {team.isEditing ? "OK" : <Edit2 className="w-3 h-3"/>}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setArchiveData({...archiveData, teams: archiveData.teams.filter(t => t.id !== team.id)})} className="text-slate-400 h-8"><X className="w-4 h-4"/></Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {team.isEditing && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                             <Input className="h-8 text-[11px]" placeholder="Улс" value={team.country} onChange={e => updateTeamField(team.id, 'country', e.target.value)} />
                             <Input className="h-8 text-[11px]" placeholder="Хот" value={team.city} onChange={e => updateTeamField(team.id, 'city', e.target.value)} />
                             <Input className="h-8 text-[11px]" placeholder="Аймаг" value={team.state} onChange={e => updateTeamField(team.id, 'state', e.target.value)} />
                          </div>
                          
                          <div className="space-y-3">
                            {team.players.map((p, pIdx) => (
                              <div key={pIdx} className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <ArchivePlayerInput value={p.name} placeholder="Харваачийн нэр *" icon={<User className="w-3 h-3"/>} onChange={(v:string) => updatePlayerField(team.id, pIdx, 'name', v)} />
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative flex items-center">
                                    <Award className="absolute left-2.5 w-3 h-3 text-slate-400" />
                                    <select value={p.degree} onChange={(e) => updatePlayerField(team.id, pIdx, 'degree', e.target.value)} className="w-full pl-8 h-8 text-[11px] bg-white border border-slate-200 rounded-md outline-none appearance-none"><ChevronDown className="absolute right-2 w-3 h-3 text-slate-300" />
                                      {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                  </div>
                                  <ArchivePlayerInput type="number" value={p.age} placeholder="Нас" icon={<BabyIcon className="w-3 h-3"/>} onChange={(v:string) => updatePlayerField(team.id, pIdx, 'age', v)} />
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <Input className="h-7 text-[10px]" placeholder="Улс" value={p.country} onChange={e => updatePlayerField(team.id, pIdx, 'country', e.target.value)} />
                                  <Input className="h-7 text-[10px]" placeholder="Хот" value={p.city} onChange={e => updatePlayerField(team.id, pIdx, 'city', e.target.value)} />
                                  <Input className="h-7 text-[10px]" placeholder="Аймаг" value={p.state} onChange={e => updatePlayerField(team.id, pIdx, 'state', e.target.value)} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button variant="ghost" className="w-full h-8 text-[10px] border-dashed border" onClick={() => updateTeamField(team.id, 'players', [...team.players, { name: "", degree: "Цолгүй", age: "", country: "Монгол", city: "", state: "" }])}>+ ХАРВААЧ НЭМЭХ</Button>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: RANKINGS */}
        <section className="grid grid-cols-1 gap-4">
          <RankingBlock title="Багийн харваа" icon={<Medal className="w-4 h-4 text-amber-500"/>} data={archiveData.teamRankings} setData={(d:any) => setArchiveData({...archiveData, teamRankings: d})} />
          <RankingBlock title="Цуваа харваа" icon={<User className="w-4 h-4 text-blue-500"/>} data={archiveData.individualRankings} setData={(d:any) => setArchiveData({...archiveData, individualRankings: d})} />
        </section>

        <Button onClick={handleGlobalSave} disabled={!isFormValid || isSaving} className={`w-full h-16 font-bold text-lg rounded-2xl shadow-xl transition-all ${isFormValid ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"}`}>
          <Save className="w-6 h-6 mr-2" /> {isSaving ? "ТҮР ХҮЛЭЭНЭ ҮҮ..." : editingId ? "ӨӨРЧЛӨЛТИЙГ ХАДГАЛАХ" : "АРХИВЫГ ХАДГАЛАХ"}
        </Button>

        {/* SAVED LIST */}
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Хадгалагдсан тэмцээнүүд</h2>
          {savedArchives?.map((arc: any) => (
            <Card key={arc._id} className={`p-4 flex justify-between items-center cursor-pointer ${editingId === arc._id ? "border-blue-500 bg-blue-50/30" : "bg-white"}`} onClick={() => { setEditingId(arc._id); setArchiveData({...arc, teams: arc.teams.map((t:any) => ({...t, isEditing: false}))}); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{arc.title}</h3>
                <p className="text-[10px] text-slate-500 uppercase">{arc.startDate} • {arc.country} • {arc.teams.length} баг</p>
              </div>
              <div className="flex gap-2">
                <Edit2 className="w-4 h-4 text-slate-300" />
                <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); if(confirm("Устгах уу?")) deleteArchive({ id: arc._id as any }); }} />
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}

// --- Helpers ---

function ArchivePlayerInput({ value, placeholder, icon, onChange, type = "text" }: any) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-2.5 text-slate-400">{icon}</div>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8 h-8 text-[11px] bg-white border-slate-200" />
    </div>
  );
}

function RankingBlock({ title, icon, data, setData }: any) {
  const update = (key: string, val: string) => setData({ ...data, [key]: val });
  return (
    <div className="space-y-3 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">{icon} {title}</h2>
      <div className="space-y-2">
        <RankingField label="Алтан медаль" color="text-amber-500" value={data.gold} onChange={(v) => update('gold', v)} />
        <RankingField label="Мөнгөн медаль" color="text-slate-400" value={data.silver} onChange={(v) => update('silver', v)} />
        <RankingField label="Хүрэл медаль" color="text-orange-600" value={data.bronze} onChange={(v) => update('bronze', v)} />
      </div>
    </div>
  );
}

function RankingField({ label, color, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className={`text-[8px] font-bold uppercase ml-1 ${color}`}>{label}</label>
      <div className="relative flex items-center">
        <Medal className={`absolute left-2.5 w-3 h-3 ${color}`} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Нэр..." className="pl-8 h-8 text-xs bg-slate-50 border-slate-100" />
      </div>
    </div>
  );
}