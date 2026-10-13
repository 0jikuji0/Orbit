import type { Prisma } from "@prisma/client";

/**
 * Réserve le prochain numéro de tâche d'un projet. À appeler DANS la transaction qui crée la tâche :
 * l'UPDATE … SET issueCounter = issueCounter + 1 verrouille la ligne du projet jusqu'au commit,
 * donc deux créations concurrentes obtiennent forcément deux numéros différents.
 */
export async function nextSequenceId(tx: Prisma.TransactionClient, projectId: string) {
  const { issueCounter } = await tx.project.update({
    where: { id: projectId },
    data: { issueCounter: { increment: 1 } },
    select: { issueCounter: true },
  });
  return issueCounter;
}
