# Historique des changements

Le site a été construit en six phases, du 25 au 28 septembre 2026, d'après le brief (`docs/BRIEF.md`, section 12). Chaque phase se termine par un rapport à l'auteur et attend sa validation. Les décisions sont détaillées dans ARCHITECTURE, section 25; chaque commit, dans l'historique Git.

## Phase 5 : qualité, hébergement et mise en ligne (28 septembre 2026)

### Ajouts

- Parcours de fumée Playwright sur 22 pages principales et la page 404, sur ordinateur et sur mobile, en clair et en sombre : erreurs, défilement horizontal, CSP, accessibilité WCAG 2.2 AA (axe-core). Parcours de l'inscription à l'infolettre, de la recherche, des menus et du thème.
- Intégration continue GitHub Actions (tâche `ci`) : types, tests, format de l'éditeur, construction, taille du Worker, parcours de fumée.
- `npm run trial` : le site et ses formulaires en local, en mode d'essai, sans secret. `npm run test:e2e`, `npm run worker:size`.
- Route `/api/sante` du Worker, pour la sonde de disponibilité.
- Rapport « À vérifier » : domaine du site absent de `wrangler.jsonc`, adresse `workers.dev` restée ouverte, `wrangler.jsonc` illisible.
- Guide de l'auteur : mise en ligne pas à pas (section 41) et vérifications automatiques (section 42). ARCHITECTURE : intégration continue (section 15.7), sonde de disponibilité (section 15.6), audit de performance et d'accessibilité (section 27).

### Changements

- Mode du site déduit de la branche dans Workers Builds : toute branche autre que `main` construit un aperçu.
- Aperçus de branche autonomes : aucun secret, formulaires en mémoire, clés d'essai de Turnstile simulées.
- Image principale de l'accueil demandée en priorité.

### Corrections

- Test de la date d'un commit indépendant du format du fuseau.

## Phase 4 : services (28 septembre 2026)

### Ajouts

- Worker Cloudflare : inscription à l'infolettre (Brevo, double consentement, preuve de consentement), formulaire de contact, Turnstile, limitation de débit, tâche planifiée (publication programmée, reconstruction nocturne).
- Formulaires sans rechargement, Turnstile chargé au premier contact.
- Mesure d'audience Umami, sans témoin, derrière un contrat.
- Pages légales et de confiance en brouillon; en-têtes de sécurité et CSP à empreintes.
- Veille officielle : collecte des fils, santé des sources, diagnostic, tâche GitHub.
- Surveillance de la fraîcheur du site en ligne et rapport hebdomadaire.
- Cours des cryptoactifs lus à la construction (CoinGecko), module désactivé.

### Corrections

- Suites de trois revues : débit par adresse compté après Turnstile, contenus programmés contrôlés comme publiés, veille (robots.txt, lecture des fils, états), surveillance (commit construit), réglages bloquants une fois le site en ligne, mesure d'audience (retrait du consentement, termes de recherche).

## Phase 3 : éditeur et publication (28 septembre 2026)

### Ajouts

- Éditeur Keystatic en français, en développement seulement, fidèle aux schémas (aller-retour vérifié sur tout le contenu).
- `/schedule.json` et logique de la publication programmée.
- `npm run new:article`, `npm run newsletter:draft`, `npm run content:format`.
- Rapport « À vérifier » : contenus que l'éditeur ne pourrait pas rouvrir.

### Corrections

- Suites de la revue : contrôles alignés sur l'éditeur, `content:format` prudent, formulaires plus sûrs, mot d'introduction de l'infolettre.

## Phase 2 : gabarits (25 septembre 2026)

### Ajouts

- Relations inverses, articles liés, fils d'Ariane.
- Corps MDX : typographie, notes numérotées, blocs riches.
- Gabarits : article, guide, dossier, juridiction, organisme, texte, traitement fiscal, lexique, agenda (iCalendar), veille, auteurs, infolettre, rubriques et listes; feuille d'impression.
- Recherche Pagefind; référencement (Open Graph, données structurées, images de partage, flux, plan du site, robots.txt); redirections.
- Page `/exemple/` avec tous les blocs.

## Phase 1 : fondations (25 septembre 2026)

### Ajouts

- Projet Astro 7 en TypeScript strict, Tailwind 4 et MDX.
- Configuration en JSON et ses schémas; textes de l'interface, dates, montants et typographie québécoise centralisés.
- Collections, graphe de contenu et règles de publication; thème généré depuis `theme.json`.
- Gabarit général, en-tête, menus, tiroir mobile, pied de page, mode sombre; accueil composé depuis `homepage.json`.
- Contenu d'amorçage, entièrement en brouillon; script `check` et rapport « À vérifier »; tests unitaires.

## Phase 0 : cadrage (25 septembre 2026)

- Architecture, direction artistique et questions à l'auteur; réponses consignées; brief et références ajoutés au dépôt.
