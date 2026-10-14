/**
 * Transforme une saisie libre en requête `to_tsquery` sûre : chaque mot devient un préfixe
 * (« colon » trouve « colonnes ») et tous les mots doivent être présents.
 * Seuls lettres et chiffres sont conservés : aucun opérateur tsquery ne peut être injecté.
 */
export function buildTsQuery(input: string): string | null {
  const words = input
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 10);
  return words.length ? words.map((w) => `${w}:*`).join(" & ") : null;
}

/** Délimiteurs des passages surlignés renvoyés par `ts_headline`. */
export const HIGHLIGHT_START = "⁣[";
export const HIGHLIGHT_END = "]⁣";

/** Découpe un extrait en segments normaux / surlignés (rendu sans HTML). */
export function splitHighlights(snippet: string): { text: string; hit: boolean }[] {
  const parts: { text: string; hit: boolean }[] = [];
  let rest = snippet;
  while (rest) {
    const start = rest.indexOf(HIGHLIGHT_START);
    if (start === -1) {
      parts.push({ text: rest, hit: false });
      break;
    }
    const end = rest.indexOf(HIGHLIGHT_END, start);
    if (end === -1) {
      parts.push({ text: rest, hit: false });
      break;
    }
    if (start > 0) parts.push({ text: rest.slice(0, start), hit: false });
    parts.push({ text: rest.slice(start + HIGHLIGHT_START.length, end), hit: true });
    rest = rest.slice(end + HIGHLIGHT_END.length);
  }
  return parts;
}
