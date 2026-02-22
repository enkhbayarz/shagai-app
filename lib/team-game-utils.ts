export const phaseTypeLabels: Record<string, string> = {
  niileg: "НИЙЛЛЭГ ҮЕ",
  shuvtraga: "ШУВТРАГА ҮЕ",
  merge: "МЭРГЭ ҮЕ",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computePhaseSummary(phase: any) {
  let homeHits = 0,
    awayHits = 0,
    homeTotal = 0,
    awayTotal = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase.shooters.forEach((shooter: any) => {
    shooter.shots.forEach((shot: boolean | "skip" | null) => {
      if (shot === true) {
        if (shooter.team === "home") {
          homeHits++;
          homeTotal++;
        } else {
          awayHits++;
          awayTotal++;
        }
      } else if (shot === false) {
        if (shooter.team === "home") homeTotal++;
        else awayTotal++;
      }
    });
  });
  return { homeHits, awayHits, homeTotal, awayTotal };
}
