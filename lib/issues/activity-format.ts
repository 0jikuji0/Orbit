import type { Priority } from "@prisma/client";
import { PRIORITY_LABELS } from "./priority";

const date = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const formatDate = (iso: string | null) => (iso ? date.format(new Date(`${iso}T00:00:00Z`)) : null);
const priority = (p: string | null) => (p ? (PRIORITY_LABELS[p as Priority] ?? p) : null);

function change(what: string, from: string | null, to: string | null) {
  if (from && to) return `a changé ${what} : ${from} → ${to}`;
  if (to) return `a défini ${what} : ${to}`;
  if (from) return `a retiré ${what} (${from})`;
  return `a modifié ${what}`;
}

/** Phrase décrivant une entrée d'historique, sans le nom de l'auteur. */
export function describeActivity(
  field: string,
  oldValue: string | null,
  newValue: string | null,
): string {
  switch (field) {
    case "created":
      return "a créé la tâche";
    case "archived":
      return "a archivé la tâche";
    case "title":
      return `a renommé la tâche en « ${newValue ?? ""} »`;
    case "state":
      return change("l'état", oldValue, newValue);
    case "priority":
      return change("la priorité", priority(oldValue), priority(newValue));
    case "assignees":
      return change("les assignés", oldValue, newValue);
    case "labels":
      return change("les labels", oldValue, newValue);
    case "startDate":
      return change("la date de début", formatDate(oldValue), formatDate(newValue));
    case "dueDate":
      return change("l'échéance", formatDate(oldValue), formatDate(newValue));
    case "description":
      return "a modifié la description";
    case "parent":
      if (newValue) return `a rattaché la tâche à ${newValue}`;
      return `a détaché la tâche de ${oldValue ?? "son parent"}`;
    case "attachment":
      return newValue
        ? `a ajouté la pièce jointe ${newValue}`
        : `a supprimé la pièce jointe ${oldValue ?? ""}`;
    default:
      return `a modifié ${field}`;
  }
}

const relative = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const fullDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** « à l'instant », « il y a 5 minutes », « hier », puis date complète au-delà d'une semaine. */
export function timeAgo(when: Date, now: Date = new Date()): string {
  const seconds = Math.round((when.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "à l'instant";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), "day");
  return fullDate.format(when);
}
