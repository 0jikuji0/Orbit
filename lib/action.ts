import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { PermissionError } from "./permissions";

export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Erreur métier dont le message peut être montré à l'utilisateur. */
export class UserError extends Error {}

/**
 * Exécute une server action en convertissant les erreurs attendues (validation zod,
 * permission, règle métier) en résultat sérialisable. Les redirections et 404 de Next
 * sont relancées telles quelles.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { ok: false, error: error.issues[0]?.message ?? "Données invalides", fieldErrors };
    }
    if (error instanceof PermissionError || error instanceof UserError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
