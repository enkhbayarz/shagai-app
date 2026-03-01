"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Radio,
  Users,
  History,
  Settings,
  Shield,
  Target,
  Crosshair,
  User,
  LogOut,
  MoreVertical,
  ChevronDown,
  CalendarDays,
  FolderArchive,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home, label: "Нүүр", href: "/" },
  { icon: Radio, label: "Шууд", href: "/live" },
  { icon: Users, label: "Баг", href: "/teams" },
  { icon: History, label: "Түүх", href: "/history" },
  { icon: Shield, label: "Админ", href: "/admin" },
];

interface SidebarProps {
  showHeader?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ showHeader = true, collapsed = false, onNavigate }: SidebarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentViewYear = searchParams.get("view");
  
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.getMe, clerkUser ? {} : "skip");
  
  // Fetch archives to build the year hierarchy
  const savedArchives = useQuery(api.archives.get);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Group archives by year extracted from startDate (YYYY-MM-DD)
  const archivesByYear = useMemo(() => {
    if (!savedArchives) return {};
    return savedArchives.reduce((acc: any, archive: any) => {
      const year = new Date(archive.startDate).getFullYear().toString();
      if (!acc[year]) acc[year] = [];
      acc[year].push(archive);
      return acc;
    }, {});
  }, [savedArchives]);

  const years = Object.keys(archivesByYear).sort((a, b) => b.localeCompare(a));

  const handleNavClick = () => {
    onNavigate?.();
  };

  // --- COLLAPSED VIEW (Icons Only) ---
  if (collapsed) {
    return (
      <div className="flex flex-col h-full items-center py-4 bg-background border-r">
        <Link href="/" className="mb-6">
          <img src="/app_icon.svg" alt="Шагай" className="w-10 h-10 rounded-lg" />
        </Link>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleNavClick}
              title={item.label}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                isActive(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
          <Link
            href="/archive"
            title="Архив"
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              pathname.startsWith("/archive") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <FolderArchive className="w-5 h-5" />
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t w-full flex justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {currentUser?.fullName?.charAt(0) || clerkUser?.firstName?.charAt(0) || "?"}
          </div>
        </div>
      </div>
    );
  }

  // --- EXPANDED VIEW (Full Sidebar) ---
  return (
    <div className="flex flex-col h-full bg-background border-r">
      {showHeader && (
        <div className="px-6 py-5 flex items-center gap-3">
          <img src="/app_icon.svg" alt="Шагай" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-xl tracking-tighter font-black text-slate-800">ШАГАЙ</span>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className={`px-4 space-y-2 mb-6 ${!showHeader ? "pt-4" : ""}`}>
        <Link href="/team/setup" className="block" onClick={handleNavClick}>
          <Button className="w-full justify-start gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 transition-all shadow-sm">
            <Crosshair className="w-4 h-4 text-orange-400" /> 
            <span className="text-sm font-bold">Багийн Харваа</span>
          </Button>
        </Link>
        <Link href="/series/setup" className="block" onClick={handleNavClick}>
          <Button variant="outline" className="w-full justify-start gap-3 border-slate-200 hover:bg-slate-50 rounded-xl h-11 transition-all">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-slate-700">Цуваа Харваа</span>
          </Button>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive(item.href) 
                ? "bg-emerald-50 text-emerald-700 font-bold" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.href) ? "text-emerald-600" : "text-slate-400"}`} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}

        {/* --- ARCHIVE HIERARCHY --- */}
        <div className="pt-2">
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              pathname.startsWith("/archive") 
                ? "bg-slate-100 text-slate-900 font-bold" 
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderArchive className={`w-5 h-5 ${pathname.startsWith("/archive") ? "text-slate-900" : "text-slate-400"}`} />
              <span className="text-sm">Архив</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${archiveOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {archiveOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="ml-6 mt-1 border-l-2 border-slate-100 pl-2 space-y-1">
                  {/* Option 1: Main Page (Create/New Mode) */}
                  <Link
                    href="/archive"
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      pathname === "/archive" && !currentViewYear
                        ? "text-emerald-600 bg-emerald-50/50" 
                        : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/30"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Шинэ тэмцээн
                  </Link>

                  {/* Option 2: Dynamic Year List (View Mode) */}
                  {years.map((year) => (
                    <Link
                      key={year}
                      href={`/archive?view=${year}`}
                      onClick={handleNavClick}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all ${
                        currentViewYear === year
                          ? "bg-white shadow-sm border border-slate-100 text-slate-900 font-bold" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDays className={`w-3.5 h-3.5 ${currentViewYear === year ? "text-blue-500" : "text-slate-300"}`} />
                        {year} Он
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">
                        {archivesByYear[year].length}
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* --- USER PROFILE SECTION --- */}
      <div className="mt-auto border-t p-4 relative">
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {currentUser?.fullName?.charAt(0) || clerkUser?.firstName?.charAt(0) || "?"}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-sm font-bold text-slate-800 truncate">
              {currentUser?.fullName || clerkUser?.fullName || "Хэрэглэгч"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">
              @{currentUser?.username || "user"}
            </div>
          </div>
          <MoreVertical className="w-4 h-4 text-slate-300" />
        </button>

        <AnimatePresence>
          {profileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-50"
            >
              <Link
                href={currentUser?.username ? `/profile/${currentUser.username}` : "/settings"}
                onClick={() => { setProfileMenuOpen(false); handleNavClick(); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-slate-50 text-slate-600"
              >
                <User className="w-4 h-4 text-slate-400" /> Профайл
              </Link>
              <Link
                href="/settings"
                onClick={() => { setProfileMenuOpen(false); handleNavClick(); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-slate-50 text-slate-600"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Тохиргоо
              </Link>
              <div className="h-px bg-slate-50 my-1 mx-2" />
              <SignOutButton>
                <button 
                  onClick={() => setProfileMenuOpen(false)} 
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Гарах
                </button>
              </SignOutButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}