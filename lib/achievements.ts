export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "first_game", name: "Эхний алхам", description: "Анхны тоглоом тоглох", icon: "footprints" },
  { code: "first_win", name: "Эхний ялалт", description: "Анхны ялалт байгуулах", icon: "trophy" },
  { code: "perfect_game", name: "Цэвэр ялалт", description: "Бүх харваагаа оноох", icon: "star" },
  { code: "sharpshooter", name: "Мэргэн харваач", description: "80%+ нарийвчлалтай тоглох", icon: "target" },
  { code: "on_fire", name: "Гал дээр", description: "5 ялалтын цуваа", icon: "flame" },
  { code: "streak_10", name: "10 ялалтын цуваа", description: "10 дараалсан ялалт", icon: "zap" },
  { code: "hundred_battles", name: "Зуун тулаан", description: "100 тоглоом тоглох", icon: "swords" },
  { code: "thousander", name: "Мянгат", description: "1000 нийт оноо цуглуулах", icon: "gem" },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.code, a])
);
