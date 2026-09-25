# Consignes pour les agents de code

Site média sur la réglementation et la fiscalité des cryptoactifs au Canada et au Québec. Astro 7 (site statique), contenu en fichiers (`content/`), réglages en JSON (`config/`). Références : `docs/BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/DA.md`, `docs/GUIDE-AUTEUR.md`.

## Règles absolues

- **Ne jamais inventer de contenu juridique ou fiscal** (règle, taux, seuil, date, référence d'article de loi, position d'une autorité). Écrire `[À COMPLÉTER PAR L'AUTEUR]`, `[À VÉRIFIER]` ou `[À VALIDER PAR L'AUTEUR]`. Ces marqueurs bloquent la publication (`npm run check`).
- Aucun service payant sans l'accord de l'auteur. Aucune clé d'API ni aucun secret dans le dépôt.
- Une fois le site en production, ne jamais pousser directement sur `main` sans l'accord de l'auteur.
- Ne jamais modifier `docs/BRIEF.md` ni `docs/references/`.

## Commandes

- `npm run dev` : site local, brouillons visibles.
- `npm run check` : validations et rapport `docs/A-VERIFIER.md` (non versionné).
- `npm run build` : `check`, build de production, index Pagefind, puis contrôles de `dist/` (`scripts/postbuild.ts`). `SITE_MODE=preview` pour un build d'aperçu.
- `npm test` (Vitest), `npm run typecheck` (`astro check`).

Avant tout commit : `npm test`, `npm run typecheck` et `npm run build` passent sans avertissement.

## Conventions de code

- TypeScript strict. Noms de code en anglais, commentaires en français.
- Composants de moins de 200 lignes, génériques : une variante par besoin, jamais un composant par sujet (`ArticleCard`, pas `TaxArticleCard`).
- **Aucune chaîne d'interface ni aucun contenu dans `src/`** : les textes viennent de `config/i18n/fr.json` (`t()`), les réglages de `config/`, le contenu de `content/`.
- Schémas Zod dans `src/lib/content/schemas.ts` et `src/lib/config/schemas.ts`, messages d'erreur en français. Formats compatibles avec Keystatic : dates `AAAA-MM-JJ`, texte vide `""`, relations par identifiant, blocs `{ discriminant, value }`.
- Règles qui croisent plusieurs contenus : `src/lib/content/rules.ts`. Contrôles du rapport : `src/lib/check/`.
- Couleurs : uniquement par les jetons de `config/theme.json` (variables CSS générées), jamais de couleur écrite en dur.
- Dates, nombres et montants : `src/lib/format.ts`. Typographie québécoise : `src/lib/typo.ts` (appliquée par `t()`).
- Dépendances minimales, versions exactes (pas de `^`).
- Tests dans `tests/` pour les schémas, le formatage, le graphe et `check`.

## Rédaction

Français du Québec, typographie québécoise (point 8.10 du brief) : espace insécable avant le deux-points et à l'intérieur des guillemets « », aucune espace avant le point-virgule, le point d'exclamation et le point d'interrogation. Vocabulaire : « courriel », « infolettre ».

## Commits

En français, au format `type(portée): description` (ex. `feat(accueil): ajoute la section À surveiller`). Un commit par changement cohérent.
