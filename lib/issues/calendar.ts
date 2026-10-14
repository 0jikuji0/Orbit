/** Jours (minuit UTC) affichés pour un mois : semaines complètes, du lundi au dimanche. */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lundi = 0
  const start = Date.UTC(year, month, 1 - offset);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(start + i * 86_400_000));
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function todayUTC(now: Date = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
