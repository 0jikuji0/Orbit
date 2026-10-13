import { expect, test } from "@playwright/test";
import { createWorkspace, register, uniqueId } from "./helpers";

test("inscription → espace → projet → invitation d'un second membre", async ({ page, browser }) => {
  const id = uniqueId();

  // 1. Inscription puis création de l'espace de travail
  await register(page, "Ada Lovelace", `ada-${id}@e2e.local`);
  await createWorkspace(page, `E2E ${id}`);
  await expect(page).toHaveURL(new RegExp(`/e2e-${id}/projects$`));
  await expect(page.getByText("Aucun projet pour l'instant.").first()).toBeVisible();

  // 2. Création d'un projet : les 5 états par défaut existent
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Site web");
  await expect(page.getByLabel("Identifiant")).toHaveValue("SW");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/issues$/);
  for (const state of ["Backlog", "À faire", "En cours", "Terminé", "Annulé"]) {
    await expect(page.getByRole("button", { name: new RegExp(`^${state}`) })).toBeVisible();
  }
  await expect(page.getByRole("complementary").getByText("Site web")).toBeVisible();

  // 3. Lien d'invitation
  await page.goto(`/e2e-${id}/settings`);
  await page.getByRole("button", { name: "Créer un lien" }).click();
  const link = page.getByText(/^\/invite\//);
  await expect(link).toBeVisible();
  const invitePath = (await link.textContent())!.trim();

  // 4. Un second utilisateur rejoint via le lien
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await page2.goto(invitePath);
  await expect(page2).toHaveURL(/\/login\?next=/);
  await page2.getByRole("link", { name: "Créer un compte" }).click();
  await page2.getByLabel("Nom").fill("Grace Hopper");
  await page2.getByLabel("E-mail").fill(`grace-${id}@e2e.local`);
  await page2.getByLabel("Mot de passe").fill("password-e2e");
  await page2.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page2.getByRole("heading", { name: `Rejoindre « E2E ${id} »` })).toBeVisible();
  await page2.getByRole("button", { name: "Rejoindre l'espace" }).click();
  await expect(page2).toHaveURL(new RegExp(`/e2e-${id}/projects$`));
  await other.close();

  // 5. Le premier utilisateur voit le nouveau membre
  await page.reload();
  await expect(page.getByText("Grace Hopper")).toBeVisible();
});

test("les pages de l'application exigent une connexion", async ({ page }) => {
  await page.goto("/demo/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fdemo%2Fprojects$/);
});

test("un utilisateur ne peut pas ouvrir l'espace d'un autre", async ({ page }) => {
  const id = uniqueId();
  await register(page, "Eve", `eve-${id}@e2e.local`);
  await createWorkspace(page, `Eve ${id}`);
  const response = await page.goto("/demo/projects");
  expect(response?.status()).toBe(404);
});
