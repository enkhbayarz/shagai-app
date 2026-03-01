"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, History, Plus, User, X, Save, Target, 
  MapPin, Phone, Award, BabyIcon, ShieldCheck, Edit2, 
  Trash2, Map, ChevronDown, Medal, CalendarDays, ArrowLeft, Globe
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

const INITIAL_DATA = {
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
};

export default function ArchivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewYear = searchParams.get("view");
  
  const { isLoaded } = useUser();
  const saveArchive = useMutation(api.archives.create);
  const updateArchive = useMutation(api.archives.update);
  const savedArchives = useQuery(api.archives.get);
  const deleteArchive = useMutation(api.archives.remove);

  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [archiveData, setArchiveData] = useState(INITIAL_DATA);

  // --- SAFETY LOGIC: Guards ---

  useEffect(() => {
    if (isDirty) {
      const confirmLeave = window.confirm("Танд хадгалаагүй өөрчлөлт байна. Гарвал мэдээлэл устгах болно. Гарах уу?");
      if (!confirmLeave) return; 
    }
    setEditingId(null);
    setShowForm(false);
    setIsDirty(false);
    setArchiveData(INITIAL_DATA);
  }, [viewYear]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // --- Data Wrappers ---

  const updateGlobalData = (newData: typeof archiveData) => {
    setArchiveData(newData);
    setIsDirty(true);
  };

  const filteredList = useMemo(() => {
    if (!savedArchives) return [];
    if (!viewYear) return savedArchives;
    return savedArchives.filter((arc: any) => arc.startDate.startsWith(viewYear));
  }, [savedArchives, viewYear]);

  // --- Handlers ---

  const createTeam = () => {
    const newTeam: ArchiveTeam = {
      id: crypto.randomUUID(),
      name: "", contact: "", country: "Монгол", city: "", state: "",
      isEditing: true,
      players: [{ name: "", degree: "Цолгүй", age: "", country: "Монгол", city: "", state: "" }]
    };
    updateGlobalData({ ...archiveData, teams: [newTeam, ...archiveData.teams] });
  };

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) await updateArchive({ id: editingId as any, data: archiveData });
      else await saveArchive({ data: archiveData });
      setIsDirty(false);
      setEditingId(null);
      setShowForm(false);
      alert("Амжилттай хадгалагдлаа!");
    } catch (e) { alert("Алдаа гарлаа"); }
    finally { setIsSaving(false); }
  };

  if (!isLoaded) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Ачаалж байна...</div>;

  const shouldDisplayForm = editingId || (!viewYear) || showForm;

  return (
    <div className="min-h-screen px-4 py-6 bg-slate-50/50">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-600" />
            <h1 className="font-display text-2xl font-bold uppercase text-slate-800 tracking-tighter">
              {viewYear ? `${viewYear} Оны Архив` : "Тэмцээн Бүртгэл"}
            </h1>
          </div>
          {isDirty && (
            <span className="text-[9px] bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-black animate-pulse">ХАДГАЛААГҮЙ</span>
          )}
        </header>

        {/* --- VIEW MODE --- */}
        {viewYear && !editingId && !showForm && (
          <div className="space-y-4 mb-20">
            <Button onClick={() => setShowForm(true)} className="w-full h-14 bg-slate-900 text-white rounded-2xl shadow-lg font-bold gap-2">
              <Plus className="w-5 h-5" /> ШИНЭ ТЭМЦЭЭН НЭМЭХ
            </Button>
            <div className="space-y-3">
              {filteredList.map((arc: any) => (
                <Card key={arc._id} className="p-4 border-slate-200 cursor-pointer group" onClick={() => { setEditingId(arc._id); setArchiveData(arc); setIsDirty(false); }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-emerald-700">{arc.title}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{arc.startDate} • {arc.locationName}</p>
                    </div>
                    <Edit2 className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- FORM MODE --- */}
        <AnimatePresence>
          {shouldDisplayForm && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24">
              
              {/* SECTION 1: GENERAL INFO */}
              <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4" /> Ерөнхий мэдээлэл
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => { if(isDirty && !confirm("Цуцлах уу? Өөрчлөлт устах болно.")) return; setIsDirty(false); setEditingId(null); setShowForm(false); }} className="h-6 text-[10px] text-red-500 font-bold">БОЛИХ</Button>
                </div>

                <Input placeholder="Тэмцээний нэр *" value={archiveData.title} onChange={e => updateGlobalData({...archiveData, title: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <Input className="pl-9" placeholder="Зохион байгуулагч" value={archiveData.organizerName} onChange={e => updateGlobalData({...archiveData, organizerName: e.target.value})} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Утас" value={archiveData.organizerContact} onChange={e => updateGlobalData({...archiveData, organizerContact: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={archiveData.startDate} onChange={e => updateGlobalData({...archiveData, startDate: e.target.value})} />
                  <Input type="date" value={archiveData.endDate} onChange={e => updateGlobalData({...archiveData, endDate: e.target.value})} />
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Байршил / Заалны нэр" value={archiveData.locationName} onChange={e => updateGlobalData({...archiveData, locationName: e.target.value})} />
                  </div>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9 text-xs" placeholder="Google Map Link" value={archiveData.mapAddress} onChange={e => updateGlobalData({...archiveData, mapAddress: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Улс" value={archiveData.country} onChange={e => updateGlobalData({...archiveData, country: e.target.value})} />
                    <Input placeholder="Хот" value={archiveData.city} onChange={e => updateGlobalData({...archiveData, city: e.target.value})} />
                    <Input placeholder="Аймаг" value={archiveData.state} onChange={e => updateGlobalData({...archiveData, state: e.target.value})} />
                  </div>
                </div>
              </section>

              {/* SECTION 2: TEAMS & PLAYERS */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Багийн бүртгэл ({archiveData.teams.length})</h2>
                  <Button onClick={createTeam} size="sm" className="h-7 bg-slate-900 text-[10px] font-bold rounded-full">+ БАГ НЭМЭХ</Button>
                </div>

                <div className="space-y-3">
                  {archiveData.teams.map((team, tIdx) => (
                    <Card key={team.id} className="overflow-hidden border-slate-200 shadow-sm">
                      <div className={`p-2 flex justify-between items-center ${team.isEditing ? "bg-slate-900" : "bg-slate-50"}`}>
                        {team.isEditing ? (
                          <Input className="h-8 bg-transparent text-white border-none font-bold focus-visible:ring-0" placeholder="Багийн нэр..." value={team.name} onChange={e => {
                            const newTeams = [...archiveData.teams];
                            newTeams[tIdx].name = e.target.value;
                            updateGlobalData({...archiveData, teams: newTeams});
                          }} />
                        ) : <span className="font-bold text-sm px-3">{team.name}</span>}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            const newTeams = [...archiveData.teams];
                            newTeams[tIdx].isEditing = !newTeams[tIdx].isEditing;
                            updateGlobalData({...archiveData, teams: newTeams});
                          }} className="text-emerald-400 font-bold h-8">{team.isEditing ? "OK" : "Засах"}</Button>
                          <Button variant="ghost" size="sm" onClick={() => updateGlobalData({...archiveData, teams: archiveData.teams.filter(t => t.id !== team.id)})} className="text-red-400 h-8"><X className="w-4 h-4"/></Button>
                        </div>
                      </div>

                      {team.isEditing && (
                        <CardContent className="p-4 bg-white space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <Input className="h-8 text-[11px]" placeholder="Улс" value={team.country} onChange={e => {
                              const nt = [...archiveData.teams]; nt[tIdx].country = e.target.value; updateGlobalData({...archiveData, teams: nt});
                            }} />
                            <Input className="h-8 text-[11px]" placeholder="Хот" value={team.city} onChange={e => {
                              const nt = [...archiveData.teams]; nt[tIdx].city = e.target.value; updateGlobalData({...archiveData, teams: nt});
                            }} />
                            <Input className="h-8 text-[11px]" placeholder="Аймаг" value={team.state} onChange={e => {
                              const nt = [...archiveData.teams]; nt[tIdx].state = e.target.value; updateGlobalData({...archiveData, teams: nt});
                            }} />
                          </div>
                          
                          <div className="space-y-3 border-t pt-3">
                            {team.players.map((p, pIdx) => (
                              <div key={pIdx} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="relative">
                                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                  <Input className="h-8 pl-8 text-xs" placeholder="Харваачийн нэр" value={p.name} onChange={e => {
                                    const nt = [...archiveData.teams]; nt[tIdx].players[pIdx].name = e.target.value; updateGlobalData({...archiveData, teams: nt});
                                  }} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative">
                                    <Award className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <select className="w-full pl-8 h-8 text-[10px] bg-white border border-slate-200 rounded-md outline-none" value={p.degree} onChange={e => {
                                      const nt = [...archiveData.teams]; nt[tIdx].players[pIdx].degree = e.target.value; updateGlobalData({...archiveData, teams: nt});
                                    }}>
                                      {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                  </div>
                                  <div className="relative">
                                    <BabyIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <Input className="h-8 pl-8 text-xs" placeholder="Нас" value={p.age} onChange={e => {
                                      const nt = [...archiveData.teams]; nt[tIdx].players[pIdx].age = e.target.value; updateGlobalData({...archiveData, teams: nt});
                                    }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <Button variant="ghost" className="w-full h-8 text-[10px] border-dashed border text-slate-500" onClick={() => {
                              const nt = [...archiveData.teams]; 
                              nt[tIdx].players.push({ name: "", degree: "Цолгүй", age: "", country: "Монгол", city: "", state: "" }); 
                              updateGlobalData({...archiveData, teams: nt});
                            }}>+ ХАРВААЧ НЭМЭХ</Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </section>

              {/* SECTION 3: RANKINGS */}
              <section className="space-y-4">
                 <RankingCard title="Багийн дүн" icon={<Medal className="w-4 h-4 text-amber-500"/>} data={archiveData.teamRankings} onChange={(d:any) => updateGlobalData({...archiveData, teamRankings: d})} />
                 <RankingCard title="Цуваа дүн" icon={<User className="w-4 h-4 text-blue-500"/>} data={archiveData.individualRankings} onChange={(d:any) => updateGlobalData({...archiveData, individualRankings: d})} />
              </section>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                <Button onClick={handleGlobalSave} disabled={isSaving || !archiveData.title} className="flex-1 h-16 bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-100 transition-transform active:scale-95">
                  <Save className="w-6 h-6 mr-2" /> {isSaving ? "ХАДГАЛЖ БАЙНА..." : "МЭДЭЭЛЛИЙГ ХАДГАЛАХ"}
                </Button>
                {editingId && (
                  <Button variant="destructive" className="h-16 w-16 rounded-2xl shadow-xl shadow-red-100 transition-transform active:scale-95" onClick={async () => {
                    if(confirm("Устгахдаа итгэлтэй байна уу?")) {
                      await deleteArchive({ id: editingId as any });
                      setIsDirty(false); setEditingId(null);
                    }
                  }}><Trash2 className="w-6 h-6" /></Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Internal Helper Components ---

function RankingCard({ title, icon, data, onChange }: any) {
  const up = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">{icon} {title}</h3>
      <div className="space-y-3">
        <RankInput label="Алтан медаль" color="text-amber-500" value={data.gold} onChange={v => up('gold', v)} />
        <RankInput label="Мөнгөн медаль" color="text-slate-400" value={data.silver} onChange={v => up('silver', v)} />
        <RankInput label="Хүрэл медаль" color="text-orange-600" value={data.bronze} onChange={v => up('bronze', v)} />
      </div>
    </div>
  );
}

function RankInput({ label, color, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <p className={`text-[8px] font-bold uppercase ml-1 ${color}`}>{label}</p>
      <div className="relative">
        <Medal className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${color}`} />
        <Input placeholder="Нэр оруулах..." className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-100 focus-visible:ring-emerald-500" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}