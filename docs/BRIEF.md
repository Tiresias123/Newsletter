# Brief pour Claude Code (Claude Fable 5.1), version 2
## Site de veille crypto, réglementation et fiscalité, Canada / Québec

Ce document est ton cahier des charges complet. Lis-le en entier avant d'écrire une seule ligne de code. Il décrit le projet, la référence de style (Cryptoast), la direction artistique, l'architecture attendue, le modèle de contenu, les pages, les fonctionnalités, la conformité canadienne et québécoise, l'expérience de l'auteur, le phasage et la feuille de route. La règle qui domine toutes les autres est énoncée au point 4 : tout ce qui se voit sur le site doit être modifiable par l'auteur sans toucher au code.

---

## 0. Ton rôle et ta posture

Tu es à la fois architecte logiciel senior, lead développeur front-end, product designer et responsable de la plateforme éditoriale. Tu travailles pour un auteur unique, juriste fiscaliste franco-canadien basé à Montréal, qui publiera seul au départ. Il est à l'aise avec Claude Code et Git mais il n'est pas développeur de métier. Il veut publier, corriger, réorganiser et rebrander son site sans jamais rouvrir un composant.

Avant de coder, tu réfléchis. La phase 0 (point 12) te demande de produire une architecture argumentée, des alternatives comparées et une liste de questions, puis de t'arrêter et d'attendre la validation de l'auteur. Tu ne scaffoldes rien avant ce feu vert.

Tes principes de travail :

- Tu privilégies les technologies éprouvées, stables et documentées à la nouveauté.
- Tu vérifies en ligne les versions courantes et la documentation officielle des briques que tu proposes avant de les retenir. Tes connaissances peuvent être en retard, la doc fait foi.
- Tu n'inventes jamais de contenu juridique ou fiscal. Quand tu dois remplir un gabarit, tu écris des marqueurs explicites du type `[À COMPLÉTER PAR L'AUTEUR]` ou `[À VÉRIFIER]`. L'auteur est l'expert du fond, tu es l'expert de la forme et de l'outil.
- Tu tranches toi-même les décisions techniques raisonnables sans me solliciter. Tu m'expliques avant de l'implémenter toute décision à impact majeur sur le coût, la sécurité, l'architecture, le référencement, le modèle économique ou la propriété des données, et tu m'indiques lesquelles sont irréversibles.
- Chaque fois que tu hésites entre coder une information et la rendre éditable, tu te poses une seule question : un éditeur non technique pourrait-il raisonnablement vouloir la modifier un jour sans développeur ? Si oui, elle va dans le contenu ou la configuration. Sinon, dans le code.
- Entre deux solutions, tu choisis la plus simple à maintenir par une personne seule, même si elle est moins impressionnante techniquement.
- Tu écris en français, avec les conventions typographiques québécoises décrites au point 8.
- Tu documentes tout ce que l'auteur devra faire seul plus tard.

---

## 1. Le projet

### 1.1 Positionnement

« Le média de référence sur la réglementation et la fiscalité des cryptoactifs au Canada et au Québec. »

Un vrai média éditorial professionnel, pas un blogue. À terme, le site doit être à la fois un média, une base de données structurée et une base de connaissances réglementaire : un lecteur qui arrive sur la fiche d'un organisme doit y trouver son rôle, les règles crypto qui en relèvent, ses dernières décisions, les articles, les guides et les documents officiels liés. L'architecture doit permettre cette évolution sans réécriture.

### 1.2 Périmètre éditorial, par ordre de priorité

1. La réglementation des cryptoactifs au Canada et au Québec : valeurs mobilières (ACVM, AMF du Québec, OCRI), lutte contre le blanchiment (CANAFE), paiements et stablecoins (Banque du Canada, ministère des Finances), institutions financières (BSIF), protection du consommateur, décisions et sanctions, décisions administratives et judiciaires, projets de loi fédéraux et provinciaux, obligations de conformité pour les particuliers et les entreprises.
2. La fiscalité des cryptoactifs au Canada et au Québec : impôt sur le revenu (ARC et Revenu Québec), gain en capital contre revenu d'entreprise, TPS/TVQ, déclarations et formulaires, obligations de déclaration internationales (CARF), positions administratives, jurisprudence.
3. L'actualité crypto générale (marchés, projets, entreprises, international) traitée avec un angle canadien et québécois, et l'actualité réglementaire étrangère lorsqu'elle a un effet au Canada.

Extension prévue, sans refonte : États-Unis, Union européenne, France, Suisse, Royaume-Uni, international. C'est pourquoi la juridiction est une entité à part entière (point 6.4).

### 1.3 Image et ton

Sérieux, institutionnel, juridique, financier, moderne, premium, très lisible. Le site doit donner l'impression d'un croisement entre un média financier, une revue juridique et une publication institutionnelle moderne. Titres informatifs, jamais sensationnalistes.

À éviter absolument : l'esthétique « casino crypto », les néons, les dégradés agressifs, l'imagerie meme, les interfaces de jeu, le orange bitcoin omniprésent, les pop-ups.

### 1.4 Public

Investisseurs particuliers et entrepreneurs québécois et canadiens, fiscalistes, comptables, avocats, journalistes, étudiants.

### 1.5 Langue

Français d'abord (conventions québécoises, vocabulaire officiel canadien : « cryptoactif », « plateforme de négociation de cryptoactifs », « valeurs mobilières », « $ CA »). L'architecture doit être prête pour une version anglaise ultérieure (contenus et chaînes d'interface organisés par locale) mais tu ne livres que le français en v1.

### 1.6 Nom

Le nom du site n'est pas arrêté. Utilise le jeton `[NOM-DU-SITE]` dans la configuration et pose la question en phase 0. Le nom, la baseline, le logo et le domaine doivent être changeables depuis un seul fichier de configuration.

---

## 2. Référence de style : Cryptoast (cryptoast.fr)

L'auteur veut retrouver l'esprit de présentation et les fonctionnalités de Cryptoast, appliqués à son sujet, avec une identité visuelle originale. Cryptoast est une source d'inspiration UX et éditoriale, rien d'autre : tu ne copies ni code, ni textes, ni images, ni logos, ni icônes propriétaires, ni structure au pixel près. Ce que tu reprends, ce sont les principes : densité d'information élevée, hiérarchie éditoriale forte, navigation rapide, cartes d'articles, catégories, dossiers, recherche, newsletter, excellente expérience mobile.

Si tu disposes d'un outil de navigation ou de fetch, va vérifier sur https://cryptoast.fr/ pour compléter. Sinon, fie-toi à la description ci-dessous, relevée le 24 septembre 2026.

### 2.1 Ce que Cryptoast fait et qu'il faut reprendre dans l'esprit

**En-tête**
- Logo à gauche, navigation principale horizontale, zone utilisateur à droite, bouton de recherche.
- Recherche avec résultats groupés par type (Prix, Guides et tutos, Fiches crypto, Actualités, NFT) et lien « Voir plus de résultats » par groupe.
- Menu mobile en tiroir : chaque entrée a une icône, un libellé et une ligne de description.
- Bascule « Mode nuit » avec une petite accroche.

**Page d'accueil, sections dans l'ordre**
1. « Sélection de la rédaction » : une grande carte principale (image, titre, chapô, auteur, date relative) et quatre cartes secondaires.
2. « Les dernières actus » : liste dense d'une vingtaine d'articles avec puce de catégorie, date relative (« Hier à 17h17 », « Il y a 2 jours »), auteur, bouton « Toutes les actus ».
3. « Les articles les plus lus ».
4. « Les derniers dossiers » : formats longs, une carte principale et trois liens.
5. « Les essentiels » : guides avec niveau (« Facile ») et durée (« 12 m »).
6. « Nos avis » (comparatifs).
7. « Les cryptos en bref » : capitalisation totale, prix du bitcoin, dominance, variations.
8. « Cryptos tendance » : liste avec rang, variation, prix.
9. Formations, fiches cryptos, vidéos, chacune avec un lien « Toutes nos… ».
10. Widget de retour d'avis sur le site.
11. Pied de page : réseaux sociaux, colonne « À propos », colonne « Mentions légales », logo, copyright.

**Gabarit d'article**
- Fil d'Ariane : Accueil » Actu » Catégorie » Titre.
- H1, puis chapô en exergue.
- Ligne de métadonnées : « le 23 septembre 2026 à 15:00 », « 4 minutes de lecture », avatar et nom de l'auteur cliquable.
- Image de couverture 1600 × 800 avec crédit sous l'image.
- Barre de partage : X, Facebook, LinkedIn, WhatsApp, Telegram, copie du lien, flux RSS.
- Corps structuré en H2, encadrés « Pour approfondir » et « Bon à savoir », citations avec attribution, vidéo intégrée.
- Blocs partenaires signalés « Lien affilié – Publicité ».
- Ligne « Sources : … » en italique en fin d'article.
- Bloc newsletter : titre, sous-titre, champ courriel, case de consentement liée à la politique de confidentialité.
- Paragraphe d'avertissement (risque, absence de conseil).
- Carte auteur : photo, bio, nombre d'articles, réseaux.
- Colonne latérale : carte de présentation du média, compteurs de réseaux sociaux, articles les plus lus.
- Section « D'autres articles sur [étiquette] ».
- Métadonnées techniques : Open Graph article avec dates de publication et de modification, libellés « Écrit par » et « Durée de lecture estimée », theme-color, flux RSS.

**Pages de catégorie** : hub avec sous-catégories, grille d'articles, pagination.

**Fiches et guides** : fiches par actif avec données en direct, guides avec niveau et temps de lecture.

### 2.2 Transposition à notre sujet

| Chez Cryptoast | Chez nous |
|---|---|
| Actualités / Formations / Cours / Cryptomonnaies / Acheter | Actualités / Réglementation / Fiscalité / Dossiers / Juridictions / Organismes / Veille officielle / Guides / Lexique / Agenda / Newsletter |
| Fiches crypto (prix, rang) | Fiches organismes, fiches textes, fiches juridictions |
| Guides « Facile 12 m » | Guides pratiques avec niveau et durée |
| « Les cryptos en bref » et « Cryptos tendance » | Même chose, en dollars canadiens, section optionnelle |
| « Les derniers dossiers » | Dossiers réglementaires vivants, datés « vérifié le », avec chronologie, statut, obligations |
| Blocs affiliés | Composant « bloc partenaire » piloté par la configuration, désactivé par défaut, toujours signalé |
| Sources en fin d'article | Bloc de sources structuré, source officielle obligatoire en réglementation et fiscalité |

### 2.3 Ce qu'il ne faut pas reprendre en v1

Gamification, espace membre, application mobile, commentaires, publicités intrusives, slide-in promotionnels, pop-ups.

---

## 3. Direction artistique : déclinaison de bleu roi

Concept : la précision juridique rencontre la crypto. Une identité construite sur le bleu roi, la grille, les lignes, la typographie, la donnée et le document, réutilisable telle quelle dans la newsletter, sur LinkedIn et X, dans un PDF ou un rapport. Beaucoup de blanc et d'espace négatif. Pas de logo crypto cliché.

Tout est exprimé en jetons dans `config/theme.json`, converti en variables CSS au build. L'auteur doit pouvoir changer une teinte dans ce fichier et voir tout le site suivre.

### 3.1 Palette

**Échelle de marque (bleu roi)**

| Jeton | Hex | Usage |
|---|---|---|
| brand-50 | #EEF2FF | fonds très clairs, survols de lignes |
| brand-100 | #DDE4FF | fonds de puces, encadrés info |
| brand-200 | #BBC9FF | bordures actives |
| brand-300 | #8FA6FF | fonds de puces claires |
| brand-400 | #5F7CF6 | primaire en mode sombre, icônes |
| brand-500 | #3B5BEA | survol du primaire |
| brand-600 | #2743D3 | primaire (boutons, liens, logo, navigation, appels à l'action) |
| brand-700 | #1E35AD | primaire pressé, titres colorés |
| brand-800 | #182B88 | fonds de bandeaux |
| brand-900 | #132264 | pied de page, dossiers |
| brand-950 | #0B1440 | bleu nuit, fond du mode sombre |

**Accent chaud (or), facultatif et limité** : gold-100 #FFF4CC, gold-500 #E0A800, gold-600 #B98700. Réservé aux totaux des exemples chiffrés et aux badges d'échéance fiscale de l'agenda. Désactivable dans `theme.json` (le site reste alors strictement bleu et neutre).

**Neutres froids** : ink #0E1230 (texte), slate-700 #3C4262 (texte secondaire), slate-500 #6B7190 (métadonnées), slate-300 #C3C7D9 (bordures), slate-200 #E1E4EF (séparateurs), slate-100 #F1F3F9 (fonds de sections), canvas #F7F8FC (fond de page), surface #FFFFFF (cartes).

**Sémantiques** : succès #1B9E5B, danger #D6323C, avertissement #D97706, information brand-600.

**Mode sombre** : fond #0A0E27 (bleu nuit, jamais noir pur), surfaces #111634 et #181E44, bordures #262D5C, texte #E7EAF6, texte secondaire #A6ADCC, primaire brand-400, liens #9DB0FF, images légèrement atténuées. Le mode sombre est livré en v1 parce qu'il est presque gratuit avec des jetons, mais il ne passe jamais avant la lisibilité du mode clair.

**Couleurs de catégories et de juridictions**, sobres, toutes dans l'échelle bleue : Actualités brand-500, Réglementation brand-700, Fiscalité brand-900 sur brand-100, Analyses brand-400, Dossiers brand-900, Guides brand-800 sur brand-100, Opinion slate-700 sur slate-100. Juridictions : Canada brand-600 plein, Québec brand-600 contour avec pastille brand-900, autres juridictions slate-500 contour. Pas quarante couleurs.

Vérifie chaque paire texte/fond avec un contraste AA minimum (4,5:1 pour le texte courant, 3:1 pour les grands titres). Ajuste si nécessaire et documente les ajustements.

### 3.2 Typographie

- Titres : Manrope (700 et 800), lettrage légèrement resserré, interligne 1,15. Tu peux proposer Inter ou Geist en alternative en phase 0, et une serif très légère pour certains titres éditoriaux si cela renforce l'identité, avec justification.
- Texte courant : Inter (400, 500, 600), interligne 1,6, `font-variant-numeric: tabular-nums` sur les chiffres.
- Échelle : 12, 14, 16, 18, 20, 24, 30, 36, 48 px, en rem.
- Corps d'article : 18 px sur ordinateur, largeur de lecture maximale 720 px.
- Priorités : lisibilité mobile, hiérarchie, chiffres, dates, tableaux et citations de textes juridiques très lisibles.
- Polices auto-hébergées, `font-display: swap`, sous-ensembles latins.

### 3.3 Mise en page et composants

- Conteneur 1240 px, grille 12 colonnes, gouttière 24 px. Pages de contenu : 8 colonnes de contenu, 4 colonnes de barre latérale collante à 340 px.
- En-tête 64 px, précédé d'un bandeau d'annonce facultatif (message et lien depuis `site.json`) et d'un ticker facultatif de 36 px.
- Cartes d'articles : un seul composant `ArticleCard` avec variantes `featured`, `large`, `medium`, `small`, `horizontal`, `compact`, toutes alimentées par le même objet article (image, catégorie, juridictions, titre, chapô, auteur, date, temps de lecture, statut). Rayon 12 px, bordure 1 px, ombre douce au survol avec translation de 2 px, image 2:1, puce de catégorie sur l'image.
- Inventaire du système de design : Button, Badge, CategoryBadge, JurisdictionBadge, StatusBadge, Tag, Card, ArticleCard, AuthorCard, SourceCard, NewsletterCard, Alert, Callout, Timeline, Table, Accordion, Breadcrumb, Pagination, SearchModal, Header, MobileDrawer, Footer, Sidebar, Dropdown, Tabs, ShareButtons. Un composant générique par besoin, jamais de variantes par sujet (`ArticleCard`, pas `TaxArticleCard`).
- Boutons : rayon 10 px, primaire brand-600 sur blanc, secondaire brand-100 sur brand-700, fantôme.
- Encadrés d'article : filet gauche de 4 px dans la couleur du type, fond teinté.
- Icônes : Lucide.
- Micro-interactions sobres (survol, soulignement, menus, en-tête collant), transitions 150 à 200 ms, `prefers-reduced-motion` respecté.

### 3.4 Images et visuels

- Couvertures 1600 × 800, WebP, générées par `astro:assets` en plusieurs tailles.
- Générateur de couverture par défaut sur dégradé bleu roi avec motif de grille, puce de catégorie et titre, quand l'auteur n'a pas d'image.
- Images Open Graph générées au build pour chaque page.
- Gabarits partageables (carte sociale, en-tête de newsletter) dérivés des mêmes jetons, exportables en PNG par un script.
- Logo : mot-symbole temporaire en Manrope 800 bleu roi, remplaçable par un SVG référencé dans `config/site.json`. Favicon et icônes dérivés.

---

## 4. Principe cardinal : tout est contenu ou configuration

Le code définit le système, le contenu définit le fond, la configuration éditoriale définit la présentation.

L'auteur doit pouvoir, sans ouvrir `src/` :

- créer, modifier, programmer, dépublier, archiver un article, un dossier, un guide, une fiche (organisme, texte, juridiction, traitement fiscal), un terme du lexique, une entrée d'agenda, un numéro de newsletter, une page statique ;
- changer le nom du site, la baseline, le logo, les couleurs, les polices, le bandeau d'annonce ;
- réorganiser, activer, désactiver, renommer les sections de la page d'accueil, choisir manuellement les articles mis en avant ;
- modifier les menus (en-tête, sous-menus, tiroir mobile, pied de page) ;
- éditer les textes d'interface, les appels à l'action, les textes du bloc newsletter, les avertissements et les mentions ;
- créer ou renommer une catégorie, un thème, une étiquette ;
- ajouter ou retirer un actif du ticker, une source officielle à la veille, une redirection ;
- activer un bloc partenaire.

### 4.1 Règles d'implémentation

- Aucune chaîne visible par l'utilisateur dans `src/`. Toutes les chaînes d'interface vivent dans `config/i18n/fr.json`.
- Aucun contenu éditorial dans `src/`. Interdit : un tableau d'articles en dur dans un composant. Un composant reçoit un objet (`<ArticleCard article={article} />`), jamais des valeurs littérales.
- Chaque composant lit sa configuration, il ne la contient pas.
- Les schémas de contenu sont validés (zod via les collections Astro). Un contenu invalide fait échouer le build avec un message clair en français qui dit quel fichier et quel champ corriger.
- Le dépôt Git est la source de vérité. Chaque publication est un commit, donc réversible.

### 4.2 Arborescence cible

```
[NOM-DU-SITE]/
├── content/
│   ├── articles/            un fichier MDX par article
│   ├── dossiers/            dossiers réglementaires vivants
│   ├── guides/
│   ├── juridictions/        fiches juridictions
│   ├── organismes/          fiches des autorités et administrations
│   ├── textes/              fiches lois, règlements, avis, décisions, positions
│   ├── sources/             sources réutilisables (facultatif, voir 6.9)
│   ├── traitements-fiscaux/ matrice fiscale (activité × contribuable × juridiction)
│   ├── lexique/
│   ├── agenda/
│   ├── auteurs/
│   ├── newsletters/
│   ├── taxonomies/          catégories, thèmes, formats (libellés, couleurs, descriptions)
│   └── pages/               à-propos, méthodologie, politique de correction, mentions, confidentialité, avertissement, transparence, contact
├── config/
│   ├── site.json            nom, baseline, description, domaine, contact, réseaux, locale, fuseau America/Toronto, bandeau d'annonce
│   ├── navigation.json      en-tête avec sous-menus, tiroir mobile, pied de page
│   ├── homepage.json        liste ordonnée de sections (voir 7.3)
│   ├── theme.json           jetons clair/sombre, polices, rayons, accent or activé ou non
│   ├── ticker.json
│   ├── newsletter.json      fournisseur, textes, consentement, fréquence
│   ├── legal.json           variantes d'avertissements, mentions, responsable des renseignements personnels
│   ├── sources-veille.json  flux RSS officiels
│   ├── ads.json             blocs partenaires et commanditaires (désactivés par défaut)
│   ├── redirects.json       redirections manuelles (les redirections automatiques viennent des anciens slugs)
│   └── i18n/fr.json
├── public/images/
├── src/                     composants, layouts, pages dynamiques, utilitaires (zéro contenu)
├── scripts/                 new:article, check, newsletter:draft, veille:fetch, og:generate
├── docs/                    ARCHITECTURE.md, DA.md, GUIDE-AUTEUR.md, A-VERIFIER.md, CHANGELOG.md
├── keystatic.config.ts
├── CLAUDE.md
└── README.md
```

---

## 5. Architecture technique : évaluer honnêtement deux familles

Deux familles de solutions sont crédibles. Tu dois les comparer sérieusement en phase 0, sans parti pris, et recommander.

### 5.1 Famille A, statique et Git (ma préférence par défaut)

Astro (dernière version stable), TypeScript, MDX, Tailwind alimenté par les jetons de `theme.json`, Keystatic comme interface d'édition (mode local en développement, mode GitHub en production, sur `/keystatic`), Pagefind pour la recherche, CoinGecko pour les données de marché en CAD, satori et resvg pour les images OG au build, Cloudflare Pages ou Vercel avec fonctions serverless pour les formulaires, GitHub Actions pour les reconstructions planifiées, Plausible ou Umami pour l'analytique sans témoins, Turnstile contre le pourriel, Resend pour les courriels transactionnels.

Forces : coût proche de zéro, aucune base de données ni serveur à exploiter, sauvegarde triviale (cloner le dépôt), contenu versionné et portable (Markdown), très rapide, très sûr.

Faiblesses réelles à ne pas cacher : pas de rôles ni de permissions fines (ce sont les droits GitHub qui en tiennent lieu), pas de sauvegarde automatique ni de tableau de bord natif dans Keystatic, publication programmée émulée (date future filtrée au build, reconstruction planifiée) et non native, aperçu par branche plutôt qu'aperçu instantané.

### 5.2 Famille B, application avec CMS et base de données

Next.js avec Payload CMS (ou Sanity, Strapi, Directus), PostgreSQL, stockage d'images S3 compatible (Cloudflare R2 par exemple), déploiement Vercel ou équivalent.

Forces : rôles et permissions, brouillons et versions natifs, sauvegarde automatique, publication programmée native, aperçu en direct, tableau de bord d'administration complet, relations riches.

Faiblesses : une base de données et un serveur à héberger, sauvegarder et mettre à jour, coûts mensuels récurrents, dépendance à l'évolution du CMS, migration de contenu plus lourde en cas de changement.

### 5.3 Comment trancher

Compare les deux familles (et, dans la famille B, Payload contre Sanity contre Strapi) sur ces critères : facilité d'administration pour un non-technicien, contrôle du code, contenu structuré et relations, référencement, versions et historique, brouillons et aperçu, publication programmée, gestion des médias, recherche, extensibilité, coût mensuel à 0, à 1 000 et à 10 000 visiteurs par jour, complexité d'exploitation pour une personne seule, portabilité du contenu.

Règle de décision que je te donne : si l'auteur reste seul dans les douze prochains mois et publie quelques fois par semaine, la famille A l'emporte. Si plusieurs contributeurs, un relecteur juridique, un workflow de validation ou une publication programmée à l'heure près sont attendus dès la v1, la famille B devient raisonnable. Pose-moi la question (point 13) et documente le chemin de migration de A vers B (import du Markdown dans Payload par script) pour que le choix A ne soit pas une impasse.

Exigences non négociables quelle que soit la famille : contenu portable et exportable, édition par formulaires avec aperçu, libellés d'administration en français et compréhensibles par un juriste (« Juridiction », « Date d'entrée en vigueur », « Source officielle », jamais `jurisdictionId`), groupes de champs (Contenu, Publication, Référencement, Réglementation, Fiscalité, Sources, Relations, Newsletter, Révision), coût d'exploitation minimal, sauvegarde simple.

---

## 6. Modèle de contenu

Définis chaque collection avec un schéma validé. Les champs ci-dessous sont attendus, tu peux en proposer d'autres en phase 0. Les relations entre Article, Dossier, Texte, Organisme, Juridiction, Traitement fiscal et Source sont le cœur du projet : un article lié à un dossier doit afficher automatiquement le statut, l'autorité, la juridiction, la date d'entrée en vigueur, les sources officielles et les articles frères.

### 6.1 Articles (`content/articles/`)

**Contenu** : `title`, `slug`, `dek` (chapô, 160 à 300 caractères), `cover` (`src`, `alt`, `credit`, `creditUrl`), corps MDX, `tldr` (3 à 5 puces « L'essentiel »).

**Classement** : `category` (référence à la taxonomie : actualites, reglementation, fiscalite, analyses, opinion), `format` (actualite, analyse, explication, guide-pratique, mise-a-jour-reglementaire, synthese-de-document, entretien, opinion, etude-de-cas), `themes` (multi, taxonomie : valeurs-mobilieres, plateformes, lutte-blanchiment, stablecoins, paiements, banques-institutions, protection-consommateur, sanctions-decisions, projets-de-loi, impot-revenu, gain-capital-revenu-entreprise, tps-tvq, declarations-formulaires, carf-international, positions-administratives, jurisprudence, marches, entreprises, international), `jurisdictions` (multi, références à la collection juridictions), `tags` (libres).

**Publication** : `author` (référence), `publishedAt`, `updatedAt` (fuseau America/Toronto), `status` (brouillon, programme, publie, archive), `featured`, `editorsPick`, `breaking`, `newsletterEligible`, `previousSlugs` (génère automatiquement des redirections 301).

**Fiabilité** : `asOf` (« vérifié le », obligatoire pour reglementation et fiscalite), `reviewEvery` (aucun, 3, 6 ou 12 mois), `reviewedBy` (facultatif), `corrections` (tableau de `{ date, note }` affiché sous le titre : « Correction du 12 septembre 2026 : … »), `disclaimerVariant` (choisit l'avertissement dans `legal.json` : general, fiscal, reglementaire, opinion, aucun).

**Sources** : `sources`, tableau d'entrées qui sont soit une référence à la collection sources, soit une source ponctuelle `{ label, url, type, date, archivedUrl }`. Règle de validation : si la catégorie vaut reglementation ou fiscalite, au moins une source de type officiel est obligatoire, sinon le build échoue.

**Relations** : `relatedDossiers`, `relatedTextes`, `relatedOrganismes`, `relatedTraitements`, `relatedArticles` (manuel, complété automatiquement par thèmes).

**Référencement** : `seo` (`title`, `description`, `canonical`, `socialImage`, `noindex`).

`readingTime` est calculé (200 mots par minute).

### 6.2 Dossiers (`content/dossiers/`)

Pages vivantes consacrées à une réglementation ou à un sujet réglementaire.

- `title`, `shortTitle`, `slug`, `summary`, `cover`
- `status` : projet, consultation, adopte, en-vigueur, partiellement-en-vigueur, modifie, abroge, retire (badge visuel par statut)
- `jurisdictions`, `themes`, `authorities` (références organismes)
- Dates : `proposalDate`, `publicationDate`, `adoptedDate`, `effectiveDate`, `implementationDate`, `repealDate` (toutes facultatives)
- `whoIsAffected` (multi : particuliers, entreprises, plateformes, emetteurs, professionnels, institutions)
- `keyChanges` (liste), `obligations` (liste), `sanctions` (liste), `taxImplications` (texte)
- `timeline` : tableau de `{ date, title, description, url }` rendu en frise verticale
- `keyTextes`, `sources`, `faq` (rendu en FAQPage)
- `asOf`, `reviewEvery`, `corrections`
- Corps MDX
- Articles liés remontés automatiquement

### 6.3 Guides (`content/guides/`)

Mêmes champs qu'un article plus `level` (facile, moyen, avance), `duration` en minutes, `steps` facultatif, `prerequisites`, `audience` (particuliers, entreprises, professionnels).

### 6.4 Juridictions (`content/juridictions/`)

Entité à part entière, condition de l'extension future.

- `name`, `slug`, `level` (federal, provincial, supranational, national, international), `country`, `description`, `icon`
- `organismes`, `keyDossiers`, `keyTraitements` (références)
- `seo`, corps MDX (présentation, cadre général)
- Page `/juridictions/[slug]/` composée automatiquement : présentation, actualités, réglementation, fiscalité, organismes, agenda, FAQ

Amorçage : Canada, Québec, Ontario, Colombie-Britannique, Alberta, États-Unis, Union européenne, France, Suisse, Royaume-Uni, International.

### 6.5 Organismes (`content/organismes/`)

- `name`, `acronym`, `slug`, `jurisdiction`, `authorityType` (regulateur-valeurs-mobilieres, administration-fiscale, banque-centrale, renseignement-financier, ministere, organisme-autoreglementation, tribunal, autre)
- `role`, `website`, `rssFeeds`, `logo`
- Corps MDX (mandat, pouvoirs, textes de référence)
- Page composée : description, rôle, juridiction, site officiel, dossiers et textes liés, dernières décisions (textes de type decision), derniers articles, guides, ressources

Amorçage : AMF (Autorité des marchés financiers du Québec), ACVM, OCRI, CANAFE, ARC, Revenu Québec, Banque du Canada, BSIF, ministère des Finances du Canada, ministère des Finances du Québec, CVMO.

### 6.6 Textes (`content/textes/`)

- `title`, `shortTitle`, `slug`, `type` (loi, reglement, projet-de-loi, avis-du-personnel, instruction-generale, bulletin-interpretation, folio, position-administrative, decision-administrative, decision-judiciaire, consultation)
- `issuer` (référence organisme), `jurisdiction`, `officialUrl`, `archivedUrl`, `documentNumber`, `citation`
- `adoptedAt`, `inForceAt`, `status`, `summary`, `keyProvisions`, corps MDX

### 6.7 Traitements fiscaux (`content/traitements-fiscaux/`)

Matrice fiscale structurée, alimentée progressivement par l'auteur, qui deviendra la partie « base de connaissances » la plus utile du site.

- `jurisdiction`, `taxpayerType` (particulier, societe, fiducie, professionnel, trader, mineur, staker, participant-defi, participant-nft)
- `activity` (achat, vente, echange, transfert, minage, staking, pret, emprunt, defi, nft, airdrop, don, paiement, salaire, activite-entreprise)
- `taxType` (impot-revenu, gain-capital, tps-tvq, retenue, declaration-information)
- `taxableEvent`, `treatment` (résumé), `reportingRequirement`, `forms`, `sources`, `asOf`, `reviewEvery`, corps MDX
- Page `/fiscalite/traitements/` : tableau filtrable par juridiction, type de contribuable et activité, chaque ligne ouvrant la fiche. Jamais présenté comme un conseil personnalisé : l'avertissement fiscal s'affiche systématiquement.

### 6.8 Lexique (`content/lexique/`)

`term`, `slug`, `shortDefinition` (une phrase, pour les infobulles), corps MDX, `seeAlso`, `officialSources`.

### 6.9 Sources (`content/sources/`)

Collection facultative de sources réutilisables, pour citer le même document dans plusieurs contenus sans le ressaisir.

- `title`, `sourceType` (legislation, reglement, gouvernement, regulateur, decision-justice, doctrine-administrative, consultation, communique, rapport, universitaire, industrie, presse)
- `issuer`, `jurisdiction`, `url`, `archivedUrl`, `documentDate`, `accessedDate`, `documentNumber`, `citation`

Le script `check` signale les sources sans `archivedUrl` et propose une commande pour en créer une via l'API de la Wayback Machine (implémentation en v2 si complexe).

### 6.10 Agenda (`content/agenda/`)

`title`, `date`, `endDate`, `type` (echeance-fiscale, consultation, entree-en-vigueur, audience, evenement), `jurisdiction`, `url`, `description`, `relatedDossier`. Export ICS. Alimente la section « À surveiller ».

### 6.11 Auteurs (`content/auteurs/`)

`name`, `slug`, `avatar`, `role`, `bio`, `mentionProfessionnelle` (ligne libre laissée à l'auteur), `socials`.

### 6.12 Newsletters (`content/newsletters/`)

`subject`, `sentAt`, `issueNumber`, corps MDX, `providerId`, `sponsor` (référence facultative dans `ads.json`).

### 6.13 Taxonomies (`content/taxonomies/`)

Catégories, thèmes et formats sont des fichiers de données (libellé, slug, description, couleur parmi les jetons, ordre). L'auteur peut en créer ou en renommer sans code.

### 6.14 Pages (`content/pages/`)

`title`, `slug`, `updatedAt`, `noindex`, corps MDX avec les blocs du point 6.15 plus les blocs de page (`Hero`, `ListeArticles` filtrable, `CarteAuteur`, `Newsletter`, `ListeSources`, `FAQ`, `Chronologie`, `Tableau`). C'est le constructeur de pages : à propos, méthodologie, politique éditoriale, politique de correction, transparence, mentions légales, politique de confidentialité, avertissement, contact, FAQ.

### 6.15 Blocs riches disponibles dans l'éditeur

À implémenter comme composants MDX et comme blocs de l'interface d'édition, sans jamais nécessiter de code pour être utilisés :

- `Callout` avec variantes : `important`, `a-retenir`, `attention`, `en-pratique`, `exemple`, `date-a-retenir`, `ce-qui-change`, `pour-les-particuliers`, `pour-les-entreprises`, `source-officielle`, `mise-a-jour`, `pour-approfondir` (lien interne), `bon-a-savoir`
- `TexteDeLoi` : citation littérale d'une disposition avec référence, version citée et lien vers la source officielle
- `ExempleChiffre` : encadré de calcul fiscal avec lignes libellé/montant et total, en dollars canadiens formatés
- `Chronologie`, `Comparatif` (tableau responsive), `Citation` avec attribution, `Video` (youtube-nocookie), `Definition` (infobulle depuis le lexique), `MiseEnGarde`, `StatutReglementaire` (badge de statut d'un dossier lié), `BlocPartenaire` (seulement si activé dans `ads.json`, toujours signalé « Publicité »)

---

## 7. Pages, routes et gabarits

### 7.1 Routes

Deux architectures d'URL sont possibles, tu recommandes en phase 0 :

- Option A : `/[category]/[slug]/` pour les articles, `/dossiers/[slug]/` pour les dossiers.
- Option B : `/actualites/[slug]/` pour tous les articles, `/reglementation/[juridiction]/[slug]/` pour les dossiers réglementaires, `/fiscalite/[juridiction]/[slug]/` pour les traitements et guides fiscaux.

Routes attendues dans tous les cas :

| Route | Contenu |
|---|---|
| `/` | page d'accueil composée depuis `homepage.json` |
| `/actualites/`, `/reglementation/`, `/fiscalite/`, `/analyses/`, `/opinion/` | hubs de catégorie avec filtres par thème, format et juridiction, pagination |
| `/dossiers/`, `/dossiers/[slug]/` | dossiers vivants |
| `/guides/`, `/guides/[slug]/` | guides |
| `/juridictions/`, `/juridictions/[slug]/` | fiches juridictions |
| `/organismes/`, `/organismes/[slug]/` | fiches organismes |
| `/textes/`, `/textes/[slug]/` | fiches textes |
| `/fiscalite/traitements/`, `/fiscalite/traitements/[slug]/` | matrice fiscale |
| `/lexique/`, `/lexique/[slug]/` | lexique avec index alphabétique |
| `/veille/` | publications officielles agrégées, filtres par source, date, juridiction |
| `/agenda/` | échéances, export ICS |
| `/auteurs/[slug]/` | page auteur |
| `/newsletter/`, `/newsletter/[issue]/` | abonnement et archive |
| `/recherche/` | recherche avec résultats groupés et filtres |
| `/themes/[theme]/`, `/tags/[tag]/`, `/formats/[format]/` | listes |
| pages statiques | à propos, méthodologie, politique de correction, transparence, contact, mentions légales, confidentialité, avertissement |
| `/rss.xml`, `/[category]/rss.xml`, `/feed.json`, `/sitemap-index.xml`, `/robots.txt` | flux |
| `/keystatic` (ou l'admin du CMS retenu) | édition |
| `/404` | page personnalisée |

Les anciennes URL ne disparaissent jamais : `previousSlugs` et `redirects.json` produisent des redirections 301, chaque page porte sa canonique.

### 7.2 Gabarit d'article (dans l'ordre)

1. Fil d'Ariane.
2. Puce de catégorie, puce de format, puces de juridiction.
3. H1.
4. Chapô en exergue.
5. Ligne de métadonnées : date de publication, « mis à jour le », « X minutes de lecture », auteur avec avatar.
6. Bloc de confiance pour la réglementation et la fiscalité : « Vérifié le [date] », « Cette information concerne : [juridictions] », « Entrée en vigueur : [date] » si un dossier est lié, « Révisé par » si renseigné, notes de correction.
7. Couverture avec crédit.
8. Barre de partage (X, LinkedIn, Facebook, WhatsApp, Telegram, courriel, copie du lien) et bouton « Signaler une erreur » (mailto préconfiguré avec l'URL de l'article).
9. Encadré « L'essentiel ».
10. Table des matières générée, collante dans la barre latérale sur ordinateur, repliable sur mobile.
11. Corps de l'article avec les blocs riches.
12. Bloc « Cette réglementation » quand un dossier est lié : statut, autorité, juridiction, dates clés, lien vers le dossier.
13. Bloc « Sources » : liste structurée, sources officielles en premier avec icône distinctive, lien d'archive si disponible.
14. Bloc « Textes, organismes et traitements liés ».
15. Bloc newsletter.
16. Avertissement selon `disclaimerVariant`.
17. Carte auteur.
18. Articles liés : même dossier d'abord, puis mêmes thèmes, puis même catégorie (six cartes).
19. Barre latérale : présentation du site, table des matières, sélection de la rédaction, dossiers en vedette, bloc newsletter compact.

### 7.3 Sections de la page d'accueil

Chaque entrée de `homepage.json` porte : `type`, `title`, `subtitle`, `enabled`, `order` (implicite par position), `source` (auto ou manuel), `filters` (catégorie, format, thèmes, juridictions, tags), `manualSelection` (liste de slugs), `count`, `layout` (featured, grid, list, compact, horizontal), `background` (default, brand, muted), `cta` (`label`, `url`). Types à implémenter :

- `hero-selection` : une grande carte plus quatre petites, sélection manuelle ou `editorsPick`
- `content-block` : le bloc générique qui couvre « Dernières nouvelles », « Réglementation », « Fiscalité », « Canada », « Québec » et tout autre filtre
- `dossiers-strip`, `essentials` (guides), `watchlist` (« À surveiller » : agenda à venir et dossiers en consultation), `veille-latest`, `lexique-spotlight`, `market-brief`, `trending-assets`, `most-read` (liste manuelle en v1, branchement analytique en v2), `newsletter-cta`, `partner-block` (désactivé), `custom-html` (échappé, documenté)

Exemple :

```json
{
  "sections": [
    { "type": "hero-selection", "enabled": true, "title": "Sélection de la rédaction", "source": "manual", "manualSelection": ["slug-1", "slug-2"] },
    { "type": "content-block", "enabled": true, "title": "Dernières actualités", "layout": "list", "count": 20 },
    { "type": "content-block", "enabled": true, "title": "Réglementation", "filters": { "category": "reglementation" }, "layout": "grid", "count": 6, "background": "brand" },
    { "type": "content-block", "enabled": true, "title": "Fiscalité", "filters": { "category": "fiscalite" }, "layout": "grid", "count": 6 },
    { "type": "content-block", "enabled": true, "title": "Québec", "filters": { "jurisdictions": ["quebec"] }, "layout": "compact", "count": 6 },
    { "type": "watchlist", "enabled": true, "title": "À surveiller" },
    { "type": "dossiers-strip", "enabled": true, "title": "Dossiers" },
    { "type": "veille-latest", "enabled": true, "title": "Veille officielle", "count": 8 },
    { "type": "newsletter-cta", "enabled": true }
  ]
}
```

### 7.4 Navigation

`navigation.json` décrit des entrées à deux niveaux (sous-menus déroulants sur ordinateur, accordéon dans le tiroir mobile) avec `label`, `url`, `children`, `enabled`, `openInNewTab`, `highlight`, `badge`, `icon`, `description`. Exemple de structure par défaut : Accueil, Actualités (Canada, Québec, États-Unis, International), Réglementation (Canada, Québec, Provinces, International), Fiscalité (Particuliers, Entreprises, DeFi et staking, Traitements fiscaux), Dossiers, Guides, Organismes, Newsletter. Rien de tout cela n'est en dur.

---

## 8. Fonctionnalités transverses

### 8.1 Interface

- Mode sombre avec bascule, préférence mémorisée, aucun flash au chargement.
- Bandeau d'annonce facultatif sous l'en-tête (« Les dernières évolutions réglementaires du Canada et du Québec », lien, activable).
- Ticker facultatif en dollars canadiens, mis en cache, masqué proprement si l'API est indisponible.
- Recherche instantanée dans une fenêtre modale, résultats groupés (Articles, Dossiers, Guides, Organismes, Textes, Juridictions, Lexique, Auteurs), filtres par type, juridiction et date, raccourci clavier. Architecture qui permette de brancher plus tard un moteur dédié ou une recherche sémantique sans réécrire l'interface.
- Dates relatives en français jusqu'à sept jours, absolues ensuite, fuseau America/Toronto.
- Temps de lecture automatique.
- Menu mobile en tiroir avec icône, libellé et description, pensé comme une application d'information : logo, recherche, menu.
- Feuille de style d'impression pour les dossiers, fiches et traitements fiscaux.
- Lien d'évitement, focus visible, navigation clavier complète, contraste AA, textes alternatifs obligatoires, structure de titres propre, attributs ARIA sur les composants interactifs. Objectif WCAG 2.2 AA.

### 8.2 Publication programmée et fraîcheur

- Un contenu avec `status: programme` et une `publishedAt` future n'est pas construit avant sa date. Une reconstruction planifiée (GitHub Actions, toutes les heures aux heures ouvrables, toutes les six heures sinon, paramétrable) le fait apparaître. Documente précisément la latence attendue.
- Le script `check` produit `docs/A-VERIFIER.md` et une page `/a-verifier/` disponible uniquement en développement : contenus dont `asOf` plus `reviewEvery` est dépassé, contenus de réglementation ou de fiscalité sans source officielle, sources sans archive, liens internes ou externes cassés, images sans alt ni crédit, images trop lourdes, dates incohérentes, brouillons anciens, articles programmés.

### 8.3 Référencement et flux

- Sitemap, robots, canoniques, Open Graph et cartes X complets, images OG générées.
- Schema.org : NewsArticle ou Article, BreadcrumbList, Organization, Person, FAQPage pour les dossiers et pages FAQ, DefinedTerm pour le lexique, GovernmentOrganization pour les organismes quand pertinent.
- RSS global, RSS par catégorie, JSON Feed.
- Balises `hreflang` prêtes pour l'anglais.

### 8.4 Veille officielle

Script `veille:fetch` exécuté au build et par le cron : lit `sources-veille.json`, dédoublonne, normalise les dates, conserve un cache JSON dans le dépôt pour éviter les trous en cas de panne d'une source, alimente `/veille/` et la section d'accueil. Sources initiales à configurer si elles offrent un flux (vérifie chaque URL) : AMF Québec, ACVM, OCRI, CANAFE, ARC, Revenu Québec, Banque du Canada, BSIF, ministère des Finances du Canada, Gazette du Canada, Gazette officielle du Québec, LEGISinfo, Assemblée nationale du Québec, CVMO.

### 8.5 Newsletter

- Une abstraction `NewsletterProvider` (interface unique : abonner, confirmer, désabonner, étiqueter, lister) avec une implémentation pour le fournisseur retenu et une implémentation de test. Aucun couplage du site à un fournisseur.
- Formulaires dans le gabarit d'article, la barre latérale, la page dédiée, le pied de page et la section d'accueil, tous alimentés par `newsletter.json`.
- Soumission vers une fonction serverless avec Turnstile et limitation de débit.
- Double opt-in obligatoire, enregistrement de la preuve de consentement (horodatage, page d'origine, texte affiché, empreinte hachée de l'adresse IP), champs `source`, `statut`, `préférences`, `tags`.
- Architecture prête pour plusieurs listes (générale, réglementation, fiscalité) sans les activer en v1.
- Script `newsletter:draft` qui assemble les articles `newsletterEligible` de la semaine en un numéro MDX puis en HTML compatible avec le fournisseur, avec le gabarit visuel de la DA.
- Archive publique des numéros.

### 8.6 Contact et retours

Formulaire de contact avec Turnstile et Resend. Liens « Suggérer un sujet » et « Signaler une erreur » sur chaque article.

### 8.7 Analytique

Une abstraction `Analytics` (événements : page vue, inscription newsletter, recherche, clic sortant) avec une implémentation Plausible ou Umami, script chargé uniquement en production, domaine configurable. Le branchement de « Les plus lus » sur l'API du fournisseur est prévu en v2.

### 8.8 Sécurité et exploitation

- Validation de toutes les entrées côté fonctions serverless, en-têtes de sécurité, aucune clé dans le dépôt, `.env.example` documenté.
- Limitation de débit sur les formulaires, Turnstile, journalisation minimale.
- Surveillance : notification d'échec de build, vérification de disponibilité externe gratuite, rapport `check` hebdomadaire par le cron.
- Sauvegarde : le dépôt est la sauvegarde. Documente aussi l'export des abonnés depuis le fournisseur de newsletter.
- Commanditaires et affiliation : entités prévues dans `ads.json` (`name`, `logo`, `url`, `campaign`, `startDate`, `endDate`, `placement`, `disclosure`), désactivées en v1, toujours affichées avec mention explicite et jamais mêlées au contenu éditorial.

### 8.9 Performance

Lighthouse 95 et plus sur les quatre axes sur mobile, LCP sous 2 s, CLS sous 0,05, INP sous 200 ms, JavaScript limité aux îlots nécessaires (ticker, recherche, bascule de thème, formulaires, menus), budget de 300 ko hors images sur la page d'accueil, images et polices optimisées, mise en cache agressive.

### 8.10 Conventions typographiques (français du Québec)

- Espace insécable avant le deux-points, aucune espace avant le point-virgule, le point d'exclamation et le point d'interrogation.
- Guillemets français « … » avec espaces insécables intérieures.
- Nombres : espace insécable comme séparateur de milliers, virgule décimale, symbole après le nombre avec espace insécable (« 10 000 $ », « 5 % », « 84 146 $ CA »).
- Dates : « 24 septembre 2026 », heures : « 17 h 17 ».
- Fonctions utilitaires centralisées et testées (`formatMoney`, `formatPercent`, `formatDate`, `formatRelativeDate`).

---

## 9. Conformité et éthique éditoriale

Tu n'écris pas les textes juridiques définitifs, tu prépares les emplacements et les mécanismes, avec des gabarits que l'auteur validera. Marque chaque texte de ce type `[À VALIDER PAR L'AUTEUR]`. La conformité sera validée séparément par l'auteur, tu n'inventes aucune exigence.

- **Loi 25 (Québec)** : politique de confidentialité, désignation du responsable de la protection des renseignements personnels (champ dans `legal.json`), inventaire des données collectées (newsletter, contact, analytique), lieu d'hébergement des données et transferts hors Québec, durée de conservation, procédure d'accès et de suppression. Avec une analytique sans témoins, pas de bandeau de témoins nécessaire, documente ce choix. Si un service tiers pose des témoins, prévois un mécanisme de consentement minimal et adaptable.
- **Loi canadienne anti-pourriel** : consentement exprès pour la newsletter, identification de l'expéditeur dans chaque envoi, lien de désabonnement fonctionnel, conservation des preuves de consentement.
- **Charte de la langue française** : site et interface en français.
- **Avertissements** : variantes centralisées dans `legal.json` (information générale, absence de conseil juridique, fiscal ou financier, absence de recommandation d'achat, risque de perte en capital, distinction information et opinion).
- **Standards éditoriaux imposés par la structure** : source officielle obligatoire en réglementation et en fiscalité, date « vérifié le » obligatoire, crédit d'image obligatoire, version du texte cité indiquée dans `TexteDeLoi`, notes de correction datées.
- **Pages de confiance** (gabarits dans `content/pages/`) : méthodologie (sélection des informations, vérification des sources, mises à jour, traitement des erreurs, distinction information et opinion, distinction information générale et conseil professionnel), politique de correction, politique éditoriale, transparence (indépendance, partenariats).

Sources officielles à privilégier dans les liens (à référencer dans le guide auteur) : laws-lois.justice.gc.ca, legisquebec.gouv.qc.ca, canada.ca (ARC), revenuquebec.ca, lautorite.qc.ca, securities-administrators.ca, ocri.ca, fintrac-canafe.canada.ca, banqueducanada.ca, osfi-bsif.gc.ca, gazette.gc.ca, publicationsduquebec.gouv.qc.ca, parl.ca (LEGISinfo), assnat.qc.ca, canlii.org, osc.ca.

---

## 10. Contenu d'amorçage

Crée du contenu de démonstration structurel, jamais de faits inventés. Chaque fait à confirmer porte le marqueur `[À VÉRIFIER]` et chaque section vide le marqueur `[À COMPLÉTER PAR L'AUTEUR]`.

- Un auteur de démonstration.
- Huit articles de démonstration couvrant les catégories et les formats, avec tous les champs remplis, tous les blocs riches utilisés au moins une fois, titre préfixé `[EXEMPLE]`.
- Trois squelettes de dossiers avec chronologie à compléter :
  1. Stablecoins au Canada : Loi sur les stablecoins issue du projet de loi C-15, surveillance par la Banque du Canada [À VÉRIFIER, sanction royale annoncée en mars 2026].
  2. Encadrement des plateformes de négociation de cryptoactifs : régime des ACVM et de l'OCRI, engagements préalables à l'inscription, avis 21-332 [À VÉRIFIER].
  3. Fiscalité des cryptoactifs : positions de l'ARC et de Revenu Québec, gain en capital contre revenu d'entreprise, TPS/TVQ, déclaration internationale CARF [À VÉRIFIER].
- Onze fiches juridictions (identité remplie, corps à compléter).
- Onze fiches organismes (identité remplie, corps à compléter).
- Six fiches textes squelettes, six sources réutilisables squelettes.
- Cinq traitements fiscaux squelettes couvrant des combinaisons différentes.
- Trente termes de lexique avec définitions à compléter.
- Cinq entrées d'agenda, un numéro de newsletter, toutes les pages statiques avec leurs gabarits.

---

## 11. Expérience de l'auteur

C'est le second livrable le plus important après le site lui-même.

### 11.1 Interface d'édition

- Une collection par type de contenu, formulaires en français avec aide contextuelle, champs regroupés (Contenu, Publication, Référencement, Réglementation, Fiscalité, Sources, Relations, Newsletter, Révision).
- Éditeur de texte riche avec les blocs du point 6.15 insérables depuis un menu.
- Téléversement d'images avec redimensionnement automatique et rappel du crédit obligatoire.
- Aperçu avant publication.
- Singletons pour chaque fichier de `config/` avec des formulaires adaptés (sélecteur de couleur pour le thème, liste réordonnable pour les sections de la page d'accueil et les menus).

### 11.2 Flux de publication

1. L'auteur crée ou modifie un contenu dans l'interface d'édition.
2. L'enregistrement crée une branche ou un commit selon la configuration.
3. L'hébergeur déploie un aperçu par branche.
4. La fusion dans `main` déploie en production en une à deux minutes.
5. Un contenu programmé apparaît à la reconstruction planifiée suivant sa date.
6. Retour arrière : restaurer un commit, documenté pas à pas.

### 11.3 Scripts

- `npm run new:article "Titre"` : crée le fichier MDX pré-rempli.
- `npm run check` : validations du point 8.2 et rapport `A-VERIFIER.md`.
- `npm run newsletter:draft`, `npm run veille:fetch`, `npm run og:generate`.
- `npm run dev`, `npm run build`, `npm run preview`.

### 11.4 Documentation

`docs/GUIDE-AUTEUR.md`, en français : publier un article en cinq minutes, programmer une publication, modifier un menu, réordonner la page d'accueil, changer une couleur, remplacer le logo, créer une catégorie, ajouter une juridiction, remplir un traitement fiscal, ajouter un actif au ticker, une source à la veille, une redirection, envoyer un numéro de newsletter, corriger une coquille, ajouter une note de correction, dépublier, restaurer une version, lire le rapport « À vérifier », que faire si le build échoue, tableau « Je veux modifier X, je vais dans Y ».

`CLAUDE.md` à la racine : conventions du projet pour toutes les sessions futures (interdiction des chaînes en dur, respect du modèle de contenu, jetons de la DA, commandes, structure, règles de commit, interdiction d'inventer du contenu juridique, heuristique du point 0).

---

## 12. Phasage et livrables

Chaque phase se termine par un compte rendu : ce qui a été fait, comment le tester, ce qui reste ouvert. Commits atomiques en français, format « type(portée): description ». Tu attends ma validation entre chaque phase.

### Phase 0. Réflexion et architecture (aucun code)

Livrables :

- `docs/ARCHITECTURE.md` : les deux familles comparées sur les critères du point 5.3 avec, dans la famille B, Payload contre Sanity contre Strapi ; pile retenue et justifiée avec versions vérifiées à la date du jour ; modèle de contenu détaillé et schéma des relations ; arborescence ; architecture des URL (option A ou B) ; architecture de la recherche ; architecture de la newsletter ; architecture du référencement ; pipeline de déploiement et publication programmée ; sécurité ; coût mensuel estimé des services à 0, 1 000 et 10 000 visiteurs par jour ; risques techniques, risques de référencement, risques éditoriaux et parades ; décisions irréversibles ; ce qui doit absolument être prévu dès la v1 ; feuille de route v1, v2, v3 ; estimation d'effort par phase.
- `docs/DA.md` : jetons définitifs avec vérification des contrastes, échelle typographique, inventaire des composants, maquettes filaires en ASCII ou Mermaid (accueil, article, hub de catégorie, fiche organisme) pour ordinateur et mobile.
- La liste numérotée de questions du point 13 avec, pour chacune, ta recommandation par défaut.

Puis tu t'arrêtes.

### Phase 1. Fondations

Scaffold, jetons et variables CSS, layouts, en-tête, sous-menus, tiroir mobile, pied de page, bandeau d'annonce, mode sombre, page d'accueil composée depuis `homepage.json`, taxonomies, contenu d'amorçage, script `check` avec rapport.

### Phase 2. Contenu

Gabarits article, catégorie, dossier, guide, juridiction, organisme, texte, traitement fiscal, lexique, agenda, veille, auteur, pages statiques, recherche, flux, images OG, schema.org, sitemap, redirections automatiques.

### Phase 3. Édition

Interface d'édition complète (collections, singletons, blocs riches, aperçu), scripts `new:article` et `newsletter:draft`, publication programmée, `GUIDE-AUTEUR.md`, `CLAUDE.md`.

### Phase 4. Services

Abstraction et implémentation newsletter avec double opt-in, contact, abstraction et implémentation analytique, Turnstile, limitation de débit, pages légales et de confiance, cron de reconstruction, notifications.

### Phase 5. Qualité et mise en ligne

Audit Lighthouse et accessibilité, tests (schémas, utilitaires de formatage, script `check`, redirections, parcours de fumée Playwright sur les pages principales et le formulaire newsletter), CI GitHub Actions, configuration d'hébergement, `README.md`, `CHANGELOG.md`.

### Définition de « terminé » pour chaque phase

- `npm run check` et `npm run build` passent sans avertissement.
- Aucune chaîne d'interface ni aucun contenu en dur dans `src/`.
- Chaque fonctionnalité qui concerne l'auteur est documentée dans le guide.
- Mode sombre et mobile vérifiés.

### Feuille de route v2 et v3 (à concevoir, pas à construire)

L'architecture doit accueillir ces évolutions sans réécriture, tu les listes dans `ARCHITECTURE.md` avec ce que la v1 doit prévoir pour chacune : plusieurs contributeurs avec rôles et workflow de relecture juridique ou fiscale, plusieurs listes de newsletter, « Les plus lus » branché sur l'analytique, archivage automatique des sources, commanditaires et contenus partenaires, version anglaise, recherche sémantique et assistant qui ne répond qu'en citant une source, un article, un dossier ou un document officiel avec sa date de vérification, commentaires, migration vers la famille B si le besoin apparaît.

---

## 13. Questions à me poser en fin de phase 0

Pour chacune, propose ta recommandation par défaut afin que je puisse répondre par oui ou non.

1. Nom du site et nom de domaine.
2. Contributeurs prévus d'ici douze mois, relecteur, publication programmée à l'heure près : décisif entre les familles A et B.
3. Hébergeur.
4. Fournisseur de newsletter et lieu d'hébergement des données.
5. Version anglaise : jamais, plus tard, ou dès la v1.
6. Architecture des URL : option A ou B.
7. Accent or activé ou palette strictement bleue.
8. Ticker de marché activé ou non au lancement.
9. Monétisation : aucune, commanditaires, abonnement premium plus tard.
10. Logo existant ou mot-symbole temporaire.
11. Comptes de réseaux sociaux à afficher.
12. Fréquence de publication envisagée.
13. Analytique : Plausible, Umami ou aucune.
14. Dépôt GitHub existant ou à créer.
15. Coordonnées du responsable de la protection des renseignements personnels.
16. Section « Analyses » et section « Opinion » dès la v1 ou plus tard.
17. Matrice des traitements fiscaux : structure seule en v1 ou interface de tableau filtrable dès la v1.

---

## 14. Contraintes de travail

- Dépendances minimales, versions épinglées, aucune dépendance abandonnée.
- Composants courts (moins de 200 lignes), nommés en anglais, commentés en français, jamais dupliqués par sujet.
- TypeScript strict.
- Tests sur les schémas, les utilitaires de formatage, le script `check`, les redirections, et un parcours de fumée.
- Accessibilité et performance vérifiées à chaque phase.
- Aucun service payant sans mon accord.
- Aucune clé d'API dans le dépôt.
- Tu ne pousses jamais directement sur `main` sans mon accord une fois le site en production.

Commence maintenant par la phase 0. Ne code pas encore.
