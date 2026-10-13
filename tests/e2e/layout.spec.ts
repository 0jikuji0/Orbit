import { expect, test } from "@playwright/test";

test("la page d'accueil affiche la liste des tâches du projet", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/demo\/projects\/orb\/issues$/);
  await expect(page.getByRole("link", { name: "Tâches" }).first()).toBeVisible();
  await expect(page.getByText("ORB-3")).toBeVisible();
});
