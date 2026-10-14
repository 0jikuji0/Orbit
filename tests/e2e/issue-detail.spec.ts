import { expect, test, type Page } from "@playwright/test";
import { createWorkspace, register, uniqueId } from "./helpers";

async function setupIssue(page: Page, id: string) {
  await register(page, "Dora Detail", `detail-${id}@e2e.local`);
  await createWorkspace(page, `Detail ${id}`);
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Docs");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/issues$/);
  await page.keyboard.press("c");
  await page.getByLabel("Titre").fill("Rédiger le guide");
  await page.keyboard.press("Control+Enter");
  await expect(page.getByTestId("issue-row").getByText("DOC-1")).toBeVisible();
}

test("détail : description riche, sous-tâche, commentaire et pièce jointe", async ({ page }) => {
  const id = uniqueId();
  await setupIssue(page, id);

  // Ouvrir le panneau latéral
  await page.getByTestId("issue-row").getByText("Rédiger le guide").click();
  const panel = page.getByRole("complementary", { name: "Détail de la tâche" });
  await expect(panel.getByLabel("Titre", { exact: true })).toHaveValue("Rédiger le guide");

  // Description : titre + case à cocher, enregistrée automatiquement
  const saved = page.waitForResponse(
    (r) => r.request().postData()?.includes("descriptionJson") ?? false,
  );
  await panel.getByLabel("Description").click();
  await page.keyboard.type("## Plan\n[ ] Installation");
  await saved;

  // Sous-tâche
  await panel.getByLabel("Nouvelle sous-tâche").fill("Chapitre Docker");
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("button", { name: "Chapitre Docker", exact: true })).toBeVisible();

  // Pièce jointe
  await panel.getByLabel("Fichiers à joindre").setInputFiles({
    name: "plan.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("étapes"),
  });
  const link = panel.getByRole("link", { name: "plan.txt", exact: true });
  await expect(link).toBeVisible();
  const download = await page.request.get((await link.getAttribute("href"))!);
  expect(download.status()).toBe(200);
  expect(await download.text()).toBe("étapes");
  expect(download.headers()["content-disposition"]).toContain("attachment");

  // Commentaire
  await panel.getByLabel("Nouveau commentaire").click();
  await page.keyboard.type("Premier jet vendredi");
  await page.keyboard.press("Control+Enter");
  await expect(panel.getByTestId("comment")).toContainText("Premier jet vendredi");

  // Historique
  await expect(panel.getByTestId("activity").filter({ hasText: "a créé la tâche" })).toBeVisible();
  await expect(
    panel.getByTestId("activity").filter({ hasText: "a ajouté la pièce jointe plan.txt" }),
  ).toBeVisible();

  // Pleine page : tout est persisté
  await panel.getByRole("link", { name: "Ouvrir en pleine page" }).click();
  await expect(page).toHaveURL(/\/issues\/1$/);
  const detail = page.getByTestId("issue-detail");
  await expect(detail.getByRole("heading", { name: "Plan" })).toBeVisible();
  await expect(detail.getByText("Installation", { exact: true })).toBeVisible();
  await expect(detail.getByTestId("comment")).toContainText("Premier jet vendredi");

  // La sous-tâche pointe vers son parent
  await detail.getByRole("button", { name: "Chapitre Docker", exact: true }).click();
  await expect(page).toHaveURL(/\/issues\/2$/);
  await expect(page.getByTestId("issue-detail").getByText("Rédiger le guide")).toBeVisible();
});

test("pièces jointes : 20 Mo maximum et accès réservé aux membres du projet", async ({
  page,
  browser,
}) => {
  const id = uniqueId();
  await setupIssue(page, id);
  await page.getByTestId("issue-row").getByText("Rédiger le guide").click();
  const panel = page.getByRole("complementary", { name: "Détail de la tâche" });

  await panel.getByLabel("Fichiers à joindre").setInputFiles({
    name: "gros.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(21 * 1024 * 1024),
  });
  await expect(panel.getByRole("alert")).toContainText("20 Mo maximum");

  await panel.getByLabel("Fichiers à joindre").setInputFiles({
    name: "secret.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("confidentiel"),
  });
  const href = await panel
    .getByRole("link", { name: "secret.txt", exact: true })
    .getAttribute("href");

  // Quelqu'un d'extérieur ne peut pas la télécharger
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await register(page2, "Oscar Outsider", `outsider-${id}@e2e.local`);
  await expect(page2).toHaveURL(/\/onboarding$/);
  const response = await page2.request.get(href!);
  expect(response.status()).toBe(404);
  await other.close();
});
