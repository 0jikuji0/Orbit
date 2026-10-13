# Décisions techniques

Choix non couverts par le cahier des charges, avec la raison.

| #   | Décision                                                | Raison                                                                                        |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Licence MIT                                             | Licence permissive la plus simple, adaptée à un outil auto-hébergé.                           |
| 2   | `main` stable + une branche par phase, fusion `--no-ff` | Historique lisible : chaque phase est un bloc identifiable.                                   |
| 3   | Prisma 6 (et non 7/8)                                   | Version stable sans adaptateur de driver obligatoire ; montée de version à évaluer plus tard. |
| 4   | Node ≥ 22 (LTS)                                         | Version LTS ciblée en production (image Docker).                                              |
| 5   | IDs `cuid()`                                            | Défaut Prisma, URL-safe, pas de dépendance supplémentaire.                                    |
