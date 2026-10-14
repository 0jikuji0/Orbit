/**
 * Rattacher `issueId` à `newParentId` créerait-il une boucle ?
 * `parentOf` donne le parent actuel de chaque tâche du projet.
 */
export function wouldCreateCycle(
  issueId: string,
  newParentId: string,
  parentOf: ReadonlyMap<string, string | null>,
): boolean {
  let current: string | null | undefined = newParentId;
  const seen = new Set<string>();
  while (current) {
    if (current === issueId || seen.has(current)) return true;
    seen.add(current);
    current = parentOf.get(current);
  }
  return false;
}
