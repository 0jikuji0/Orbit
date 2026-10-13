# Contribuer à Orbit

Merci de votre intérêt ! Quelques règles pour garder le projet cohérent.

## Branches

- `main` est toujours stable : lint, tests et build passent.
- Travaillez sur une branche dédiée : `feat/<sujet>`, `fix/<sujet>`, `docs/<sujet>`, `chore/<sujet>`.
- Ouvrez une pull request vers `main`.

## Commits

Format [Conventional Commits](https://www.conventionalcommits.org/fr/) — un commit = une tâche :

```
feat(issues): kanban drag and drop
fix(auth): redirect after logout
docs(readme): install instructions
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`.

## Avant d'ouvrir une PR

```bash
pnpm lint && pnpm test && pnpm build
```

## Règles de code

- TypeScript strict, pas de `any`.
- Toute entrée utilisateur est validée par un schéma zod.
- Tout accès aux données passe par `lib/permissions.ts`.
- Design system : uniquement les tokens CSS (`var(--…)`), **aucune couleur ni `border-radius` en dur**, pas d'ombre ni de dégradé.
- Les choix techniques non évidents sont consignés dans [DECISIONS.md](DECISIONS.md).

## Signaler un bug / proposer une idée

Utilisez les modèles d'issues GitHub. Pour une faille de sécurité, voir [SECURITY.md](SECURITY.md).
