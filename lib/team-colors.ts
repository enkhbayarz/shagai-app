export type TeamColor =
  | "orange"
  | "blue"
  | "red"
  | "green"
  | "purple"
  | "teal"
  | "pink"
  | "yellow";

export const TEAM_COLOR_OPTIONS: TeamColor[] = [
  "orange",
  "blue",
  "red",
  "green",
  "purple",
  "teal",
  "pink",
  "yellow",
];

interface TeamColorClasses {
  // Backgrounds
  bg50: string;
  bg100: string;
  bg500: string;
  // Text
  text300: string;
  text400: string;
  text500: string;
  text600: string;
  text700: string;
  text70070: string;
  // Borders
  border200: string;
  border500: string;
  // Hover
  hoverText300: string;
  hoverText600: string;
  hoverBg50: string;
  hoverBg100: string;
  // Swatch display color (hex for the picker circle)
  hex: string;
}

export const teamColorMap: Record<TeamColor, TeamColorClasses> = {
  orange: {
    bg50: "bg-orange-50",
    bg100: "bg-orange-100",
    bg500: "bg-orange-500",
    text300: "text-orange-300",
    text400: "text-orange-400",
    text500: "text-orange-500",
    text600: "text-orange-600",
    text700: "text-orange-700",
    text70070: "text-orange-700/70",
    border200: "border-orange-200",
    border500: "border-orange-500",
    hoverText300: "hover:text-orange-300",
    hoverText600: "hover:text-orange-600",
    hoverBg50: "hover:bg-orange-50",
    hoverBg100: "hover:bg-orange-100",
    hex: "#f97316",
  },
  blue: {
    bg50: "bg-blue-50",
    bg100: "bg-blue-100",
    bg500: "bg-blue-500",
    text300: "text-blue-300",
    text400: "text-blue-400",
    text500: "text-blue-500",
    text600: "text-blue-600",
    text700: "text-blue-700",
    text70070: "text-blue-700/70",
    border200: "border-blue-200",
    border500: "border-blue-500",
    hoverText300: "hover:text-blue-300",
    hoverText600: "hover:text-blue-600",
    hoverBg50: "hover:bg-blue-50",
    hoverBg100: "hover:bg-blue-100",
    hex: "#3b82f6",
  },
  red: {
    bg50: "bg-red-50",
    bg100: "bg-red-100",
    bg500: "bg-red-500",
    text300: "text-red-300",
    text400: "text-red-400",
    text500: "text-red-500",
    text600: "text-red-600",
    text700: "text-red-700",
    text70070: "text-red-700/70",
    border200: "border-red-200",
    border500: "border-red-500",
    hoverText300: "hover:text-red-300",
    hoverText600: "hover:text-red-600",
    hoverBg50: "hover:bg-red-50",
    hoverBg100: "hover:bg-red-100",
    hex: "#ef4444",
  },
  green: {
    bg50: "bg-green-50",
    bg100: "bg-green-100",
    bg500: "bg-green-500",
    text300: "text-green-300",
    text400: "text-green-400",
    text500: "text-green-500",
    text600: "text-green-600",
    text700: "text-green-700",
    text70070: "text-green-700/70",
    border200: "border-green-200",
    border500: "border-green-500",
    hoverText300: "hover:text-green-300",
    hoverText600: "hover:text-green-600",
    hoverBg50: "hover:bg-green-50",
    hoverBg100: "hover:bg-green-100",
    hex: "#22c55e",
  },
  purple: {
    bg50: "bg-purple-50",
    bg100: "bg-purple-100",
    bg500: "bg-purple-500",
    text300: "text-purple-300",
    text400: "text-purple-400",
    text500: "text-purple-500",
    text600: "text-purple-600",
    text700: "text-purple-700",
    text70070: "text-purple-700/70",
    border200: "border-purple-200",
    border500: "border-purple-500",
    hoverText300: "hover:text-purple-300",
    hoverText600: "hover:text-purple-600",
    hoverBg50: "hover:bg-purple-50",
    hoverBg100: "hover:bg-purple-100",
    hex: "#a855f7",
  },
  teal: {
    bg50: "bg-teal-50",
    bg100: "bg-teal-100",
    bg500: "bg-teal-500",
    text300: "text-teal-300",
    text400: "text-teal-400",
    text500: "text-teal-500",
    text600: "text-teal-600",
    text700: "text-teal-700",
    text70070: "text-teal-700/70",
    border200: "border-teal-200",
    border500: "border-teal-500",
    hoverText300: "hover:text-teal-300",
    hoverText600: "hover:text-teal-600",
    hoverBg50: "hover:bg-teal-50",
    hoverBg100: "hover:bg-teal-100",
    hex: "#14b8a6",
  },
  pink: {
    bg50: "bg-pink-50",
    bg100: "bg-pink-100",
    bg500: "bg-pink-500",
    text300: "text-pink-300",
    text400: "text-pink-400",
    text500: "text-pink-500",
    text600: "text-pink-600",
    text700: "text-pink-700",
    text70070: "text-pink-700/70",
    border200: "border-pink-200",
    border500: "border-pink-500",
    hoverText300: "hover:text-pink-300",
    hoverText600: "hover:text-pink-600",
    hoverBg50: "hover:bg-pink-50",
    hoverBg100: "hover:bg-pink-100",
    hex: "#ec4899",
  },
  yellow: {
    bg50: "bg-yellow-50",
    bg100: "bg-yellow-100",
    bg500: "bg-yellow-500",
    text300: "text-yellow-300",
    text400: "text-yellow-400",
    text500: "text-yellow-500",
    text600: "text-yellow-600",
    text700: "text-yellow-700",
    text70070: "text-yellow-700/70",
    border200: "border-yellow-200",
    border500: "border-yellow-500",
    hoverText300: "hover:text-yellow-300",
    hoverText600: "hover:text-yellow-600",
    hoverBg50: "hover:bg-yellow-50",
    hoverBg100: "hover:bg-yellow-100",
    hex: "#eab308",
  },
};

export function getTeamColors(
  color: string | undefined,
  fallback: TeamColor
): TeamColorClasses {
  const key = color as TeamColor;
  return teamColorMap[key] ?? teamColorMap[fallback];
}
