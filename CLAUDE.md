# Consignes pour les agents de code

Site média sur la réglementation et la fiscalité des cryptoactifs au Canada et au Québec. Astro 7 (site statique), contenu en fichiers (`content/`), réglages en JSON (`config/`). Références : `docs/BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/DA.md`, `docs/GUIDE-AUTEUR.md`.

## Règles absolues

- **Ne jamais inventer de contenu juridique ou fiscal** (règle, taux, seuil, date, référence d'article de loi, position d'une autorité). Écrire `[À COMPLÉTER PAR L'AUTEUR]`, `[À VÉRIFIER]` ou `[À VALIDER PAR L'AUTEUR]`. Ces marqueurs bloquent la publication (`npm run check`).
- Aucun service payant sans l'accord de l'auteur. Aucune clé d'API ni aucun secret dans le dépôt.
- Une fois le site en production, ne jamais pousser directement sur `main` sans l'accord de l'auteur.
- Ne jamais modifier `docs/BRIEF.md` ni `docs/references/`.

## Commandes

- `npm run dev` : site local, brouillons visibles; éditeur Keystatic sur `/keystatic`.
- `npm run check` : validations et rapport `docs/A-VERIFIER.md` (non versionné).
- `npm run build` : `check`, build de production, index Pagefind, puis contrôles de `dist/` (`scripts/postbuild.ts`). `SITE_MODE=preview` pour un build d'aperçu.
- `npm test` (Vitest), `npm run typecheck` (`astro check`).
- `npm run new:article "Titre"`, `npm run newsletter:draft` (`-- --html` pour le courriel), `npm run content:format` (remet `content/` et `config/` au format de l'éditeur).

Avant tout commit : `npm test`, `npm run typecheck` et `npm run build` passent sans avertissement.

## Conventions de code

- TypeScript strict. Noms de code en anglais, commentaires en français.
- Composants de moins de 200 lignes, génériques : une variante par besoin, jamais un composant par sujet (`ArticleCard`, pas `TaxArticleCard`).
- **Aucune chaîne d'interface ni aucun contenu dans `src/`** : les textes viennent de `config/i18n/fr.json` (`t()`), les réglages de `config/`, le contenu de `content/`.
- Schémas Zod dans `src/lib/content/schemas.ts` et `src/lib/config/schemas.ts`, messages d'erreur en français. Formats de l'éditeur : dates `AAAA-MM-JJ`; date, nombre, adresse ou relation facultatifs vides = clé absente (jamais `''`); texte vide absent ou `""`; liste fermée facultative : option `''`; relations par identifiant; blocs `{ discriminant, value }`.
- Règles qui croisent plusieurs contenus : `src/lib/content/rules.ts`. Contrôles du rapport : `src/lib/check/`.
- Couleurs : uniquement par les jetons de `config/theme.json` (variables CSS générées), jamais de couleur écrite en dur.
- Dates, nombres et montants : `src/lib/format.ts`. Typographie québécoise : `src/lib/typo.ts` (appliquée par `t()`).
- Dépendances minimales, versions exactes (pas de `^`).
- Tests dans `tests/` pour les schémas, le formatage, le graphe et `check`.

## Éditeur (Keystatic, mode local)

- Configuration dans `src/lib/editor/`, miroir des schémas Zod : une clé Zod ajoutée, retirée ou renommée l'est aussi dans le formulaire (`fields.ignored()` pour une clé que l'auteur ne doit pas modifier). Libellés et aides dans `config/i18n/fr.json` (`champs`, `editeur`). `tests/editor.test.ts` vérifie que chaque fichier s'ouvre et s'enregistre sans perte.
- Tout fichier de `content/` ou `config/` écrit ou modifié à la main : lancer ensuite `npm run content:format`.
- Corps MDX : bloc qui entoure du texte (Callout, TexteDeLoi, Citation, Hero) sur des lignes à part; valeurs entre accolades littérales seulement (montant négatif entre guillemets); ni HTML, ni commentaire, ni image Markdown, ni `{…}`; pas de `Note` dans une `Definition`. Le rapport `check` le signale.
- Images d'une entrée dans `content/images/<collection>/<identifiant>/` seulement (dossier par collection : `COLLECTIONS` de `src/lib/content/collections.ts`).
- L'éditeur conserve les modifications non enregistrées de l'auteur et écraserait une modification faite entre-temps : prévenir l'auteur avant de modifier un contenu qu'il est en train d'éditer.
- Jamais `astro dev --host` : l'éditeur écrit sans authentification (il se désactive alors).
- Keystatic est épinglé : `src/lib/editor/roundtrip.ts` s'appuie sur ses fonctions internes. Toute mise à jour sur une branche, tests compris.

## Rédaction

Français du Québec, typographie québécoise (point 8.10 du brief) : espace insécable avant le deux-points et à l'intérieur des guillemets « », aucune espace avant le point-virgule, le point d'exclamation et le point d'interrogation. Vocabulaire : « courriel », « infolettre ».

## Commits

En français, au format `type(portée): description` (ex. `feat(accueil): ajoute la section À surveiller`). Un commit par changement cohérent.
