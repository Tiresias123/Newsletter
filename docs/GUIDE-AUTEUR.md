# Guide de l'auteur

Ce guide explique comment faire vivre le site sans toucher au code. Il grandit à chaque phase : les passages marqués « (phase N) » décrivent des fonctions qui ne sont pas encore livrées. Tous les fichiers cités se modifient avec un simple éditeur de texte; l'interface d'édition en ligne arrivera en phase 3.

## Sommaire

1. Je veux modifier X, je vais dans Y
2. Travailler sur le site : commandes et modes
3. Statuts de publication et dates
4. Le site : `config/site.json`
5. Les menus : `config/navigation.json`
6. La page d'accueil : `config/homepage.json`
7. Couleurs, polices et formes : `config/theme.json`
8. Mode sombre
9. Textes de l'interface : `config/i18n/fr.json`
10. Avertissements et mentions juridiques : `config/legal.json`
11. Catégories, thèmes, formats et autres listes
12. Les marqueurs à remplacer
13. Le rapport « À vérifier »
14. Si la construction du site échoue
15. Le contenu d'amorçage
16. Typographie : ce que le site fait pour vous
17. Écrire le corps d'un contenu : les blocs
18. Les pages du site et leurs adresses
19. Les fiches : ce que le site compose pour vous
20. Rubriques, listes et filtres
21. La recherche
22. Référencement et partage
23. Changer une adresse : les redirections
24. Flux, agenda et impression

---

## 1. Je veux modifier X, je vais dans Y

| Je veux… | Je vais dans… |
|---|---|
| changer le nom, la description ou l'adresse du site | `config/site.json` |
| afficher, modifier ou masquer le bandeau d'annonce | `config/site.json`, bloc `announcement` |
| remplacer le logo | `config/site.json`, bloc `logo` (section 4) |
| ajouter ou retirer un réseau social | `config/site.json`, liste `socials` |
| modifier le menu principal ou ses sous-menus | `config/navigation.json`, liste `header` |
| modifier le bouton « S'abonner » | `config/navigation.json`, bloc `subscribeButton` |
| modifier les colonnes du pied de page | `config/navigation.json`, liste `footer` |
| réordonner, activer ou masquer une section de l'accueil | `config/homepage.json` |
| changer une couleur, une police, un arrondi | `config/theme.json` |
| désactiver l'accent doré | `config/theme.json`, `accentGold` |
| modifier un texte de l'interface (bouton, mention, message) | `config/i18n/fr.json` |
| modifier un avertissement juridique | `config/legal.json`, liste `disclaimers` |
| créer une catégorie, un thème ou un format | `content/taxonomies/…` (section 11) |
| ajouter une juridiction ou un organisme | `content/juridictions/`, `content/organismes/` |
| savoir ce qui reste à vérifier | `npm run check`, puis `docs/A-VERIFIER.md` |
| voir tous les blocs d'écriture et leur rendu | `npm run dev`, puis http://localhost:4321/exemple/ (section 17) |
| renommer un contenu sans casser son ancienne adresse | champ `previousSlugs` du contenu (section 23) |
| rediriger une ancienne adresse quelconque | `config/redirects.json` (section 23) |
| ajouter une FAQ à une juridiction ou à un dossier | champ `faq` de la fiche (section 19) |
| choisir l'image de partage d'une page | champ `seo.socialImage` (section 22) |

## 2. Travailler sur le site : commandes et modes

**Une seule fois** : installer Node.js (version 24, indiquée dans `.nvmrc`), puis, dans le dossier du site, lancer `npm install`.

| Commande | Effet |
|---|---|
| `npm run dev` | ouvre le site en local sur http://localhost:4321, brouillons compris; la page se recharge à chaque enregistrement d'un fichier |
| `npm run check` | vérifie tout le contenu et écrit le rapport `docs/A-VERIFIER.md` (section 13) |
| `npm run build` | lance `check`, construit le site public dans `dist/` (sans les brouillons), crée l'index de la recherche, puis contrôle le résultat (section 21) |
| `npm run preview` | sert le dossier `dist/` en local, pour voir le site tel qu'il sera publié |
| `npm test` | lance les tests automatiques |
| `npm run typecheck` | vérifie le code (utile après une modification technique) |

**Deux modes d'affichage.**

- **Production** (`npm run build`) : seuls les contenus publiés existent. Les brouillons n'apparaissent nulle part : ni page, ni liste, ni flux.
- **Aperçu** (`npm run dev`, ou `SITE_MODE=preview npm run build` pour une version d'aperçu) : les brouillons et les contenus programmés sont visibles, avec une pastille « Brouillon, non publié ». Un bandeau jaune le rappelle en haut de chaque page, et les pages portent la consigne `noindex`, qui les écarte des moteurs de recherche.

En mode `npm run dev` seulement, deux pages de travail existent : http://localhost:4321/a-verifier/ affiche le rapport « À vérifier » à jour (section 13), et http://localhost:4321/exemple/ montre chaque bloc d'écriture et chacune de ses variantes (section 17).

La recherche n'existe qu'une fois le site construit : pour l'essayer en local, lancez `npm run build` (ou `SITE_MODE=preview npm run build`), puis `npm run preview`.

## 3. Statuts de publication et dates

Chaque contenu porte un champ `status` :

| Statut | Valeur | En production |
|---|---|---|
| Brouillon | `brouillon` | absent du site |
| Programmé | `programme` | apparaît à sa date et à son heure de publication (après la reconstruction suivante du site; délai précisé en phase 5) |
| Publié | `publie` | visible partout |
| Archivé | `archive` | la page reste accessible avec la mention « Contenu archivé », mais le contenu ne figure plus dans les listes |

- **Dépublier** un contenu, c'est le repasser en `brouillon`. Son adresse renvoie alors la page « introuvable ».
- **Dates** : toujours au format `AAAA-MM-JJ` (ex. `2026-09-24`). Le jour doit exister : `2026-02-30` est refusé.
- **Heure de publication** (`publishedTime`) : à la demi-heure (`08:00`, `08:30`…), `08:00` par défaut, à l'heure de Toronto (champ `timezone` de `config/site.json`).
- Un contenu qui n'est plus un brouillon doit avoir une date de publication. Une date de mise à jour antérieure à la date de publication est refusée.
- Les infolettres ont leurs propres statuts : `brouillon`, puis `envoye`. Un numéro envoyé est publié dans l'archive à sa date d'envoi (`sentAt`).

## 4. Le site : `config/site.json`

| Champ | Rôle |
|---|---|
| `name` | nom du site (logo temporaire, titres des pages, pied de page) |
| `baseline` | phrase d'accroche, 160 caractères au plus |
| `description` | description par défaut pour les moteurs de recherche, 300 caractères au plus |
| `url` | adresse du site, sans barre oblique finale (ex. `https://exemple.ca`) |
| `locale`, `timezone` | `fr-CA` et `America/Toronto` : ne pas modifier sans raison |
| `contactEmail` | adresse de contact |
| `logo` | `light` et `dark` : chemin d'un fichier SVG placé dans `public/` (ex. `/logo.svg`); vide, le site affiche un logo temporaire fait du pictogramme et du nom |
| `socials` | réseaux sociaux : `network` (`linkedin`, `x`, `bluesky`, `mastodon`, `youtube`, `facebook`, `rss`, `courriel`, `site`), `url`, `enabled` |
| `announcement` | bandeau d'annonce sous l'en-tête : `enabled`, `message`, `linkLabel`, `linkUrl` |
| `dataHosting` | mention « Données hébergées » du pied de page |
| `copyrightHolder` | titulaire des droits, dans le pied de page (le nom du site par défaut) |

**Tant que `url` vaut `https://example.com`**, le site est considéré comme « pas encore en ligne » : les marqueurs de la configuration sont signalés sans bloquer la construction (section 12). Dès que la vraie adresse est saisie, ils deviennent bloquants.

**Bandeau d'annonce** : pour le masquer, mettre `enabled` à `false`. Un bandeau activé sans message est refusé.

## 5. Les menus : `config/navigation.json`

**Menu principal** (`header`) : une liste d'entrées, dans l'ordre d'affichage. Chaque entrée accepte :

| Champ | Rôle |
|---|---|
| `label` | texte du menu |
| `url` | adresse : `/…` pour une page du site, `https://…` pour un site externe |
| `icon` | icône affichée dans le tiroir mobile (nom tiré de la liste fermée; un nom inconnu est refusé et le message donne la liste) |
| `description` | ligne d'explication sous le libellé, dans le tiroir mobile |
| `enabled` | `false` masque l'entrée sans la supprimer |
| `openInNewTab` | `true` ouvre le lien dans un nouvel onglet (à réserver aux sites externes) |
| `highlight` | `true` met l'entrée en valeur (couleur principale) |
| `badge` | petite pastille après le libellé, par exemple « Nouveau »; vide, aucune pastille |
| `children` | sous-menu : liste d'entrées de même forme (sans sous-menu à leur tour) |

Sur ordinateur, les sous-menus s'ouvrent au survol et au clavier; sur mobile, ils deviennent des accordéons dans le tiroir, précédés d'un lien « Tout voir » vers l'adresse de l'entrée parente.

**Bouton d'abonnement** (`subscribeButton`) : `enabled`, `label`, `url`.

**Pied de page** (`footer`) : des colonnes, chacune avec un `title` et des `links` (`label`, `url`, `enabled`).

Le rapport « À vérifier » signale tout lien de menu qui mène à une adresse inconnue ou à un contenu non publié.

## 6. La page d'accueil : `config/homepage.json`

L'accueil est une suite de sections, **affichées dans l'ordre du fichier**. Pour réordonner, déplacer un bloc; pour masquer une section, mettre son `enabled` à `false`. Chaque section a la forme `{ "discriminant": "<type>", "value": { …réglages… } }`.

Réglages communs à toutes les sections : `enabled`, `title`, `subtitle`, `background` (`default`, `brand` pour le fond bleu roi, `muted` pour le fond gris bleuté).

Beaucoup de sections acceptent aussi `source` : `auto` (choix automatique, du plus récent au plus ancien, contenus mis en avant d'abord) ou `manual` (la liste `manualSelection`, qui contient des identifiants de contenus, dans l'ordre voulu). Le bouton « Tout voir » d'une section se règle par `cta` (`label` et `url`); vide, il n'apparaît pas.

| Type | Ce qu'elle affiche | Réglages propres |
|---|---|---|
| `hero-selection` | la sélection de la rédaction : un grand article et quatre autres (les articles cochés `editorsPick` d'abord) | `source`, `manualSelection` |
| `content-block` | un bloc d'articles filtré | `filters` (`category`, `format`, `themes`, `jurisdictions`, `tags`), `count`, `layout` (`featured`, `grid`, `list`, `compact`, `horizontal`), `cta` |
| `dossiers-strip` | les dossiers : une grande carte et des liens | `count`, `cta` |
| `essentials` | « Les essentiels » : les guides (cochés `featured` d'abord) | `count`, `cta` |
| `watchlist` | « À surveiller » : prochaines échéances de l'agenda et dossiers en consultation | `count`, `cta` |
| `veille-latest` | les dernières publications officielles (phase 4) | `count`, `cta` |
| `lexique-spotlight` | des termes du lexique, qui changent chaque jour | `count`, `cta` |
| `most-read` | les plus lus : en attendant la mesure d'audience (phase 4), la liste `manualSelection` | `manualSelection`, `count` |
| `newsletter-cta` | l'invitation à s'abonner | `list` (liste de `config/newsletter.json`) |
| `partner-block` | un bloc partenaire signalé « Publicité » | `partnerId` (partenaire de `config/ads.json`, qui doit être activé) |
| `custom-html` | un texte libre, affiché tel quel (aucun code n'est exécuté) | `content` (paragraphes séparés par une ligne vide) |
| `market-brief`, `trending-assets` | données de marché (phase 4) | — |

Une section sans contenu à montrer ne s'affiche pas. Les identifiants cités (`manualSelection`, filtres, liste, partenaire) doivent exister : sinon la construction s'arrête, avec un message qui nomme la section.

## 7. Couleurs, polices et formes : `config/theme.json`

Tout le style du site vient de ce fichier. En mode `npm run dev`, l'enregistrer recharge la page.

- **`colors`** : les palettes, en hexadécimal `#RRGGBB`.
  - `brand` : le bleu roi, de 50 (le plus clair) à 950;
  - `gold` : l'accent doré;
  - `neutral` : textes, fonds et bordures du mode clair;
  - `semantic` : succès, danger, alerte;
  - `dark` : fonds, textes et bordures du mode sombre.
- **`accentGold`** : `false` retire l'accent doré (le site reste bleu et neutre; les puces d'échéance fiscale deviennent bleues).
- **`badgeStyles`** : les styles de puces proposés aux catégories (`plein-500`, `plein-700`, `plein-900`, `doux-800`, `doux-900`, `clair-300`, `ardoise`) et aux juridictions (`plein`, `contour-point`, `contour`). Chaque style porte ses couleurs claires (`light`) et sombres (`dark`) : `bg` (fond), `fg` (texte), `border`, `dot`, et `rule` pour le filet de couleur des cartes. Une couleur s'écrit en hexadécimal, `white`, `black` ou par un jeton comme `brand.600`.
- **`statusStyles`** : les couleurs des huit statuts réglementaires (projet, consultation, adopté, en vigueur…).
- **`fonts`** : police des titres (`Manrope`, `Inter` ou `Source Serif 4`), police du texte (`Inter` ou `Manrope`), `legalSerif` (`true` : les citations juridiques et les citations sont en Source Serif 4, sinon en italique de la police du texte). Les images de partage (section 22) gardent toujours Manrope.
- **`type`** : échelle des tailles de texte (neuf valeurs en pixels), taille du texte des articles sur mobile, interlignes.
- **`radius`** : arrondis des cartes, boutons, puces et images, en pixels.
- **`layout`** : largeurs (page, colonne latérale, colonne de lecture) et hauteurs de l'en-tête.

**Les contrastes sont vérifiés.** `npm run check` calcule le contraste de chaque paire texte et fond (texte courant, liens, boutons, puces, statuts, en clair et en sombre) et **bloque la construction** si l'une descend sous le seuil d'accessibilité (4,5 pour un texte, 3 pour une bordure de champ). On peut donc essayer une couleur sans risque : le message dit quelle paire pose problème.

## 8. Mode sombre

Le site suit le réglage de l'appareil du lecteur. Le bouton lune ou soleil de l'en-tête (et « Mode sombre » dans le tiroir mobile) force l'un ou l'autre mode; le choix est retenu par le navigateur, sans clignotement au chargement. Les couleurs du mode sombre se règlent dans `config/theme.json` (`colors.dark`, et la partie `dark` de chaque style de puce).

## 9. Textes de l'interface : `config/i18n/fr.json`

Tous les textes fixes du site (boutons, mentions, messages, libellés des champs dans les erreurs) sont dans ce fichier, rangés par thème. Deux conventions :

- `{nom}` est remplacé par une valeur : dans `"Vérifié le {date}"`, `{date}` devient la date. Garder ces mots entre accolades tels quels.
- Certains textes ont une forme au singulier et une au pluriel : `{ "one": "Il y a {count} jour", "other": "Il y a {count} jours" }`.

## 10. Avertissements et mentions juridiques : `config/legal.json`

- `disclaimers` : les avertissements affichés sous les contenus (`general`, `fiscal`, `reglementaire`, `opinion`, `exemple-chiffre`, `mise-en-garde`). Une catégorie choisit son avertissement par défaut (`defaultDisclaimer`), qu'un contenu peut remplacer (`disclaimerVariant`).
- `officialSourceTypes` : les types de sources réputés officiels (loi, règlement, décision…). Les contenus de réglementation et de fiscalité doivent citer au moins une source de ces types. **Cette liste est à valider** : passer ensuite `officialSourceTypesValidated` à `true` pour faire disparaître le rappel du rapport.
- `privacyOfficer` : la personne responsable de la protection des renseignements personnels (Loi 25).
- `newsletterSender` : identification et adresse postale de l'expéditeur de l'infolettre (Loi canadienne anti-pourriel).

Ces textes ont une portée juridique : ils portent des marqueurs tant que vous ne les avez pas validés.

## 11. Catégories, thèmes, formats et autres listes

Chaque entrée est un fichier JSON dans `content/taxonomies/<liste>/`. **Le nom du fichier est l'identifiant** : lettres minuscules sans accents, chiffres et tirets (ex. `reglementation.json`). Pour une catégorie, il donne aussi l'adresse de sa page : `/reglementation/`.

- **Catégories** (`categories/`) : `label`, `description`, `badgeStyle` (un style de la section 7), `icon`, `order` (ordre d'affichage), `requireVerification` et `defaultDisclaimer`.
  - `requireVerification: true` (réglementation, fiscalité) : un contenu publié dans la catégorie doit porter « Vérifié le » (`asOf`), « L'essentiel » (3 à 5 points), au moins une juridiction et au moins une source officielle.
- **Thèmes** (`themes/`) : `label`, `description`, `group` (`reglementation`, `fiscalite` ou `general`), `order`.
- **Formats** (`formats/`) : `label`, `description`, `schemaType` (le type d'article annoncé aux moteurs de recherche), `order`.
- **Activités fiscales** (`activites-fiscales/`) et **types de contribuables** (`types-contribuables/`) : `label`, `description`, `order`. Ils servent aux traitements fiscaux.

Certains identifiants sont réservés par le site et refusés pour une catégorie ou une page : `articles`, `dossiers`, `guides`, `juridictions`, `organismes`, `textes`, `lexique`, `veille`, `agenda`, `auteurs`, `newsletter`, `recherche`, `themes`, `tags`, `formats`, `api`, `en`, `og`, `keystatic`, `page`, `exemple`, `a-verifier`, `fonts`. Une catégorie et une page ne peuvent pas non plus porter le même identifiant.

## 12. Les marqueurs à remplacer

Ce qui n'a pas encore été rédigé ou vérifié par vous est signalé par un marqueur entre crochets :

| Marqueur | Sens |
|---|---|
| `[À COMPLÉTER PAR L'AUTEUR]` | texte à écrire |
| `[À VÉRIFIER]` | fait, date ou référence à confirmer à la source |
| `[À VALIDER PAR L'AUTEUR]` | texte proposé, à relire et à approuver (souvent juridique) |
| `[EXEMPLE]` | contenu de démonstration, à remplacer ou à supprimer |
| `[NOM-DU-SITE]` | nom du site, pas encore choisi |

Un marqueur peut porter une précision : `[À VÉRIFIER : date exacte]`.

**Règles de publication.**

- Un contenu **publié** qui contient encore un marqueur **bloque la construction du site** en production. Un brouillon peut en contenir autant qu'il faut.
- Les marqueurs de la **configuration** (`config/`) sont signalés dans le rapport; ils deviennent bloquants dès que la vraie adresse du site est saisie (section 4).

## 13. Le rapport « À vérifier »

`npm run check` (lancé aussi par `npm run build`) écrit `docs/A-VERIFIER.md`. Ce fichier est recréé à chaque fois et n'est pas enregistré dans l'historique du site. En mode `npm run dev`, la page http://localhost:4321/a-verifier/ montre le même rapport, recalculé à chaque visite, en mode aperçu ou production au choix.

Le rapport classe chaque point en trois niveaux :

| Niveau | Effet | Exemples |
|---|---|---|
| **Erreurs bloquantes** | la construction s'arrête; le site en ligne garde sa version précédente | champ invalide, relation vers un contenu inexistant, marqueur dans un contenu publié, contraste insuffisant, bloc mal écrit, image introuvable ou sans texte alternatif dans un contenu publié |
| **À vérifier** | le site se construit, mais le point demande votre attention | lien vers une adresse inconnue ou un contenu non publié, révision échue, date incohérente, source citée sans copie archivée, image trop lourde (plus de 500 Ko), marqueurs de la configuration avant la mise en ligne |
| **Pour information** | rien à corriger | publications programmées, révision à faire dans les deux semaines, brouillons inchangés depuis 90 jours, images inutilisées |

Chaque ligne donne le fichier, le champ (ou la ligne du texte) et ce qu'il faut faire. Quelques cas :

- **Révision échue** : le contenu porte « Vérifié le » (`asOf`) et une fréquence de révision (`reviewEvery` : 3, 6 ou 12 mois). Revérifiez le contenu, puis mettez `asOf` à la date du jour.
- **Source sans copie archivée** : ouvrez l'adresse proposée (`https://web.archive.org/save/…`) pour créer une copie, puis collez l'adresse obtenue dans le champ `archivedUrl`.
- **Lien vers un contenu non publié** : publiez le contenu visé, ou retirez le lien.

La vérification des liens externes interroge chaque site cité : elle est lente et demande un accès réseau. Elle se lance à part, avec `npm run check -- --liens-externes`, et sera faite chaque semaine par le rapport automatique (phase 5).

## 14. Si la construction du site échoue

Le message d'erreur, en français, a toujours la même forme :

```
• content/articles/mon-article.mdx — Date de publication : Date invalide : format attendu AAAA-MM-JJ (ex. 2026-09-24), et le jour doit exister.
```

Le **fichier**, puis le **champ**, puis **ce qui ne va pas**. Corrigez, puis relancez `npm run check`. Messages fréquents :

| Message | Cause habituelle |
|---|---|
| « Champ inconnu : « titre » (faute de frappe?) » | nom de champ mal orthographié |
| « Champ obligatoire manquant » | champ requis absent ou vide |
| « « x » n'existe pas dans la collection « Thèmes » » | identifiant mal écrit, ou contenu supprimé ou renommé |
| « Nom de fichier invalide » | majuscule, accent ou espace dans le nom du fichier |
| « JSON invalide près de la ligne 12 » | virgule en trop ou manquante, guillemet ou accolade non fermés |
| « Entête invalide à la ligne 5 » | indentation, deux-points ou guillemets de l'entête d'un fichier `.mdx` |

Quand des fichiers sont illisibles, le rapport s'arrête là : les autres vérifications reprennent une fois ces erreurs corrigées.

## 15. Le contenu d'amorçage

Le site est livré avec un contenu de démonstration, **entièrement en brouillon** : absent du site public, visible en mode aperçu. Il sert à voir chaque gabarit rempli et à tester les vérifications. Il ne contient aucune affirmation juridique ou fiscale vérifiée : les passages factuels portent `[À VÉRIFIER]`, le reste `[À COMPLÉTER PAR L'AUTEUR]`.

- Les **articles** `exemple-*` (et leurs images, dans `content/images/articles/exemple-*`), les deux **guides** `exemple-*` et l'**auteur** `auteur-demo` sont des démonstrations : à supprimer avant la mise en ligne, ou à transformer en vrais contenus.
- Les **taxonomies**, **juridictions**, **organismes**, **sources**, **textes**, **traitements fiscaux**, **termes du lexique**, **dossiers** et **pages** sont des bases de travail : à vérifier, compléter, puis publier.

## 16. Typographie : ce que le site fait pour vous

Tapez des espaces ordinaires : le site applique la typographie québécoise à l'affichage.

- espace insécable avant le deux-points, à l'intérieur des guillemets « », entre un nombre et `$` ou `%`, et comme séparateur de milliers (`84 146 $`);
- aucune espace avant le point-virgule, le point d'exclamation et le point d'interrogation;
- dates en toutes lettres (« 1er octobre 2026 »), heures à la française (« 9 h 30 »), montants en dollars canadiens (« 84 146 $ CA »).

Écrivez les guillemets français « » vous-même : le site ne transforme pas les guillemets droits.

## 17. Écrire le corps d'un contenu : les blocs

Le corps d'un contenu (après l'entête entre `---`) s'écrit en Markdown : `## Titre de section`, `**gras**`, `*italique*`, listes à tirets, liens `[texte](adresse)`. Les titres de niveau 2 et 3 forment le sommaire de la page. Des **blocs** s'insèrent entre deux paragraphes, chacun sur ses propres lignes. Le rapport « À vérifier » signale un bloc inconnu, une propriété mal écrite ou manquante, avec la ligne du texte.

**Voir le rendu de tous les blocs** : `npm run dev`, puis http://localhost:4321/exemple/ (en clair comme en sombre, sur ordinateur comme sur mobile).

| Bloc | Écriture | Remarques |
|---|---|---|
| Encadré | `<Callout variant="a-retenir">Texte</Callout>` | variantes : `important`, `a-retenir`, `attention`, `en-pratique`, `exemple`, `date-a-retenir`, `ce-qui-change`, `pour-les-particuliers`, `pour-les-entreprises`, `source-officielle`, `mise-a-jour`, `pour-approfondir`, `bon-a-savoir`; `title="…"` remplace le titre par défaut; `pour-approfondir` exige `href="/adresse/"` et devient une carte de lien |
| Texte de loi | `<TexteDeLoi reference="Loi X, art. Y" version="en vigueur au …" url="https://…">Texte littéral</TexteDeLoi>` | citation exacte, avec la version citée et le lien vers le texte officiel |
| Exemple chiffré | `<ExempleChiffre title="…" rows={[{ label: "…", amount: 10000 }]} total={{ label: "…", amount: 4000 }} />` | montants en dollars, sans espace ni symbole; un montant négatif s'écrit `-2500`; l'avertissement « exemple chiffré » de `config/legal.json` s'ajoute seul |
| Chronologie | `<Chronologie items={[{ date: "2026-01-15", title: "…", description: "…", url: "https://…" }]} />` | `description` et `url` facultatives |
| Comparatif | `<Comparatif caption="…" columns={["", "A", "B"]} rows={[["Critère", "…", "…"]]} />` | la première colonne reste visible quand on fait défiler le tableau sur mobile |
| Citation | `<Citation author="…" role="…" source="…" date="2026-09-25">Propos</Citation>` | `role`, `source` et `date` facultatifs |
| Vidéo | `<Video id="abcdefghijk" title="…" />` | `id` : les 11 caractères après `v=` dans l'adresse YouTube; rien n'est chargé depuis YouTube avant le clic du lecteur |
| Définition | `le <Definition term="jalonnement">jalonnement</Definition>` | `term` : l'identifiant d'un terme du lexique; infobulle avec sa définition courte et lien vers sa fiche; terme non publié : texte simple |
| Mise en garde | `<MiseEnGarde />` | texte fixe de `config/legal.json` |
| Statut réglementaire | `<StatutReglementaire dossier="stablecoins-canada" />` | puce de statut et lien vers le dossier, dans une phrase ou seul sur sa ligne |
| Bloc partenaire | `<BlocPartenaire id="partenaire" />` | affiché seulement si le partenaire est actif dans `config/ads.json`, toujours signalé « Publicité » |
| Note | `…une phrase.<Note>Texte de la note.</Note>` | collée au mot qu'elle commente; numérotée seule, regroupée en fin de page avec un lien de retour |
| Image | `<Image src="articles/mon-article/schema.webp" alt="…" credit="…" caption="…" />` | `src` : chemin dans `content/images/`; texte alternatif et crédit obligatoires; `creditUrl="https://…"`, facultatif, fait du crédit un lien |

**Blocs de page**, réservés aux pages de `content/pages/` :

- `<Hero title="…" ctaLabel="…" ctaUrl="/…">Accroche</Hero>` : bandeau de tête;
- `<ListeArticles category="…" theme="…" jurisdiction="…" format="…" tag="…" count="6" layout="grid" />` : liste d'articles (filtres facultatifs; `layout` : `grid` ou `list`);
- `<CarteAuteur id="auteur" />` et `<Newsletter />` (`list="…"` pour une autre liste de `config/newsletter.json` que la liste générale);
- `<ListeSources jurisdiction="…" type="…" />`, ou `ids={["source-1", "source-2"]}` : sources réutilisables;
- `<FAQ items={[{ question: "…", answer: "…" }]} />` : questions reprises en données FAQPage pour les moteurs;
- `<Tableau caption="…" columns={[…]} rows={[…]} />`.

Un bloc écrit dans du code (entre accents graves) n'est ni interprété ni vérifié : c'est ainsi que ce guide peut les montrer.

## 18. Les pages du site et leurs adresses

L'adresse d'un contenu vient du nom de son fichier (sans `.mdx`) : `content/articles/mon-article.mdx` devient `/articles/mon-article/`. Changer le nom du fichier change l'adresse : voir la section 23 avant de le faire.

| Adresse | Page |
|---|---|
| `/articles/…/`, `/guides/…/`, `/dossiers/…/` | un article, un guide, un dossier |
| `/juridictions/…/`, `/organismes/…/`, `/textes/…/` | une fiche |
| `/fiscalite/traitements/` et `/fiscalite/traitements/…/` | la matrice fiscale et chaque traitement |
| `/lexique/` et `/lexique/…/` | l'index alphabétique et chaque terme |
| `/articles/`, `/guides/`, `/dossiers/`, `/juridictions/`, `/organismes/`, `/textes/`, `/auteurs/` | les listes de chaque rubrique |
| `/actualites/`, `/reglementation/`… | la rubrique d'une catégorie (une par fichier de `content/taxonomies/categories/`), paginée : `/reglementation/page/2/` |
| `/themes/…/`, `/formats/…/`, `/tags/…/` | les contenus d'un thème, d'un format, d'une étiquette |
| `/agenda/`, `/veille/`, `/newsletter/`, `/recherche/` | agenda, veille officielle, infolettre et son archive, recherche |
| `/a-propos/`, `/contact/`… | les pages de `content/pages/` |

## 19. Les fiches : ce que le site compose pour vous

Chaque fiche assemble ses champs et les contenus qui la citent : vous n'avez rien à recopier. Une section vide ne s'affiche pas, et le sommaire « Sur cette page » suit. Sur ordinateur, la fiche d'identité et le sommaire occupent la colonne de droite; sur mobile, la fiche devient repliable sous l'en-tête.

- **Dossier** : fiche (statut, autorités, qui est visé, dates clés), « Ce qui change » (`keyChanges`), corps, obligations, sanctions, incidences fiscales (`taxImplications`, paragraphes séparés par une ligne vide), chronologie (`timeline`, triée par date), textes clés, questions fréquentes (`faq`), sources, articles qui citent le dossier (champ `relatedDossiers` des articles) et échéances liées (champ `relatedDossier` de l'agenda). Avertissement « réglementaire » par défaut, modifiable par `disclaimerVariant`.
- **Juridiction** : présentation (corps), actualités (les quatre derniers contenus qui la citent), réglementation (dossiers, ceux de `keyDossiers` en tête), fiscalité (traitements, ceux de `keyTraitements` en tête), organismes rattachés, échéances, et **questions fréquentes** (nouveau champ `faq` : une liste de `question` et `answer`). Les sections portent les ancres `#actualites`, `#reglementation`, `#fiscalite`, `#organismes`, `#agenda` et `#questions`, utilisables dans les menus.
- **Organisme** : vignette à son sigle (jamais son logo officiel), rôle, lien vers le site officiel, dossiers dont il est l'autorité, dernières décisions et textes publiés (textes dont il est l'émetteur), articles et guides qui le citent, sources dont il est l'émetteur, échéances de ses dossiers et sa veille. Le lien « Flux RSS officiel » n'apparaît que si sa source est activée dans `config/sources-veille.json`.
- **Texte** : type, statut, liens vers le texte officiel et sa copie archivée, « Dispositions clés » (`keyProvisions`), corps, dossiers qui le retiennent comme texte clé, articles qui le citent.
- **Traitement fiscal** : « Traitement fiscal » (`treatment`), déclaration (`reportingRequirement`), formulaires (`forms`, lien officiel facultatif), explications (corps), sources, articles liés. **L'avertissement fiscal s'affiche toujours**, sans réglage possible.
- **Terme du lexique** : définition courte (celle des infobulles), synonymes, corps, termes voisins (`seeAlso`), sources officielles et contenus qui l'emploient par le bloc `Definition`. Tant que son corps est vide, la fiche reste hors des moteurs de recherche.
- **Auteur** : présentation (rôle, mention professionnelle, biographie, réseaux), puis ses articles et guides, paginés.
- **Infolettre** : chaque numéro envoyé a sa page d'archive (introduction, articles du numéro, partenaire éventuel signalé « Publicité »).

## 20. Rubriques, listes et filtres

- **Rubrique d'une catégorie** : trois contenus « à la une », puis douze par page. Les pastilles sous le titre sont les sous-entrées du menu qui mène à cette rubrique (`config/navigation.json`) : pour les changer, modifiez le menu.
- **Filtres** (thème, format, juridiction) : ils ouvrent la page de recherche avec la catégorie et les filtres choisis, sans créer de nouvelles pages.
- **Thèmes, formats et étiquettes** : chacun a sa liste. Sous trois contenus, elle reste hors des moteurs de recherche. L'adresse d'une étiquette s'écrit sans accents : `Déclaration` mène à `/tags/declaration/`.
- **Matrice fiscale** (`/fiscalite/traitements/`) : un tableau par type de contribuable, trié par juridiction puis par activité. Chaque tableau porte l'identifiant du type comme ancre (`#particulier`, `#societe`, `#staker`…), utilisable dans les menus.
- **Juridictions** : regroupées par niveau (ancres `#federal`, `#provincial`, `#national`…). **Organismes** : regroupés par juridiction.

## 21. La recherche

La recherche porte sur les articles, guides, dossiers, fiches, termes du lexique, pages, auteurs et numéros de l'infolettre publiés. Elle ignore les accents (« reglementation » trouve « réglementation »), trouve les références comme « 21-332 » ou « 248(1) », et regroupe les résultats par type.

- **Ouvrir** : le champ « Rechercher » de l'en-tête, ou `Ctrl K` (`⌘ K` sur Mac). La page `/recherche/` offre tous les filtres : type, catégorie, thème, format, juridiction, année.
- **Mise à jour** : l'index est recréé à chaque construction du site; un contenu publié est trouvable dès la mise en ligne suivante.
- **Contrôle** : `npm run build` s'arrête si l'index de recherche manque ou est vide.

## 22. Référencement et partage

Le site produit seul les balises des moteurs de recherche et des réseaux : titre, description, adresse canonique, données structurées (article, dossier et sa FAQ, organisme, terme, auteur), plan du site (`/sitemap-index.xml`, avec les seules pages indexables) et `robots.txt`.

Chaque contenu accepte un bloc `seo`, entièrement facultatif :

| Champ | Rôle |
|---|---|
| `title` | titre pour les moteurs, 70 caractères au plus (sinon le titre du contenu) |
| `description` | description pour les moteurs, 160 caractères au plus (sinon le chapô ou le résumé) |
| `canonical` | adresse canonique, si le texte est d'abord paru ailleurs |
| `socialImage` | image de partage choisie par vous, recadrée en 1200 × 630 |
| `noindex` | `true` garde la page hors des moteurs, sans la cacher |

**Images de partage.** Sans `socialImage`, chaque page reçoit une image 1200 × 630 générée au build sur le gabarit du site : fond bleu roi, catégorie ou type de fiche, titre, sigle pour un organisme, nom du site.

## 23. Changer une adresse : les redirections

Une adresse publiée ne doit jamais mourir : d'autres sites, des courriels ou des mémoires la citent.

- **Renommer un contenu** (article, guide, dossier) : renommez le fichier, puis ajoutez l'ancien identifiant dans son champ `previousSlugs` (ex. `previousSlugs: [ancien-nom]`). Le site redirige alors l'ancienne adresse vers la nouvelle (redirection permanente 301).
- **Toute autre adresse** (ancien site, page supprimée) : ajoutez une entrée dans `config/redirects.json`, par exemple `{ "from": "/ancienne-adresse/", "to": "/nouvelle-adresse/", "status": 301 }`.
- **Contrôles** : `npm run check` refuse une ancienne adresse déjà redirigée, une redirection qui masquerait une page existante, une boucle, et plus de 2 000 redirections; il signale une destination qui n'existe pas. Une chaîne (A vers B, puis B vers C) est raccourcie seule (A vers C).
- **Filet de sécurité**, une fois le site en ligne : chaque construction compare les adresses du plan du site en ligne à celles du nouveau site, et signale toute adresse disparue sans redirection. Un contenu repassé en brouillon est une dépublication voulue : simple information.

## 24. Flux, agenda et impression

- **Flux** : `/rss.xml` (les 20 derniers contenus), un flux par catégorie (`/reglementation/rss.xml`…) et `/feed.json` (format JSON Feed), avec titre, résumé et lien.
- **Agenda** : `/agenda/` montre les échéances à venir, par mois. Chaque échéance se télécharge au format calendrier (« Ajouter à mon agenda »), et `/agenda.ics` contient tout l'agenda, à importer ou à suivre dans un logiciel de calendrier. Une échéance avec une heure (`time`) et sans date de fin est ponctuelle; les autres occupent des journées entières, de `date` à `endDate`.
- **Veille officielle** : `/veille/` liste les publications des autorités relevées automatiquement (phase 4), avec des filtres par source, juridiction et période.
- **Impression** : dossiers, fiches et articles s'impriment sur une seule colonne, sans menus ni barre latérale, avec l'adresse des liens externes et les blocs repliables ouverts (bouton « Imprimer » des dossiers, textes et traitements fiscaux).
