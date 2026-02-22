"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.getMe, clerkUser ? {} : "skip");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  // Collapsed sidebar - icons only
  if (collapsed) {
    return (
      <div className="flex flex-col h-full items-center py-4">
        {/* Logo Icon */}
        <Link href="/" className="mb-6">
          <img src="/app_icon.svg" alt="Шагай" className="w-10 h-10 rounded-lg" />
        </Link>

        {/* Navigation Icons */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleNavClick}
              title={item.label}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>

        {/* Profile Avatar */}
        <div className="mt-auto pt-4 border-t w-full flex justify-center">
          <Link
            href={currentUser?.username ? `/profile/${currentUser.username}` : "/settings"}
            title="Профайл"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {currentUser?.fullName?.charAt(0) || clerkUser?.firstName?.charAt(0) || "?"}
          </Link>
        </div>
      </div>
    );
  }

  // Expanded sidebar - full layout
  return (
    <div className="flex flex-col h-full">
      {/* Logo - only on desktop */}
      {showHeader && (
        <div className="px-4 py-4 flex items-center gap-2">
          <img src="/app_icon.svg" alt="Шагай" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-lg tracking-wider">ШАГАЙ</span>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className={`px-3 space-y-2 mb-4 ${!showHeader ? "pt-4" : ""}`}>
        <Link href="/team/setup" className="block" onClick={handleNavClick}>
          <Button className="w-full justify-start gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white">
            <Crosshair className="w-4 h-4" />
            Багийн Харваа
          </Button>
        </Link>
        <Link href="/series/setup" className="block" onClick={handleNavClick}>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Target className="w-4 h-4" />
            Цуваа Харваа
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section - User Profile */}
      <div className="mt-auto border-t pt-2 px-3 pb-3 relative">
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
            {currentUser?.fullName?.charAt(0) || clerkUser?.firstName?.charAt(0) || "?"}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium truncate">
              {currentUser?.fullName || clerkUser?.fullName || "Хэрэглэгч"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              @{currentUser?.username || "хэрэглэгч"}
            </div>
          </div>
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Profile Dropdown Menu */}
        {profileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border rounded-lg shadow-lg p-1 z-50">
            <Link
              href={currentUser?.username ? `/profile/${currentUser.username}` : "/settings"}
              onClick={() => {
                setProfileMenuOpen(false);
                handleNavClick();
              }}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <User className="w-4 h-4" />
              Профайл
            </Link>
            <Link
              href="/settings"
              onClick={() => {
                setProfileMenuOpen(false);
                handleNavClick();
              }}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Settings className="w-4 h-4" />
              Тохиргоо
            </Link>
            <SignOutButton>
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent text-red-500"
              >
                <LogOut className="w-4 h-4" />
                Гарах
              </button>
            </SignOutButton>
          </div>
        )}
      </div>
    </div>
  );
}
