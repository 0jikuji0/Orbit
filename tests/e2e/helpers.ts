import { expect, type Page } from "@playwright/test";

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
