import { expect, test } from "@playwright/test";
import { createWorkspace, dragTo, login, logout, register, uniqueId } from "./helpers";

test("connexion → créer un projet → créer une tâche → la déplacer en kanban", async ({ page }) => {
  const id = uniqueId();
  const email = `kanban-${id}@e2e.local`;
  await register(page, "Kim Kanban", email);
  await createWorkspace(page, `Kanban ${id}`);
  await logout(page);

  // Connexion
  await login(page, email);
  await expect(page).toHaveURL(new RegExp(`/kanban-${id}/projects$`));

  // Projet
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Roadmap");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/issues$/);

  // Tâche (raccourci C), priorité haute
  await page.keyboard.press("c");
  await page.getByLabel("Titre").fill("Écrire la documentation");
  await page.getByRole("button", { name: /^Priorité/ }).click();
  await page.getByRole("menuitem", { name: "Haute" }).click();
  await page.keyboard.press("Control+Enter");
  const row = page.getByTestId("issue-row").filter({ hasText: "Écrire la documentation" });
  await expect(row.getByText("ROA-1")).toBeVisible();
  await expect(page.getByRole("region", { name: "À faire" })).toContainText(
    "Écrire la documentation",
  );

  // Kanban : glisser vers « En cours »
  await page.getByRole("tab", { name: "Kanban" }).click();
  const card = page.getByTestId("issue-card").filter({ hasText: "Écrire la documentation" });
  const inProgress = page.getByRole("region", { name: "En cours" });
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.ok());
  await dragTo(page, card, inProgress);
  await expect(inProgress).toContainText("Écrire la documentation");

  // Persisté côté serveur
  await saved;
  await page.reload();
  await expect(page.getByRole("region", { name: "En cours" })).toContainText(
    "Écrire la documentation",
  );

  // Filtre par priorité : la tâche reste visible pour « Haute », disparaît pour « Basse »
  await page.goto(`${page.url().split("?")[0]}?priority=LOW`);
  await expect(page.getByTestId("issue-card")).toHaveCount(0);
  await page.goto(`${page.url().split("?")[0]}?layout=kanban&priority=HIGH`);
  await expect(page.getByTestId("issue-card")).toHaveCount(1);
});

test("un état ajouté dans les réglages devient une colonne du kanban", async ({ page }) => {
  const id = uniqueId();
  await register(page, "Sam States", `states-${id}@e2e.local`);
  await createWorkspace(page, `States ${id}`);
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Support");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/issues$/);
  const issuesUrl = page.url();

  await page.goto(issuesUrl.replace(/\/issues$/, "/settings"));
  await page.getByLabel("Nouvel état").fill("En revue");
  await page.getByRole("button", { name: "Ajouter" }).first().click();
  await expect(page.getByLabel("Nom de l'état").last()).toHaveValue("En revue");

  await page.goto(`${issuesUrl}?layout=kanban`);
  await expect(page.getByRole("region", { name: "En revue" })).toBeVisible();
});
