"use client";

import { forwardRef } from "react";

interface Player {
  name: string;
  shots: (boolean | null)[];
}

interface ShareCardProps {
  players: Player[];
  date: string;
}

// Shareable result card for social media (~1200x630 aspect ratio).
// Rendered off-screen then captured with html2canvas.
// IMPORTANT: Uses only hex colors (no oklab/oklch) for html2canvas compatibility.
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ players, date }, ref) => {
    if (players.length === 0) return null;

    const playersWithScores = players
      .map((player) => ({
        ...player,
        score: player.shots.filter((s) => s === true).length,
      }))
      .sort((a, b) => b.score - a.score);

    const maxScore = Math.max(...playersWithScores.map((p) => p.score));
    const winners = playersWithScores.filter((p) => p.score === maxScore);

    return (
      <div
        ref={ref}
        style={{
          width: "600px",
          padding: "32px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          color: "#ffffff",
          fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
          borderRadius: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, #f59e0b33 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px", position: "relative" }}>
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "4px",
              color: "#a3a3a3",
              marginBottom: "4px",
              textTransform: "uppercase",
            }}
          >
            Шагай Харваа
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "2px",
            }}
          >
            Тоглоомын үр дүн
          </div>
          <div style={{ fontSize: "13px", color: "#737373", marginTop: "4px" }}>
            {date}
          </div>
        </div>

        {/* Winner highlight */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            padding: "12px",
            background: "#f59e0b18",
            borderRadius: "12px",
            border: "1px solid #f59e0b44",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "2px" }}>🏆</div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "#f59e0b" }}>
            {winners.length === 1
              ? `${winners[0].name} түрүүлсэн!`
              : `${winners.map((w) => w.name).join(", ")}`}
          </div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
            {maxScore}/20
          </div>
        </div>

        {/* Player results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {playersWithScores.map((player, index) => {
            const isWinner = player.score === maxScore;
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: isWinner ? "#f59e0b18" : "#ffffff08",
                  border: isWinner ? "1px solid #f59e0b44" : "1px solid #ffffff10",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Rank */}
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "700",
                      background:
                        index === 0
                          ? "#f59e0b"
                          : index === 1
                            ? "#9ca3af"
                            : index === 2
                              ? "#d97706"
                              : "#404040",
                      color: index <= 2 ? "#000000" : "#a3a3a3",
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Name + shots */}
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "600" }}>
                      {player.name}
                    </div>
                    {/* Shot dots */}
                    <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                      {player.shots.map((shot, si) => (
                        <div
                          key={si}
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background:
                              shot === true
                                ? "#10b981"
                                : shot === false
                                  ? "#f43f5e"
                                  : "#404040",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    fontVariantNumeric: "tabular-nums",
                    color: isWinner ? "#f59e0b" : "#a3a3a3",
                  }}
                >
                  {player.score}/20
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "11px",
            color: "#525252",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          shagai.mn
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
