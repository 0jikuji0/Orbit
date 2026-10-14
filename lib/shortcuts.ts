/** Raccourcis clavier globaux (affichés dans l'aide « ? »). */
export const SHORTCUTS = [
  { keys: ["Ctrl/⌘", "K"], label: "Palette de commandes" },
  { keys: ["/"], label: "Rechercher une tâche" },
  { keys: ["C"], label: "Nouvelle tâche" },
  { keys: ["G", "P"], label: "Aller aux projets" },
  { keys: ["G", "I"], label: "Aller aux tâches du projet" },
  { keys: ["G", "C"], label: "Aller aux cycles" },
  { keys: ["G", "M"], label: "Aller aux modules" },
  { keys: ["G", "V"], label: "Aller aux vues" },
  { keys: ["G", "S"], label: "Aller aux réglages de l'espace" },
  { keys: ["Échap"], label: "Fermer le panneau / la fenêtre" },
  { keys: ["?"], label: "Afficher cette aide" },
] as const;

/** Destination d'une séquence « G puis X ». `projectBase` = `/espace/projects/id` si on est dans un projet. */
export function goToTarget(
  key: string,
  workspaceBase: string,
  projectBase: string | null,
): string | null {
  switch (key.toLowerCase()) {
    case "p":
      return `${workspaceBase}/projects`;
    case "s":
      return `${workspaceBase}/settings`;
    case "i":
      return projectBase && `${projectBase}/issues`;
    case "c":
      return projectBase && `${projectBase}/cycles`;
    case "m":
      return projectBase && `${projectBase}/modules`;
    case "v":
      return projectBase && `${projectBase}/views`;
    default:
      return null;
  }
}

export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Événement envoyé par la palette pour ouvrir la création de tâche sur la page courante. */
export const NEW_ISSUE_EVENT = "orbit:new-issue";
