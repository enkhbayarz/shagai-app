"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserSyncProvider } from "@/components/providers/UserSyncProvider";

// Routes that should have NO sidebar (truly full screen)
const FULL_SCREEN_ROUTES = [
  "/s/",
  "/team/s/",
  "/teams/join",
];

// Routes that should have COLLAPSED sidebar (icon-only)
const COLLAPSED_ROUTES = [
  "/series/setup",
  "/series/game",
  "/team/setup",
  "/team/game",
];

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Check if current route should be full screen (no sidebar at all)
  const isFullScreen = FULL_SCREEN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current route should have collapsed sidebar
  const isCollapsed = COLLAPSED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Full screen routes - no sidebar
  if (isFullScreen) {
    return <>{children}</>;
  }

  // Routes with sidebar (collapsed or expanded) - but need to handle signed out state
  return (
    <>
      <SignedIn>
        <UserSyncProvider>
          <AppShell collapsed={isCollapsed}>{children}</AppShell>
        </UserSyncProvider>
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

// Landing page for signed-out users
function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Auth Header */}
      <div className="absolute top-4 right-4">
        <div className="flex gap-2">
          <SignInButton mode="modal">
            <Button variant="outline" size="sm" className="touch-manipulation">
              Нэвтрэх
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className="bg-black text-white hover:bg-black/90 touch-manipulation"
            >
              Бүртгүүлэх
            </Button>
          </SignUpButton>
        </div>
      </div>

      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
          <svg
            className="w-14 h-14 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <h1 className="font-display text-6xl md:text-7xl tracking-widest leading-none">
          ШАГАЙ
        </h1>
        <h2 className="font-display text-4xl md:text-5xl tracking-[0.3em] text-black/70">
          ХАРВАА
        </h2>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <SignInButton mode="modal">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600"
          >
            Нэвтрэх
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg font-medium"
          >
            Бүртгүүлэх
          </Button>
        </SignUpButton>
      </div>

      {/* Footer */}
      <p className="mt-16 text-sm text-muted-foreground">v2.0</p>
    </div>
  );
}
