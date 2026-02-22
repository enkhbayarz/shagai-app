"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Target, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

interface AppShellProps {
  children: React.ReactNode;
  collapsed?: boolean;
}

export function AppShell({ children, collapsed = false }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - hide action buttons when collapsed (game mode) */}
      <header className="lg:hidden sticky top-0 z-20 bg-background border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg"
              aria-label={sidebarOpen ? "Цэс хаах" : "Цэс нээх"}
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/app_icon.svg" alt="Шагай" className="w-6 h-6 rounded-md" />
              <span className="font-display text-lg tracking-wider">ШАГАЙ</span>
            </div>
          </div>
          <div id="header-action" />
        </div>
        {/* Mobile Action Buttons - only show when not in collapsed/game mode */}
        {!collapsed && (
          <div className="px-4 pb-3 flex gap-2">
            <SignedIn>
              <Link href="/team/setup" className="flex-1">
                <Button className="w-full gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-sm">
                  <Crosshair className="w-4 h-4" />
                  Багийн
                </Button>
              </Link>
              <Link href="/series/setup" className="flex-1">
                <Button variant="outline" className="w-full gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  Цуваа
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-sm">
                  <Crosshair className="w-4 h-4" />
                  Багийн
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button variant="outline" className="flex-1 gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  Цуваа
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar - collapsed or expanded */}
        <aside className={`hidden lg:flex flex-col min-h-screen bg-background border-r sticky top-0 ${
          collapsed ? "w-16" : "w-64"
        }`}>
          <Sidebar collapsed={collapsed} />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30"
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-background shadow-xl pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <img src="/app_icon.svg" alt="Шагай" className="w-6 h-6 rounded-md" />
                  <span className="font-display tracking-wider">ШАГАЙ</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg"
                  aria-label="Цэс хаах"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[calc(100dvh-57px)]">
                <Sidebar showHeader={false} onNavigate={() => setSidebarOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)]">
          {children}
        </main>
      </div>
    </div>
  );
}
