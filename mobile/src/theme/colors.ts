// Central color palette. A premium, modern look: deep indigo + warm coral accent.
export const colors = {
  primary: "#5B21B6", // deep violet
  primaryDark: "#4C1D95",
  primaryLight: "#7C3AED",
  accent: "#FF6B35", // warm coral
  accentSoft: "#FFF1EC",

  background: "#F7F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F0F8",

  text: "#15131F",
  textMuted: "#6B6880",
  textFaint: "#9D9AB0",

  border: "#ECEAF3",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  star: "#FBBF24",

  white: "#FFFFFF",
  black: "#000000",
};

// Gradient presets (use with expo-linear-gradient).
export const gradients = {
  brand: ["#7C3AED", "#5B21B6"] as const,
  hero: ["#6D28D9", "#9333EA", "#C026D3"] as const,
  accent: ["#FF8A5B", "#FF6B35"] as const,
  dark: ["#2D2A45", "#15131F"] as const,
};
