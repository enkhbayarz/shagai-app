"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { PlayerRow } from "@/components/series/PlayerRow";
import { GameControls } from "@/components/series/GameControls";
import { FinishedModal } from "@/components/series/FinishedModal";

interface Player {
  name: string;
  shots: (boolean | null)[];
}

interface GameState {
  playerCount: number;
  players: Player[];
  currentRound: number;
  currentPlayerIndex: number;
  isFinished: boolean;
  startedAt: number;
}

export default function GamePage() {
  const router = useRouter();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showFinished, setShowFinished] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load game state from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("shagai-game");
    if (stored) {
      setGameState(JSON.parse(stored));
    } else {
      // No game data, redirect to setup
      router.push("/series/setup");
    }
  }, [router]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current global shot index (which shot we're on overall)
  const getCurrentShotIndex = useCallback(() => {
    if (!gameState) return 0;
    return gameState.currentRound - 1; // 0-indexed
  }, [gameState]);

  // Record a shot
  const recordShot = useCallback(
    (isHit: boolean) => {
      if (!gameState || gameState.isFinished) return;

      const newState = { ...gameState };
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      const shotIndex = newState.currentRound - 1;

      // Record the shot
      currentPlayer.shots[shotIndex] = isHit;

      // Move to next player
      const nextPlayerIndex = newState.currentPlayerIndex + 1;

      if (nextPlayerIndex >= newState.playerCount) {
        // All players have shot this round
        if (newState.currentRound >= 20) {
          // Game finished
          newState.isFinished = true;
          setShowFinished(true);
        } else {
          // Next round
          newState.currentRound += 1;
          newState.currentPlayerIndex = 0;
        }
      } else {
        // Next player in same round
        newState.currentPlayerIndex = nextPlayerIndex;
      }

      setGameState(newState);
      sessionStorage.setItem("shagai-game", JSON.stringify(newState));
    },
    [gameState]
  );

  // Edit a past shot (toggle hit/miss)
  const editShot = useCallback(
    (playerIndex: number, shotIndex: number) => {
      if (!gameState) return;

      const newState = { ...gameState };
      const player = newState.players[playerIndex];

      if (player.shots[shotIndex] !== null) {
        // Toggle the shot
        player.shots[shotIndex] = !player.shots[shotIndex];
        setGameState(newState);
        sessionStorage.setItem("shagai-game", JSON.stringify(newState));
      }
    },
    [gameState]
  );

  // Convert any color to RGB using canvas
  const colorToRgb = (color: string): string => {
    if (!color || color === "transparent" || color === "none") return color;
    if (color.startsWith("rgb") && !color.includes("oklab") && !color.includes("oklch")) return color;
    if (color.startsWith("#")) return color;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return color;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return a < 255 ? `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
    } catch {
      return color;
    }
  };

  // Normalize all colors in element to RGB format for html2canvas
  const normalizeColorsForScreenshot = (element: HTMLElement) => {
    const allElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[];
    const colorProps = [
      "color",
      "background-color",
      "border-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "outline-color",
    ];

    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      colorProps.forEach((prop) => {
        const value = computed.getPropertyValue(prop);
        if (value && (value.includes("oklab") || value.includes("oklch") || value.includes("lab(") || value.includes("lch("))) {
          const rgbValue = colorToRgb(value);
          el.style.setProperty(prop, rgbValue, "important");
        }
      });

      // Handle background (might be gradient or complex)
      const bg = computed.getPropertyValue("background");
      if (bg && (bg.includes("oklab") || bg.includes("oklch"))) {
        const bgColor = computed.getPropertyValue("background-color");
        el.style.setProperty("background", colorToRgb(bgColor), "important");
      }
    });
  };

  // Download screenshot
  const downloadScreenshot = useCallback(async () => {
    if (!gameAreaRef.current) return;

    try {
      // Hide the modal temporarily for screenshot
      setShowFinished(false);

      // Wait for modal to close
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(gameAreaRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        // Ignore SVG elements and elements marked with data-html2canvas-ignore to avoid oklab color parsing issues
        ignoreElements: (element) => {
          if (element.tagName === "svg" || element.tagName === "SVG") return true;
          if (element.getAttribute && element.getAttribute("data-html2canvas-ignore") === "true") return true;
          return false;
        },
        onclone: (_doc, clonedElement) => {
          // Normalize colors in the cloned element to avoid oklab/oklch parsing errors
          normalizeColorsForScreenshot(clonedElement);
        },
      });

      const link = document.createElement("a");
      link.download = `shagai-${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // Show modal again
      setShowFinished(true);
    } catch (error) {
      console.error("Screenshot failed:", error);
      setShowFinished(true);
    }
  }, []);

  // Go home
  const goHome = useCallback(() => {
    sessionStorage.removeItem("shagai-game");
    router.push("/");
  }, [router]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Ачааллаж байна…</div>
      </div>
    );
  }

  const currentShotIndex = getCurrentShotIndex();

  // Calculate total shots made across all players
  const totalShotsMade = gameState.players.reduce(
    (acc, player) => acc + player.shots.filter((s) => s !== null).length,
    0
  );
  const displayShot = Math.min(gameState.currentRound, 20);

  return (
    <>
      <div ref={gameAreaRef} className="min-h-screen pb-32">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[rgba(0,0,0,0.1)]"
        >
          <div className="font-score text-sm text-[#737373] tabular-nums">
            {currentTime.toLocaleDateString("mn-MN")}{" "}
            {currentTime.toLocaleTimeString("mn-MN")}
          </div>
          <Link href="/" data-html2canvas-ignore="true">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[#737373] hover:text-black touch-manipulation"
              aria-label="Буцах"
            >
              <ArrowLeft className="w-4 h-4" />
              БУЦАХ
            </Button>
          </Link>
        </motion.header>

        {/* Player Rows */}
        <div className="px-4 py-4 space-y-3">
          {gameState.players.map((player, playerIndex) => {
            const score = player.shots.filter((s) => s === true).length;
            const isActive = playerIndex === gameState.currentPlayerIndex;

            return (
              <PlayerRow
                key={playerIndex}
                name={player.name}
                shots={player.shots}
                score={score}
                isActive={isActive && !gameState.isFinished}
                currentShotIndex={currentShotIndex}
                onEditShot={(shotIndex) => editShot(playerIndex, shotIndex)}
              />
            );
          })}
        </div>
      </div>

      {/* Game Controls */}
      {!gameState.isFinished && (
        <GameControls
          currentShot={displayShot}
          totalShots={20}
          onHit={() => recordShot(true)}
          onMiss={() => recordShot(false)}
        />
      )}

      {/* Finished Modal */}
      <FinishedModal
        open={showFinished}
        players={gameState.players}
        onDownload={downloadScreenshot}
        onGoHome={goHome}
      />
    </>
  );
}
