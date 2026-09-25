# [NOM-DU-SITE]

Média en ligne sur la réglementation et la fiscalité des cryptoactifs au Canada et au Québec.

Site statique construit avec [Astro](https://astro.build) : le contenu est rédigé en fichiers (`content/`), les réglages sont en JSON (`config/`), et chaque construction vérifie tout le contenu avant de publier.

## Démarrer

Prérequis : Node.js 24 (voir `.nvmrc`; Node 22.12 au minimum).

```sh
npm install
npm run dev      # site local sur http://localhost:4321, brouillons visibles
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run check` | vérifications et rapport `docs/A-VERIFIER.md` |
| `npm run build` | vérifications, puis site de production dans `dist/` |
| `npm run preview` | sert `dist/` en local |
| `npm test` | tests unitaires |
| `npm run typecheck` | vérification des types |

`SITE_MODE=preview npm run build` construit une version d'aperçu : brouillons visibles, pages exclues des moteurs de recherche.

## Documentation

- [Guide de l'auteur](docs/GUIDE-AUTEUR.md) : faire vivre le site sans toucher au code.
- [Architecture](docs/ARCHITECTURE.md) : choix techniques, modèle de contenu, déploiement.
- [Direction artistique](docs/DA.md) : couleurs, typographie, composants.
- [Questions et réponses de l'auteur](docs/QUESTIONS.md).
- [Consignes pour les agents de code](CLAUDE.md).

## Organisation

```
content/     contenus (articles, dossiers, guides, fiches, taxonomies, images)
config/      réglages du site, menus, accueil, thème, textes de l'interface
data/        données produites par des scripts (cache de la veille)
src/         code du site (composants, gabarits, bibliothèques)
scripts/     commandes (check)
tests/       tests automatiques
docs/        documentation
```
