# Décisions techniques

Choix non couverts par le cahier des charges, avec la raison.

| #   | Décision                                                                                              | Raison                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Licence MIT                                                                                           | Licence permissive la plus simple, adaptée à un outil auto-hébergé.                           |
| 2   | `main` stable + une branche par phase, fusion `--no-ff`                                               | Historique lisible : chaque phase est un bloc identifiable.                                   |
| 3   | Prisma 6 (et non 7/8)                                                                                 | Version stable sans adaptateur de driver obligatoire ; montée de version à évaluer plus tard. |
| 4   | Node ≥ 22 (LTS)                                                                                       | Version LTS ciblée en production (image Docker).                                              |
| 5   | IDs `cuid()`                                                                                          | Défaut Prisma, URL-safe, pas de dépendance supplémentaire.                                    |
| 6   | Modèles `Session`, `Account`, `Verification` et champs `User.emailVerified/updatedAt`                 | Requis par better-auth ; `image` est mappé sur `avatarUrl`.                                   |
| 7   | Modèle `WorkspaceInvite` (lien réutilisable, 7 jours, révocable)                                      | Invitation « par lien » sans serveur d'e-mails.                                               |
| 8   | Les owners/admins du workspace sont admins de tous ses projets ; un invité est plafonné à « lecteur » | Règle la plus simple et prévisible, testée dans `tests/unit/permissions.test.ts`.             |
| 9   | Ressource inaccessible → 404 (pas 403)                                                                | Ne révèle pas l'existence d'un workspace ou d'un projet.                                      |
| 10  | Middleware = simple présence du cookie ; vraie vérification dans `lib/permissions.ts`                 | Le middleware tourne sur le runtime edge, sans accès Prisma.                                  |
| 11  | Lectures dans `server/queries/`, écritures dans `server/actions/`                                     | Toutes deux passent par `require*` de `lib/permissions.ts`.                                   |
| 12  | Inscription ouverte                                                                                   | Simple pour l'auto-hébergement ; une option pour la fermer pourra venir plus tard.            |
