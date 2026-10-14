import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function register(page: Page, name: string, email: string, next?: string) {
  await page.goto(next ? `/register?next=${encodeURIComponent(next)}` : "/register");
  await page.getByLabel("Nom").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("password-e2e");
  await page.getByRole("button", { name: "Créer le compte" }).click();
}

export async function createWorkspace(page: Page, name: string) {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Nom de l'espace").fill(name);
  await page.getByRole("button", { name: "Créer l'espace de travail" }).click();
}

export async function login(page: Page, email: string, password = "password-e2e") {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

export async function logout(page: Page) {
  await page.getByRole("complementary").getByRole("button").last().click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Glisser-déposer à la souris, compatible avec le seuil d'activation de dnd-kit. */
export async function dragTo(page: Page, from: Locator, to: Locator) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error("Élément introuvable pour le glisser-déposer");
  await page.mouse.move(a.x + 20, a.y + 10);
  await page.mouse.down();
  await page.mouse.move(a.x + 40, a.y + 30, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height - 40, { steps: 20 });
  await page.mouse.up();
}
