import { expect, test, type Page } from "@playwright/test";
import { createWorkspace, register, uniqueId } from "./helpers";

async function setupProject(page: Page, id: string) {
  await register(page, "Olga Orga", `orga-${id}@e2e.local`);
  await createWorkspace(page, `Orga ${id}`);
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Mobile");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/issues$/);
  return page.url().replace(/\/issues$/, "");
}

async function createIssue(page: Page, title: string, state?: string) {
  await page.getByRole("button", { name: /^Nouvelle C$/ }).click();
  await page.getByLabel("Titre").fill(title);
  if (state) {
    await page.getByRole("button", { name: /^État/ }).click();
    await page.getByRole("menuitem", { name: state }).click();
  }
  await page.keyboard.press("Control+Enter");
  await expect(page.getByLabel("Titre")).toHaveCount(0);
}

test("cycles : création, tâches rattachées et progression", async ({ page }) => {
  const project = await setupProject(page, uniqueId());

  await page.goto(`${project}/cycles`);
  await page.getByRole("button", { name: "Nouveau cycle" }).click();
  await page.getByLabel("Nom").fill("Sprint 1");
  await page.getByRole("button", { name: "Créer le cycle" }).click();
  await page.getByRole("link", { name: /Sprint 1/ }).click();
  await expect(page).toHaveURL(/\/cycles\/[^/]+$/);

  // Les tâches créées depuis la page du cycle y sont rattachées
  await createIssue(page, "Écran de connexion");
  await createIssue(page, "Icône de l'app", "Terminé");
  await expect(page.getByText("1/2 · 50%")).toBeVisible();

  // Elles n'apparaissent pas dans un autre cycle
  await page.goto(`${project}/issues?cycle=none`);
  await expect(page.getByTestId("issue-row")).toHaveCount(0);

  await page.goto(`${project}/cycles`);
  await expect(page.getByRole("region", { name: "En cours" })).toContainText("1/2 · 50%");
});

test("vues : tableau, calendrier et vue sauvegardée", async ({ page }) => {
  const project = await setupProject(page, uniqueId());
  await createIssue(page, "Notifications push");
  await createIssue(page, "Mode sombre", "En cours");

  // Tableau trié par titre
  await page.getByRole("tab", { name: "Tableau" }).click();
  await page.getByRole("button", { name: "Titre", exact: true }).click();
  await expect(page.getByTestId("table-row").first()).toContainText("Mode sombre");

  // Calendrier : création directe avec une échéance
  await page.getByRole("tab", { name: "Calendrier" }).click();
  await expect(page.getByText("2 tâches sans échéance")).toBeVisible();

  // Vue sauvegardée : kanban filtré sur « En cours »
  await page.goto(`${project}/issues?layout=kanban`);
  await page.getByRole("button", { name: "Filtres" }).click();
  await page.getByRole("menuitem", { name: "État" }).hover();
  await page.getByRole("menuitemcheckbox", { name: "En cours" }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Enregistrer la vue" }).click();
  await page.getByLabel("Nom de la vue").fill("Travail en cours");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByLabel("Nom de la vue")).toHaveCount(0);

  await page.goto(`${project}/views`);
  await page.getByRole("link", { name: "Travail en cours" }).click();
  await expect(page).toHaveURL(/layout=kanban/);
  await expect(page.getByTestId("issue-card")).toHaveCount(1);
  await expect(page.getByTestId("issue-card")).toContainText("Mode sombre");
});

test("palette de commandes : recherche et raccourcis", async ({ page }) => {
  const project = await setupProject(page, uniqueId());
  await createIssue(page, "Synchronisation hors ligne");

  await page.keyboard.press("Control+k");
  await page.keyboard.type("MOB-1");
  await page.getByRole("option", { name: /Synchronisation hors ligne/ }).click();
  await expect(page).toHaveURL(/\/issues\/1$/);

  await page.keyboard.press("g");
  await page.keyboard.press("m");
  await expect(page).toHaveURL(`${project}/modules`);

  // « C » hors de la liste : on revient aux tâches avec la création ouverte
  await page.keyboard.press("c");
  await expect(page.getByLabel("Titre")).toBeVisible();
});
