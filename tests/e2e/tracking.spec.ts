import { expect, test } from "@playwright/test";
import { createWorkspace, register, uniqueId } from "./helpers";

test("assignation et mention → Inbox, Mes tâches, recherche et statistiques", async ({
  page,
  browser,
}) => {
  const id = uniqueId();

  // Alice crée l'espace et le projet, puis invite Bob
  await register(page, "Alice Suivi", `alice-${id}@e2e.local`);
  await createWorkspace(page, `Suivi ${id}`);
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Backend");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/issues$/);
  const issuesUrl = page.url();

  await page.goto(`/suivi-${id}/settings`);
  await page.getByRole("button", { name: "Créer un lien" }).click();
  const invitePath = (await page.getByText(/^\/invite\//).textContent())!.trim();

  const bobContext = await browser.newContext();
  const bob = await bobContext.newPage();
  await register(bob, "Bob Suivi", `bob-${id}@e2e.local`, invitePath);
  await bob.getByRole("button", { name: "Rejoindre l'espace" }).click();
  await expect(bob).toHaveURL(new RegExp(`/suivi-${id}/projects$`));

  // Alice ajoute Bob au projet, crée une tâche, l'assigne et le mentionne
  await page.goto(issuesUrl.replace(/\/issues$/, "/settings"));
  await page.getByRole("combobox", { name: "Membre à ajouter" }).click();
  await page.getByRole("option", { name: /Bob Suivi/ }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).last().click();
  await expect(page.getByText(`bob-${id}@e2e.local`)).toBeVisible();

  await page.goto(issuesUrl);
  await page.getByRole("button", { name: /^Nouvelle C$/ }).click();
  await page.getByLabel("Titre").fill("Limiter le débit de l'API");
  await page.keyboard.press("Control+Enter");
  await expect(page.getByTestId("issue-row").getByText("BAC-1")).toBeVisible();
  await page.getByTestId("issue-row").getByText("Limiter le débit de l'API").click();
  const panel = page.getByRole("complementary", { name: "Détail de la tâche" });
  await panel.getByRole("button", { name: /^Assignés/ }).click();
  await page.getByRole("menuitemcheckbox", { name: /Bob Suivi/ }).click();
  await page.keyboard.press("Escape");
  await expect(panel).toBeVisible(); // Échap ferme le menu, pas le panneau

  const saved = page.waitForResponse(
    (r) => r.request().postData()?.includes("descriptionJson") ?? false,
  );
  await panel.getByLabel("Description").click();
  await page.keyboard.type("Quotas par jeton, voir avec @Bob");
  await page.getByRole("option", { name: /Bob Suivi/ }).click();
  await saved;

  // Bob : 2 notifications, la tâche dans « Mes tâches », trouvable par sa description
  await bob.goto(`/suivi-${id}/inbox`);
  await expect(bob.getByTestId("unread-badge")).toHaveText("2");
  await expect(bob.getByTestId("notification")).toHaveCount(2);
  await expect(bob.getByTestId("notification").first()).toContainText("vous a mentionné dans");

  await bob.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(bob.getByTestId("notification")).toHaveCount(0);
  await expect(bob.getByTestId("unread-badge")).toHaveCount(0);

  await bob.goto(`/suivi-${id}/my-issues`);
  await expect(bob.getByTestId("my-issue")).toContainText("Limiter le débit de l'API");

  await bob.goto(`/suivi-${id}/search?q=jeton`);
  await expect(bob.getByTestId("search-hit")).toHaveCount(1);
  await expect(bob.getByTestId("search-hit").locator("mark")).toHaveText("jeton");
  await bobContext.close();

  // Statistiques : la tâche ouverte compte pour Bob
  await page.goto(issuesUrl.replace(/\/issues$/, "/analytics"));
  const byAssignee = page.getByRole("region", { name: "Par assigné" });
  await expect(byAssignee.getByRole("row", { name: /Bob Suivi/ })).toContainText("1");
});
