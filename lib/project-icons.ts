/** Icônes proposées pour un projet (noms d'icônes lucide). */
export const PROJECT_ICONS = [
  "orbit",
  "rocket",
  "box",
  "code",
  "globe",
  "layers",
  "zap",
  "flag",
  "book",
  "briefcase",
  "heart",
  "star",
] as const;

export type ProjectIconName = (typeof PROJECT_ICONS)[number];
