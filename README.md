# [NOM-DU-SITE]

Média en ligne sur la réglementation et la fiscalité des cryptoactifs au Canada et au Québec.

Site statique construit avec [Astro](https://astro.build) : le contenu est rédigé en fichiers (`content/`), les réglages sont en JSON (`config/`), et chaque construction vérifie tout le contenu avant de publier.

## Démarrer

Prérequis : Node.js 24 (voir `.nvmrc`; Node 22.18 au minimum, pour les scripts écrits en TypeScript).

```sh
npm install
npm run dev      # site local sur http://127.0.0.1:4321, brouillons visibles
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement, avec l'éditeur sur http://127.0.0.1:4321/keystatic |
| `npm run check` | vérifications et rapport `docs/A-VERIFIER.md` |
| `npm run build` | vérifications, site de production dans `dist/`, index de recherche (Pagefind), puis contrôles du résultat |
| `npm run preview` | sert `dist/` en local |
| `npm run new:article -- "Titre"` | crée un article en brouillon, prérempli (`-- "Titre" --guide` pour un guide : options après `--`) |
| `npm run newsletter:draft` | prépare le prochain numéro de l'infolettre; avec `-- --html`, produit le courriel dans `exports/infolettre/` |
| `npm run consent:version` | version du texte de consentement de l'infolettre et texte exact qu'elle désigne |
| `npm run content:format` | remet les fichiers de `content/` et `config/` au format de l'éditeur (`-- --verifier` : contrôle sans écrire) |
| `npm run veille:fetch` | relève les publications des sources de la veille officielle (`-- --diagnostic` : essai sans écrire) |
| `npm run surveillance` | vérifie que le site en ligne est à jour |
| `npm run trial` | construction d'aperçu, puis le site et son Worker en mode d'essai sur http://127.0.0.1:8791 : formulaires en mémoire, aucun secret, rien n'est envoyé |
| `npm test` | tests unitaires |
| `npm run test:e2e` | parcours de fumée dans Chromium (Playwright) : pages principales, accessibilité, formulaire d'infolettre |
| `npm run typecheck` | vérification des types |
| `npm run worker:size` | taille du Worker, 100 Kio au plus |

`SITE_MODE=preview npm run build` construit une version d'aperçu : brouillons visibles, pages exclues des moteurs de recherche.

Vérifications automatiques : à chaque envoi sur GitHub, la tâche `ci` lance les types, les tests, la construction, la taille du Worker et les parcours de fumée (guide de l'auteur, section 42).

En développement seulement, `/keystatic/` ouvre l'éditeur (formulaires en français au-dessus des fichiers, voir le guide de l'auteur), `/a-verifier/` affiche le rapport de vérification et `/exemple/` tous les blocs d'écriture. La recherche n'existe qu'après un build (`npm run build`, puis `npm run preview`).

## Mise en ligne

Hébergement prévu sur Cloudflare Workers (forfait gratuit) : Workers Builds construit le site à chaque envoi sur `main`, et un aperçu pour chaque autre branche. Le site n'est pas encore en ligne; procédure pas à pas : [guide de l'auteur, section 41](docs/GUIDE-AUTEUR.md#41-mettre-le-site-en-ligne).

## Documentation

- [Guide de l'auteur](docs/GUIDE-AUTEUR.md) : faire vivre le site sans toucher au code.
- [Architecture](docs/ARCHITECTURE.md) : choix techniques, modèle de contenu, déploiement.
- [Direction artistique](docs/DA.md) : couleurs, typographie, composants.
- [Questions et réponses de l'auteur](docs/QUESTIONS.md).
- [Historique des changements](docs/CHANGELOG.md).
- [Consignes pour les agents de code](CLAUDE.md).

## Organisation

```
content/     contenus (articles, dossiers, guides, fiches, taxonomies, images)
config/      réglages du site, menus, accueil, thème, textes de l'interface
data/        données produites par des scripts (cache de la veille)
src/         code du site (composants, gabarits, bibliothèques)
worker/      Worker Cloudflare : formulaires (/api/newsletter, /api/contact), sonde (/api/sante) et tâche planifiée
scripts/     commandes (check, contrôles après le build, new:article, newsletter:draft, consent:version, content:format, veille:fetch, surveillance, trial, worker:size)
.github/     tâches GitHub Actions (veille officielle, surveillance, rapport hebdomadaire, intégration continue)
exports/     courriels de l'infolettre produits en local (non versionné)
tests/       tests unitaires (Vitest) et parcours de fumée (tests/e2e/, Playwright)
docs/        documentation
```
