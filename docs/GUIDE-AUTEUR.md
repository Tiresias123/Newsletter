# Guide de l'auteur

Ce guide explique comment faire vivre le site sans toucher au code. Il grandit à chaque phase : les passages marqués « (phase N) » décrivent des fonctions qui ne sont pas encore livrées. Tout se fait dans l'éditeur (section 3), qui remplit les fichiers décrits ici; ces fichiers restent modifiables avec un simple éditeur de texte.

## Sommaire

1. Je veux modifier X, je vais dans Y
2. Travailler sur le site : commandes et modes
3. L'éditeur : ouvrir, enregistrer, mettre en ligne
4. Publier un article en cinq minutes
5. Statuts de publication et dates
6. Images
7. Le site : `config/site.json`
8. Les menus : `config/navigation.json`
9. La page d'accueil : `config/homepage.json`
10. Couleurs, polices et formes : `config/theme.json`
11. Mode sombre
12. Textes de l'interface : `config/i18n/fr.json`
13. Avertissements et mentions juridiques : `config/legal.json`
14. Catégories, thèmes, formats et autres listes
15. Les marqueurs à remplacer
16. Le rapport « À vérifier »
17. Si la construction du site échoue
18. Le contenu d'amorçage
19. Typographie : ce que le site fait pour vous
20. Écrire le corps d'un contenu : les blocs
21. Les pages du site et leurs adresses
22. Les fiches : ce que le site compose pour vous
23. Rubriques, listes et filtres
24. La recherche
25. Référencement et partage
26. Changer une adresse : les redirections
27. Flux, agenda et impression
28. L'infolettre : préparer et envoyer un numéro
29. Corriger, dépublier, restaurer une version
30. Ce qu'il faut savoir sur l'éditeur

---

## 1. Je veux modifier X, je vais dans Y

| Je veux… | Je vais dans… |
|---|---|
| publier un article | section 4 |
| programmer une publication | statut « Programmé » (section 5) |
| ajouter une image | section 6 |
| changer le nom, la description ou l'adresse du site | Réglages › Identité du site (section 7) |
| afficher, modifier ou masquer le bandeau d'annonce | Réglages › Identité du site › Bandeau d'annonce |
| remplacer le logo | Réglages › Identité du site › Logo (section 7) |
| ajouter ou retirer un réseau social | Réglages › Identité du site › Réseaux sociaux |
| modifier le menu principal ou ses sous-menus | Réglages › Menus › En-tête (section 8) |
| modifier le bouton « S'abonner » ou les colonnes du pied de page | Réglages › Menus |
| réordonner, activer ou masquer une section de l'accueil | Réglages › Page d'accueil (section 9) |
| changer une couleur, une police, un arrondi | Réglages › Thème (section 10) |
| désactiver l'accent doré | Réglages › Thème › Accent doré |
| modifier un texte de l'interface (bouton, mention, message) | Réglages › Textes de l'interface (section 12) |
| modifier un avertissement juridique | Réglages › Mentions juridiques (section 13) |
| créer ou renommer une catégorie, un thème ou un format | Classements (section 14) |
| ajouter une juridiction ou un organisme | Fiches › Juridictions, Fiches › Organismes (section 22) |
| remplir un traitement fiscal | Fiches › Traitements fiscaux (section 22) |
| ajouter un actif au bandeau des cours | Réglages › Bandeau des cours |
| ajouter une source à la veille | Réglages › Sources de la veille |
| ajouter une redirection | Réglages › Redirections (section 26) |
| préparer et envoyer un numéro de l'infolettre | `npm run newsletter:draft` (section 28) |
| corriger une coquille, ajouter une note de correction, dépublier, restaurer une version | section 29 |
| savoir ce qui reste à vérifier | http://127.0.0.1:4321/a-verifier/, ou `npm run check` puis `docs/A-VERIFIER.md` (section 16) |
| voir tous les blocs d'écriture et leur rendu | `npm run dev`, puis http://127.0.0.1:4321/exemple/ (section 20) |
| renommer un contenu sans casser son ancienne adresse | champ « Anciennes adresses » (section 26) |
| ajouter une FAQ à une juridiction ou à un dossier | champ « Questions fréquentes » (section 22) |
| choisir l'image de partage d'une page | Référencement › Image de partage (section 25) |

## 2. Travailler sur le site : commandes et modes

**Une seule fois** : installer Node.js (version 24, indiquée dans `.nvmrc`), puis, dans le dossier du site, lancer `npm install`.

| Commande | Effet |
|---|---|
| `npm run dev` | ouvre le site en local sur http://127.0.0.1:4321, brouillons compris, et l'éditeur sur http://127.0.0.1:4321/keystatic (section 3); la page se recharge à chaque enregistrement d'un fichier |
| `npm run new:article -- "Titre"` | crée un article en brouillon, prérempli; `npm run new:article -- "Titre" --guide` pour un guide (section 4). Les options se placent après `--` |
| `npm run newsletter:draft` | prépare le prochain numéro de l'infolettre; avec `-- --html`, produit son courriel (section 28) |
| `npm run content:format` | remet les fichiers au format de l'éditeur après une modification faite à la main (section 30) |
| `npm run check` | vérifie tout le contenu et écrit le rapport `docs/A-VERIFIER.md` (section 16) |
| `npm run build` | lance `check`, construit le site public dans `dist/` (sans les brouillons), crée l'index de la recherche, puis contrôle le résultat (section 24) |
| `npm run preview` | sert le dossier `dist/` en local, pour voir le site tel qu'il sera publié |
| `npm test` | lance les tests automatiques |
| `npm run typecheck` | vérifie le code (utile après une modification technique) |

**Deux modes d'affichage.**

- **Production** (`npm run build`) : seuls les contenus publiés existent. Les brouillons n'apparaissent nulle part : ni page, ni liste, ni flux.
- **Aperçu** (`npm run dev`, ou `SITE_MODE=preview npm run build` pour une version d'aperçu) : les brouillons et les contenus programmés sont visibles, avec une pastille « Brouillon, non publié ». Un bandeau jaune le rappelle en haut de chaque page, et les pages portent la consigne `noindex`, qui les écarte des moteurs de recherche.

En mode `npm run dev` seulement, trois pages de travail existent : l'éditeur, http://127.0.0.1:4321/keystatic (section 3); le rapport « À vérifier » à jour, http://127.0.0.1:4321/a-verifier/ (section 16); et http://127.0.0.1:4321/exemple/, qui montre chaque bloc d'écriture et chacune de ses variantes (section 20).

La recherche n'existe qu'une fois le site construit : pour l'essayer en local, lancez `npm run build` (ou `SITE_MODE=preview npm run build`), puis `npm run preview`.

## 3. L'éditeur : ouvrir, enregistrer, mettre en ligne

L'éditeur est un ensemble de formulaires, en français, au-dessus des fichiers du site : il écrit les mêmes fichiers que ceux décrits dans ce guide. Il fonctionne sur votre ordinateur, pendant que le site tourne en local.

**Ouvrir l'éditeur** : lancez `npm run dev`, puis ouvrez http://127.0.0.1:4321/keystatic. Le menu de gauche regroupe :

- **Contenus** : articles, guides, dossiers, numéros de l'infolettre, pages;
- **Fiches** : juridictions, organismes, textes, traitements fiscaux, lexique, agenda;
- **Références** : sources réutilisables et auteurs;
- **Classements** : catégories, thèmes, formats, activités fiscales, types de contribuables;
- **Réglages** : un formulaire par fichier de `config/` (identité du site, menus, page d'accueil, thème, infolettre, mentions juridiques, sources de la veille, partenaires, redirections, bandeau des cours, textes de l'interface).

**La liste d'une collection** montre l'identifiant, le titre, le statut et la date. Le champ de recherche de la liste ne cherche que dans les identifiants (« impot », pas « Impôt »). Le bouton « Ajouter » crée une entrée.

**Le formulaire** range les champs par groupes (Contenu, Classement, Publication, Révision, Réglementation, Fiscalité, Sources, Relations, Infolettre, Référencement). Sous chaque libellé, une aide rappelle la règle; un astérisque marque un champ obligatoire. Pour les articles, les guides, les pages et les numéros de l'infolettre, le texte occupe le centre de l'écran et les champs la colonne de droite.

**Enregistrer** (« Sauvegarder ») écrit le fichier dans le dossier du site : rien n'est encore en ligne. L'éditeur refuse d'enregistrer tant qu'un champ enfreint sa règle (le message s'affiche sous le champ). Les règles qui croisent plusieurs contenus (source officielle, relations, marqueurs) sont vérifiées ensuite par `npm run check`, ou sur la page http://127.0.0.1:4321/a-verifier/.

**Voir la page** : l'icône en forme de flèche sortante (« Preview ») ouvre la page du contenu sur le site local, brouillons compris, dans un nouvel onglet. Elle se met à jour à chaque enregistrement.

**Mettre en ligne** : chaque enregistrement modifie des fichiers; la mise en ligne consiste à les envoyer sur GitHub.

1. Ouvrez GitHub Desktop : la liste des fichiers modifiés s'affiche, avec les changements en couleur.
2. Relisez-les, écrivez un résumé (ex. « Publie l'article sur l'inscription des plateformes »), puis cliquez sur « Commit to main ».
3. Cliquez sur « Push origin ». La construction du site en ligne démarre (branchement de l'hébergement : phase 5). Si une erreur bloquante subsiste, le site en ligne garde sa version précédente (section 17).

**Créer, dupliquer, supprimer.** L'identifiant d'une nouvelle entrée (nom du fichier et fin de son adresse) est tiré du titre pendant la saisie; vérifiez-le avant le premier enregistrement. « Duplicate entry » crée une copie dont l'identifiant finit par « -copy », à renommer. La corbeille (« Delete entry ») supprime le fichier et ses images : pour retirer un contenu du site sans le perdre, repassez-le plutôt en brouillon (section 5).

## 4. Publier un article en cinq minutes

1. Lancez `npm run dev`, ouvrez l'éditeur, puis **Articles › Ajouter**. Vous pouvez aussi lancer `npm run new:article -- "Titre de l'article"` : l'article est créé en brouillon, prérempli, et la commande affiche l'adresse où l'ouvrir dans l'éditeur.
2. **Contenu** : le titre (20 à 120 caractères), l'identifiant proposé, le chapô (160 à 300 caractères), puis le texte au centre. Le bouton « + » de la barre d'outils insère un bloc (encadré, texte de loi, chronologie…, section 20). Pour une note de bas de page ou une définition du lexique, sélectionnez les mots, puis cliquez sur « Note numérotée » ou « Définition du lexique ».
3. **Classement** : catégorie, format, thèmes (1 à 5), juridictions.
4. **Couverture**, facultative : image, texte alternatif et crédit (section 6).
5. **Réglementation et fiscalité** : « Vérifié le », « L'essentiel » (3 à 5 points) et au moins une source officielle sont exigés pour publier. Le type d'une source ponctuelle reste « À choisir » tant que vous ne l'avez pas choisi : le rapport bloque alors la publication.
6. **Publication** : statut « Publié », date du jour (ou « Programmé » et une date future, section 5). Sauvegardez.
7. Vérifiez la page (icône « Preview »), puis la page http://127.0.0.1:4321/a-verifier/ : aucune erreur bloquante ne doit concerner l'article.
8. Mettez en ligne avec GitHub Desktop (section 3).

## 5. Statuts de publication et dates

Chaque contenu porte un statut (« Statut de publication », champ `status`) :

| Statut | Valeur | En production |
|---|---|---|
| Brouillon | `brouillon` | absent du site |
| Programmé | `programme` | mis en ligne seul à sa date et à son heure de publication (voir ci-dessous) |
| Publié | `publie` | visible partout |
| Archivé | `archive` | la page reste accessible avec la mention « Contenu archivé », mais le contenu ne figure plus dans les listes |

- **Dépublier** un contenu, c'est le repasser en `brouillon`. Son adresse renvoie alors la page « introuvable ».
- **Dates** : choisies dans un calendrier dans l'éditeur; dans les fichiers, au format `AAAA-MM-JJ` (ex. `2026-09-24`). Le jour doit exister : `2026-02-30` est refusé.
- **Heure de publication** (`publishedTime`) : à la demi-heure (« 8 h », « 8 h 30 »…), 8 h par défaut, à l'heure de Montréal (fuseau America/Toronto, champ `timezone` de `config/site.json`).
- Un contenu qui n'est plus un brouillon doit avoir une date de publication. Une date de mise à jour antérieure à la date de publication est refusée.
- Les infolettres ont leurs propres statuts : `brouillon`, puis `envoye`. Un numéro envoyé est publié dans l'archive à sa date d'envoi (`sentAt`).

**Programmer une publication.** Choisissez le statut « Programmé », puis la date et l'heure de publication; sauvegardez et mettez en ligne comme d'habitude. Le contenu reste invisible jusqu'à l'heure dite. À chaque construction, le site publie la liste des heures de publication à venir (`/schedule.json`, sans titre ni adresse : rien ne fuit avant l'heure). Une tâche planifiée la consulte toutes les 15 minutes et relance la construction du site dès qu'une heure est passée : le contenu paraît au plus une vingtaine de minutes après l'heure choisie (tâche branchée avec l'hébergement, phase 4; d'ici là, le contenu paraît à la mise en ligne suivante). Le rapport « À vérifier » liste les publications programmées.

## 6. Images

Les champs d'image (couverture, image de partage, photo d'un auteur) ont un bouton « Choose file » pour choisir le fichier et « Remove » pour le retirer. Le site produit lui-même les tailles et les formats utiles : envoyez une image assez grande (1 600 pixels de large pour une couverture), en JPEG, PNG ou WebP. Le rapport « À vérifier » signale une image de plus de 500 Ko.

- **Où vont les fichiers** : chaque contenu range ses images dans son propre dossier, `content/images/<collection>/<identifiant>/`. L'éditeur les nomme d'après le champ : la couverture d'un article devient `cover/src.webp`, son image de partage `seo/socialImage.png`. Une image ajoutée à la main doit porter ce nom, sinon le rapport le signale.
- **Une image n'appartient qu'à un contenu.** Une image citée depuis le dossier d'un autre contenu serait effacée au prochain enregistrement : le rapport le signale (« Contenus que l'éditeur ne pourrait pas ouvrir »). Pour réutiliser une image, choisissez de nouveau le fichier.
- **Renommer, supprimer** : renommer un contenu déplace ses images dans le nouveau dossier; supprimer un contenu supprime ses images; « Remove » suivi d'un enregistrement supprime le fichier.
- **Image dans le texte** : bloc « Image » du menu « + ». Le nom du fichier est mis en minuscules, sans accents ni espaces. Texte alternatif et crédit sont obligatoires, la légende facultative.
- **Texte alternatif** : décrivez ce que montre l'image pour une personne qui ne la voit pas. **Crédit** : l'auteur ou la source; il est obligatoire dès qu'une image est choisie.
- Le **logo d'un organisme** n'est jamais affiché : la fiche montre son sigle. Le **logo du site** se règle dans l'identité du site (section 7).

## 7. Le site : `config/site.json`

Dans l'éditeur : **Réglages › Identité du site**. Chaque champ y porte un libellé en français; le tableau donne aussi son nom dans le fichier.

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

**Tant que `url` vaut `https://example.com`**, le site est considéré comme « pas encore en ligne » : les marqueurs de la configuration sont signalés sans bloquer la construction (section 15). Dès que la vraie adresse est saisie, ils deviennent bloquants.

**Bandeau d'annonce** : pour le masquer, mettre `enabled` à `false`. Un bandeau activé sans message est refusé.

## 8. Les menus : `config/navigation.json`

Dans l'éditeur : **Réglages › Menus**. Les entrées se réordonnent en les faisant glisser par leur poignée ⠿.

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

## 9. La page d'accueil : `config/homepage.json`

Dans l'éditeur : **Réglages › Page d'accueil**. « Add » propose les types de sections; une section se déplace par sa poignée ⠿, et « Activé » l'affiche ou la masque.

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

## 10. Couleurs, polices et formes : `config/theme.json`

Dans l'éditeur : **Réglages › Thème**. Une couleur se saisit en hexadécimal (`#2743D3`) : l'éditeur n'a pas de pipette.

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
- **`fonts`** : police des titres (`Manrope`, `Inter` ou `Source Serif 4`), police du texte (`Inter` ou `Manrope`), `legalSerif` (`true` : les citations juridiques et les citations sont en Source Serif 4, sinon en italique de la police du texte). Les images de partage (section 25) gardent toujours Manrope.
- **`type`** : échelle des tailles de texte (neuf valeurs en pixels), taille du texte des articles sur mobile, interlignes.
- **`radius`** : arrondis des cartes, boutons, puces et images, en pixels.
- **`layout`** : largeurs (page, colonne latérale, colonne de lecture) et hauteurs de l'en-tête.

**Les contrastes sont vérifiés.** `npm run check` calcule le contraste de chaque paire texte et fond (texte courant, liens, boutons, puces, statuts, en clair et en sombre) et **bloque la construction** si l'une descend sous le seuil d'accessibilité (4,5 pour un texte, 3 pour une bordure de champ). On peut donc essayer une couleur sans risque : le message dit quelle paire pose problème.

## 11. Mode sombre

Le site suit le réglage de l'appareil du lecteur. Le bouton lune ou soleil de l'en-tête (et « Mode sombre » dans le tiroir mobile) force l'un ou l'autre mode; le choix est retenu par le navigateur, sans clignotement au chargement. Les couleurs du mode sombre se règlent dans `config/theme.json` (`colors.dark`, et la partie `dark` de chaque style de puce).

## 12. Textes de l'interface : `config/i18n/fr.json`

Dans l'éditeur : **Réglages › Textes de l'interface**. Les textes y sont rangés sous leur nom technique (par exemple « search › placeholder »). Les libellés de l'éditeur et du rapport (sections « champs », « editeur », « report ») ne se modifient que dans le fichier.

Tous les textes fixes du site (boutons, mentions, messages, libellés des champs dans les erreurs) sont dans ce fichier, rangés par thème. Deux conventions :

- `{nom}` est remplacé par une valeur : dans `"Vérifié le {date}"`, `{date}` devient la date. Garder ces mots entre accolades tels quels.
- Certains textes ont une forme au singulier et une au pluriel : `{ "one": "Il y a {count} jour", "other": "Il y a {count} jours" }`.

## 13. Avertissements et mentions juridiques : `config/legal.json`

Dans l'éditeur : **Réglages › Mentions juridiques**.

- `disclaimers` : les avertissements affichés sous les contenus (`general`, `fiscal`, `reglementaire`, `opinion`, `exemple-chiffre`, `mise-en-garde`). Une catégorie choisit son avertissement par défaut (`defaultDisclaimer`), qu'un contenu peut remplacer (`disclaimerVariant`). Dans ces deux listes, « Par défaut » reprend l'avertissement de la catégorie (sinon le général; pour un dossier, le réglementaire), « Aucun » n'en affiche pas.
- `officialSourceTypes` : les types de sources réputés officiels (loi, règlement, décision…). Les contenus de réglementation et de fiscalité doivent citer au moins une source de ces types. **Cette liste est à valider** : passer ensuite `officialSourceTypesValidated` à `true` pour faire disparaître le rappel du rapport.
- `privacyOfficer` : la personne responsable de la protection des renseignements personnels (Loi 25).
- `newsletterSender` : identification et adresse postale de l'expéditeur de l'infolettre (Loi canadienne anti-pourriel).

Ces textes ont une portée juridique : ils portent des marqueurs tant que vous ne les avez pas validés.

## 14. Catégories, thèmes, formats et autres listes

Dans l'éditeur : **Classements**. L'identifiant est proposé à partir du libellé.

Chaque entrée est un fichier JSON dans `content/taxonomies/<liste>/`. **Le nom du fichier est l'identifiant** : lettres minuscules sans accents, chiffres et tirets (ex. `reglementation.json`). Pour une catégorie, il donne aussi l'adresse de sa page : `/reglementation/`.

- **Catégories** (`categories/`) : `label`, `description`, `badgeStyle` (un style de la section 10), `icon`, `order` (ordre d'affichage), `requireVerification` et `defaultDisclaimer`.
  - `requireVerification: true` (réglementation, fiscalité) : un contenu publié dans la catégorie doit porter « Vérifié le » (`asOf`), « L'essentiel » (3 à 5 points), au moins une juridiction et au moins une source officielle.
- **Thèmes** (`themes/`) : `label`, `description`, `group` (`reglementation`, `fiscalite` ou `general`), `order`.
- **Formats** (`formats/`) : `label`, `description`, `schemaType` (le type d'article annoncé aux moteurs de recherche), `order`.
- **Activités fiscales** (`activites-fiscales/`) et **types de contribuables** (`types-contribuables/`) : `label`, `description`, `order`. Ils servent aux traitements fiscaux.

Certains identifiants sont réservés par le site et refusés pour une catégorie ou une page : `articles`, `dossiers`, `guides`, `juridictions`, `organismes`, `textes`, `lexique`, `veille`, `agenda`, `auteurs`, `newsletter`, `recherche`, `themes`, `tags`, `formats`, `api`, `en`, `og`, `keystatic`, `page`, `exemple`, `a-verifier`, `fonts`. Une catégorie et une page ne peuvent pas non plus porter le même identifiant.

## 15. Les marqueurs à remplacer

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
- Les marqueurs de la **configuration** (`config/`) sont signalés dans le rapport; ils deviennent bloquants dès que la vraie adresse du site est saisie (section 7).

## 16. Le rapport « À vérifier »

`npm run check` (lancé aussi par `npm run build`) écrit `docs/A-VERIFIER.md`. Ce fichier est recréé à chaque fois et n'est pas enregistré dans l'historique du site. En mode `npm run dev`, la page http://127.0.0.1:4321/a-verifier/ montre le même rapport, recalculé à chaque visite, en mode aperçu ou production au choix.

Le rapport classe chaque point en trois niveaux :

| Niveau | Effet | Exemples |
|---|---|---|
| **Erreurs bloquantes** | la construction s'arrête; le site en ligne garde sa version précédente | champ invalide, relation vers un contenu inexistant, marqueur dans un contenu publié, contraste insuffisant, bloc mal écrit, image introuvable ou sans texte alternatif dans un contenu publié |
| **À vérifier** | le site se construit, mais le point demande votre attention | lien vers une adresse inconnue ou un contenu non publié, révision échue, date incohérente, source citée sans copie archivée, image trop lourde (plus de 500 Ko), marqueurs de la configuration avant la mise en ligne, construction que l'éditeur ne saurait pas rouvrir (encadré écrit sur une seule ligne, montant négatif sans guillemets, image rangée hors du dossier du contenu) |
| **Pour information** | rien à corriger | publications programmées, révision à faire dans les deux semaines, brouillons inchangés depuis 90 jours, images inutilisées |

Chaque ligne donne le fichier, le champ (ou la ligne du texte) et ce qu'il faut faire. Quelques cas :

- **Révision échue** : le contenu porte « Vérifié le » (`asOf`) et une fréquence de révision (`reviewEvery` : 3, 6 ou 12 mois). Revérifiez le contenu, puis mettez `asOf` à la date du jour.
- **Source sans copie archivée** : ouvrez l'adresse proposée (`https://web.archive.org/save/…`) pour créer une copie, puis collez l'adresse obtenue dans le champ `archivedUrl`.
- **Lien vers un contenu non publié** : publiez le contenu visé, ou retirez le lien.

La vérification des liens externes interroge chaque site cité : elle est lente et demande un accès réseau. Elle se lance à part, avec `npm run check -- --liens-externes`, et sera faite chaque semaine par le rapport automatique (phase 5).

## 17. Si la construction du site échoue

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
| l'éditeur affiche « Field validation failed » au lieu du formulaire | construction qu'il ne sait pas relire, ou champ inconnu : le rapport les signale (« Contenus que l'éditeur ne pourrait pas ouvrir ») |

Quand des fichiers sont illisibles, le rapport s'arrête là : les autres vérifications reprennent une fois ces erreurs corrigées.

## 18. Le contenu d'amorçage

Le site est livré avec un contenu de démonstration, **entièrement en brouillon** : absent du site public, visible en mode aperçu. Il sert à voir chaque gabarit rempli et à tester les vérifications. Il ne contient aucune affirmation juridique ou fiscale vérifiée : les passages factuels portent `[À VÉRIFIER]`, le reste `[À COMPLÉTER PAR L'AUTEUR]`.

- Les **articles** `exemple-*` (et leurs images, dans `content/images/articles/exemple-*`), les deux **guides** `exemple-*` et l'**auteur** `auteur-demo` sont des démonstrations : à supprimer avant la mise en ligne, ou à transformer en vrais contenus.
- Les **taxonomies**, **juridictions**, **organismes**, **sources**, **textes**, **traitements fiscaux**, **termes du lexique**, **dossiers** et **pages** sont des bases de travail : à vérifier, compléter, puis publier.

Tout le contenu d'amorçage est déjà au format de l'éditeur : l'ouvrir puis l'enregistrer sans rien changer ne modifie aucun fichier.

## 19. Typographie : ce que le site fait pour vous

Tapez des espaces ordinaires : le site applique la typographie québécoise à l'affichage.

- espace insécable avant le deux-points, à l'intérieur des guillemets « », entre un nombre et `$` ou `%`, et comme séparateur de milliers (`84 146 $`);
- aucune espace avant le point-virgule, le point d'exclamation et le point d'interrogation;
- dates en toutes lettres (« 1er octobre 2026 »), heures à la française (« 9 h 30 »), montants en dollars canadiens (« 84 146 $ CA »).

Écrivez les guillemets français « » vous-même : le site ne transforme pas les guillemets droits.

## 20. Écrire le corps d'un contenu : les blocs

**Dans l'éditeur**, le texte s'écrit comme dans un traitement de texte. La liste « Paragraph » choisit le style (texte courant, intertitre de niveau 2 ou 3 : les intertitres forment le sommaire de la page); la barre d'outils met en gras ou en italique, crée listes, citations, tableaux et liens. Le bouton « + », à droite de la barre, insère un **bloc**; « Edit » règle ensuite ses propriétés (variante d'un encadré, lignes d'un exemple chiffré…). Deux blocs s'appliquent à des mots sélectionnés, par les boutons de la barre : « Note numérotée » et « Définition du lexique ».

**Voir le rendu de tous les blocs** : `npm run dev`, puis http://127.0.0.1:4321/exemple/ (en clair comme en sombre, sur ordinateur comme sur mobile). Le rapport « À vérifier » signale un bloc inconnu, une propriété mal écrite ou manquante, avec la ligne du texte.

**Dans le fichier**, le corps (après l'entête entre `---`) s'écrit en Markdown, et chaque bloc sur ses propres lignes :

| Bloc | Écriture | Remarques |
|---|---|---|
| Encadré | `<Callout variant="a-retenir">`, le texte, puis `</Callout>`, chacun sur sa ligne | variantes : `important`, `a-retenir`, `attention`, `en-pratique`, `exemple`, `date-a-retenir`, `ce-qui-change`, `pour-les-particuliers`, `pour-les-entreprises`, `source-officielle`, `mise-a-jour`, `pour-approfondir`, `bon-a-savoir`; `title="…"` remplace le titre par défaut; `pour-approfondir` exige `href="/adresse/"` et devient une carte de lien |
| Texte de loi | `<TexteDeLoi reference="Loi X, art. Y" version="en vigueur au …" url="https://…">`, le texte littéral, puis `</TexteDeLoi>` | citation exacte, avec la version citée et le lien vers le texte officiel |
| Exemple chiffré | `<ExempleChiffre title="…" rows={[{ label: "…", amount: "10000" }]} total={{ label: "…", amount: "4000" }} />` | montants entre guillemets, en dollars, sans espace ni symbole; un montant négatif s'écrit `"-2500"`; l'avertissement « exemple chiffré » de `config/legal.json` s'ajoute seul |
| Chronologie | `<Chronologie items={[{ date: "2026-01-15", title: "…", description: "…", url: "https://…" }]} />` | `description` et `url` facultatives |
| Comparatif | `<Comparatif caption="…" columns={["", "A", "B"]} rows={[["Critère", "…", "…"]]} />` | cellules en texte; la première colonne reste visible quand on fait défiler le tableau sur mobile |
| Citation | `<Citation author="…" role="…" source="…" date="2026-09-25">`, le propos, puis `</Citation>` | `role`, `source` et `date` facultatifs |
| Vidéo | `<Video id="abcdefghijk" title="…" />` | `id` : les 11 caractères après `v=` dans l'adresse YouTube; rien n'est chargé depuis YouTube avant le clic du lecteur |
| Définition | `le <Definition term="jalonnement">jalonnement</Definition>` | `term` : l'identifiant d'un terme du lexique; infobulle avec sa définition courte et lien vers sa fiche; terme non publié : texte simple |
| Mise en garde | `<MiseEnGarde />` | texte fixe de `config/legal.json` |
| Statut réglementaire | `<StatutReglementaire dossier="stablecoins-canada" />` | puce de statut et lien vers le dossier, dans une phrase ou seul sur sa ligne |
| Bloc partenaire | `<BlocPartenaire id="partenaire" />` | affiché seulement si le partenaire est actif dans `config/ads.json`, toujours signalé « Publicité » |
| Note | `…une phrase.<Note>Texte de la note.</Note>` | collée au mot qu'elle commente; numérotée seule, regroupée en fin de page avec un lien de retour |
| FAQ | `<FAQ items={[{ question: "…", answer: "…" }]} />` | questions en accordéon, reprises en données FAQPage pour les moteurs |
| Image | `<Image src="articles/mon-article/schema.webp" alt="…" credit="…" caption="…" />` | `src` : `<collection>/<identifiant>/<fichier>`, dans `content/images/`, nom en minuscules (section 6); texte alternatif et crédit obligatoires; `creditUrl="https://…"`, facultatif, fait du crédit un lien |

**Blocs de page**, réservés aux pages de `content/pages/` :

- `<Hero title="…" ctaLabel="…" ctaUrl="/…">`, l'accroche, puis `</Hero>` : bandeau de tête;
- `<ListeArticles category="…" theme="…" jurisdiction="…" format="…" tag="…" count="6" layout="grid" />` : liste d'articles (filtres facultatifs; `layout` : `grid` ou `list`);
- `<CarteAuteur id="auteur" />` et `<Newsletter />` (`list="…"` pour une autre liste de `config/newsletter.json` que la liste générale);
- `<ListeSources jurisdiction="…" type="…" />`, ou `ids={["source-1", "source-2"]}` : sources réutilisables;
- `<Tableau caption="…" columns={[…]} rows={[…]} />`.

**Ce que l'éditeur ne sait pas relire.** Écrit à la main, un corps doit rester dans ce que l'éditeur comprend, faute de quoi il refuse d'ouvrir le contenu :

- un bloc qui entoure du texte (encadré, texte de loi, citation, bandeau) s'écrit sur trois lignes au moins : balise ouvrante, texte, balise fermante;
- les autres blocs (exemple chiffré, chronologie, mise en garde, image…) occupent une ligne à eux, hors d'un paragraphe; seuls la note, la définition et le statut réglementaire se placent dans une phrase;
- entre accolades, seulement des textes entre guillemets, `null`, des listes et des objets : tout nombre s'écrit entre guillemets (`"-2500"`, `"6"`), et chaque attribut a une valeur (`title="…"`);
- ni HTML, ni commentaire, ni image Markdown (`![…](…)`), ni accolade dans le texte;
- ni note de bas de page Markdown (`[^1]`, que l'éditeur détruirait : utilisez le bloc Note), ni colonnes de tableau alignées (`| :--- |`, alignement retiré);
- ni note dans une définition, ni deux notes collées l'une à l'autre (l'éditeur les fusionnerait).

Le rapport « À vérifier » signale chacune de ces constructions. Un bloc écrit dans du code (entre accents graves) n'est ni interprété ni vérifié : c'est ainsi que ce guide peut les montrer.

## 21. Les pages du site et leurs adresses

L'adresse d'un contenu vient du nom de son fichier (sans `.mdx`) : `content/articles/mon-article.mdx` devient `/articles/mon-article/`. Changer le nom du fichier change l'adresse : voir la section 26 avant de le faire.

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

## 22. Les fiches : ce que le site compose pour vous

Chaque fiche assemble ses champs et les contenus qui la citent : vous n'avez rien à recopier. Une section vide ne s'affiche pas, et le sommaire « Sur cette page » suit. Sur ordinateur, la fiche d'identité et le sommaire occupent la colonne de droite; sur mobile, la fiche devient repliable sous l'en-tête.

- **Dossier** : fiche (statut, autorités, qui est visé, dates clés), « Ce qui change » (`keyChanges`), corps, obligations, sanctions, incidences fiscales (`taxImplications`, paragraphes séparés par une ligne vide), chronologie (`timeline`, triée par date), textes clés, questions fréquentes (`faq`), sources, articles qui citent le dossier (champ `relatedDossiers` des articles) et échéances liées (champ `relatedDossier` de l'agenda). Avertissement « réglementaire » par défaut, modifiable par `disclaimerVariant`.
- **Juridiction** : présentation (corps), actualités (les quatre derniers contenus qui la citent), réglementation (dossiers, ceux de `keyDossiers` en tête), fiscalité (traitements, ceux de `keyTraitements` en tête), organismes rattachés, échéances, et **questions fréquentes** (nouveau champ `faq` : une liste de `question` et `answer`). Les sections portent les ancres `#actualites`, `#reglementation`, `#fiscalite`, `#organismes`, `#agenda` et `#questions`, utilisables dans les menus.
- **Organisme** : vignette à son sigle (jamais son logo officiel), rôle, lien vers le site officiel, dossiers dont il est l'autorité, dernières décisions et textes publiés (textes dont il est l'émetteur), articles et guides qui le citent, sources dont il est l'émetteur, échéances de ses dossiers et sa veille. Le lien « Flux RSS officiel » n'apparaît que si sa source est activée dans `config/sources-veille.json`.
- **Texte** : type, statut, liens vers le texte officiel et sa copie archivée, « Dispositions clés » (`keyProvisions`), corps, dossiers qui le retiennent comme texte clé, articles qui le citent.
- **Traitement fiscal** : « Traitement fiscal » (`treatment`), déclaration (`reportingRequirement`), formulaires (`forms`, lien officiel facultatif), explications (corps), sources, articles liés. **L'avertissement fiscal s'affiche toujours**, sans réglage possible.
- **Terme du lexique** : définition courte (celle des infobulles), synonymes, corps, termes voisins (`seeAlso`), sources officielles et contenus qui l'emploient par le bloc `Definition`. Tant que son corps est vide, la fiche reste hors des moteurs de recherche.
- **Auteur** : présentation (rôle, mention professionnelle, biographie, réseaux), puis ses articles et guides, paginés.
- **Infolettre** : chaque numéro envoyé a sa page d'archive (introduction, articles du numéro, partenaire éventuel signalé « Publicité »).

## 23. Rubriques, listes et filtres

- **Rubrique d'une catégorie** : trois contenus « à la une », puis douze par page. Les pastilles sous le titre sont les sous-entrées du menu qui mène à cette rubrique (`config/navigation.json`) : pour les changer, modifiez le menu.
- **Filtres** (thème, format, juridiction) : ils ouvrent la page de recherche avec la catégorie et les filtres choisis, sans créer de nouvelles pages.
- **Thèmes, formats et étiquettes** : chacun a sa liste. Sous trois contenus, elle reste hors des moteurs de recherche. L'adresse d'une étiquette s'écrit sans accents : `Déclaration` mène à `/tags/declaration/`.
- **Matrice fiscale** (`/fiscalite/traitements/`) : un tableau par type de contribuable, trié par juridiction puis par activité. Chaque tableau porte l'identifiant du type comme ancre (`#particulier`, `#societe`, `#staker`…), utilisable dans les menus.
- **Juridictions** : regroupées par niveau (ancres `#federal`, `#provincial`, `#national`…). **Organismes** : regroupés par juridiction.

## 24. La recherche

La recherche porte sur les articles, guides, dossiers, fiches, termes du lexique, pages, auteurs et numéros de l'infolettre publiés. Elle ignore les accents (« reglementation » trouve « réglementation »), trouve les références comme « 21-332 » ou « 248(1) », et regroupe les résultats par type.

- **Ouvrir** : le champ « Rechercher » de l'en-tête, ou `Ctrl K` (`⌘ K` sur Mac). La page `/recherche/` offre tous les filtres : type, catégorie, thème, format, juridiction, année.
- **Mise à jour** : l'index est recréé à chaque construction du site; un contenu publié est trouvable dès la mise en ligne suivante.
- **Contrôle** : `npm run build` s'arrête si l'index de recherche manque ou est vide.

## 25. Référencement et partage

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

## 26. Changer une adresse : les redirections

Une adresse publiée ne doit jamais mourir : d'autres sites, des courriels ou des mémoires la citent.

- **Renommer un contenu** (article, guide, dossier) : dans l'éditeur, changez son identifiant et enregistrez (le fichier est renommé, ses images déplacées), puis ajoutez l'ancien identifiant dans « Anciennes adresses » (`previousSlugs`). Le site redirige alors l'ancienne adresse vers la nouvelle (redirection permanente 301). Les contenus qui citent l'ancien identifiant ne sont pas mis à jour : le rapport les signale, corrigez-les.
- **Toute autre adresse** (ancien site, page supprimée) : **Réglages › Redirections**, « Ajouter » : ancienne adresse, nouvelle adresse et « Code de redirection » (301 pour un déplacement définitif, le cas normal; 302 pour un déplacement temporaire). Dans le fichier `config/redirects.json` : `{ "from": "/ancienne-adresse/", "to": "/nouvelle-adresse/", "status": 301 }`.
- **Contrôles** : `npm run check` refuse une ancienne adresse déjà redirigée, une redirection qui masquerait une page existante, une boucle, et plus de 2 000 redirections; il signale une destination qui n'existe pas. Une chaîne (A vers B, puis B vers C) est raccourcie seule (A vers C).
- **Filet de sécurité**, une fois le site en ligne : chaque construction compare les adresses du plan du site en ligne à celles du nouveau site, et signale toute adresse disparue sans redirection. Un contenu repassé en brouillon est une dépublication voulue : simple information.

## 27. Flux, agenda et impression

- **Flux** : `/rss.xml` (les 20 derniers contenus), un flux par catégorie (`/reglementation/rss.xml`…) et `/feed.json` (format JSON Feed), avec titre, résumé et lien.
- **Agenda** : `/agenda/` montre les échéances à venir, par mois. Chaque échéance se télécharge au format calendrier (« Ajouter à mon agenda »), et `/agenda.ics` contient tout l'agenda, à importer ou à suivre dans un logiciel de calendrier. Une échéance avec une heure (`time`) et sans date de fin est ponctuelle; les autres occupent des journées entières, de `date` à `endDate`.
- **Veille officielle** : `/veille/` liste les publications des autorités relevées automatiquement (phase 4), avec des filtres par source, juridiction et période.
- **Impression** : dossiers, fiches et articles s'impriment sur une seule colonne, sans menus ni barre latérale, avec l'adresse des liens externes et les blocs repliables ouverts (bouton « Imprimer » des dossiers, textes et traitements fiscaux).

## 28. L'infolettre : préparer et envoyer un numéro

1. **Préparer** : `npm run newsletter:draft` crée le prochain numéro en brouillon (`content/newsletters/AAAA-NNN.mdx`). Il reprend les articles publiés depuis la date d'envoi du dernier numéro envoyé (ce jour compris), cochés « Proposer dans l'infolettre », moins ceux qu'un numéro envoyé contient déjà. Sans numéro envoyé, il remonte une semaine.
2. **Rédiger** : dans l'éditeur, **Numéros de l'infolettre**, remplissez l'objet, le pré-en-tête (texte d'aperçu affiché dans la boîte de réception) et le mot d'introduction; retirez ou réordonnez les articles. Le mot d'introduction accepte paragraphes, intertitres, listes à puces ou numérotées, gras, italique et liens; une citation y devient un paragraphe, et les blocs n'y passent pas.
3. **Archiver** : passez le statut à « Envoyé », indiquez la date d'envoi (aujourd'hui), sauvegardez et mettez en ligne. Le numéro rejoint l'archive `/newsletter/` : le lien « Lire ce numéro dans votre navigateur » du courriel y mène, il faut donc qu'elle existe avant l'envoi.
4. **Produire le courriel** : `npm run newsletter:draft -- --html` crée `exports/infolettre/<numéro>.html` et sa version texte `.txt` (pour un numéro précis : `npm run newsletter:draft -- --html 2026-002`). La commande avertit si le courriel contient encore un marqueur, un article non publié, un partenaire désactivé, ou si le numéro n'est pas encore archivé.
5. **Envoyer** : chez le fournisseur (Brevo), créez une campagne, choisissez l'éditeur « code HTML » et collez le contenu du fichier `.html`. Le lien de désabonnement est la balise que le fournisseur remplace à l'envoi : réglages de l'infolettre, « Lien de désabonnement » (`{{ unsubscribe }}` chez Brevo, à vérifier lors de l'ouverture du compte, phase 4). Envoyez-vous d'abord un essai. Vous pouvez ensuite noter l'identifiant de la campagne dans le numéro.

Chaque courriel porte l'identification et l'adresse postale de l'expéditeur (mentions juridiques, « Expéditeur de l'infolettre ») et la phrase qui rappelle pourquoi le lecteur le reçoit (textes de l'interface, section `newsletterEmail`, à valider). L'envoi reste toujours un geste humain.

## 29. Corriger, dépublier, restaurer une version

- **Coquille** : corrigez, sauvegardez, mettez en ligne. Inutile de changer la date de mise à jour.
- **Correction de fond** : renseignez la « Date de mise à jour » et ajoutez une « Note de correction » (date et texte) : elle s'affiche sous le titre.
- **Dépublier** : repassez le statut à « Brouillon » (la page disparaît, son adresse répond « introuvable ») ou « Archivé » (la page reste, retirée des listes et des flux, avec la mention « Contenu archivé »).
- **Annuler des changements pas encore enregistrés** : bouton ↺ (« Reset changes ») en haut du formulaire.
- **Restaurer une version mise en ligne** : dans GitHub Desktop, onglet « History », clic droit sur l'envoi à annuler, « Revert changes in commit », puis « Push origin ». Le site revient à l'état précédent à la construction suivante. Chaque enregistrement mis en ligne reste dans l'historique : rien n'est jamais perdu.

## 30. Ce qu'il faut savoir sur l'éditeur

**Mots restés en anglais.** Keystatic, l'outil qui fournit l'éditeur, ne traduit qu'une partie de son habillage :

| Mot | Sens |
|---|---|
| Unsaved | modifications pas encore enregistrées |
| Regenerate | recalcule l'identifiant à partir du titre |
| Edit | propriétés d'un bloc (variante d'un encadré, lignes d'un tableau…) |
| Paragraph, Heading 2, Heading 3 | style du paragraphe : texte courant ou intertitre |
| Choose file, Remove | choisir ou retirer une image |
| Reset changes | annule les modifications non enregistrées |
| Delete entry, Duplicate entry, Copy entry, Paste entry | supprimer, dupliquer, copier, coller une entrée |
| Preview | voir la page sur le site local |
| Save, Create | enregistrer ou créer, dans les réglages |
| Add item, Empty list | ajouter un élément à une liste; liste encore vide |
| N entries | nombre d'entrées d'une collection |
| Light, Dark, System | thème de l'éditeur : clair, sombre, celui de l'appareil |
| « … must not be empty » | champ obligatoire resté vide |

**Une seule source de modifications à la fois.** L'éditeur garde dans le navigateur les changements non enregistrés. Si le fichier a été modifié entre-temps ailleurs (par exemple par Claude Code), un message « Restored draft… Other changes have been made to this entry » apparaît : cliquez sur ↺ (« Reset changes ») pour repartir du fichier, sinon votre enregistrement écraserait l'autre modification.

**Renommer un contenu** : changez son identifiant (ou « Regenerate »), puis enregistrez. Le fichier est renommé et ses images déplacées, mais les autres contenus qui le citent ne sont pas mis à jour : ajoutez l'ancien identifiant dans « Anciennes adresses » (section 26), puis corrigez les relations que signale le rapport.

**Sécurité** : l'éditeur écrit dans les fichiers du site sans demander de mot de passe. Il ne fonctionne que sur votre ordinateur : lancé avec l'option `--host`, qui ouvre le site au réseau, ou `--allowedHosts`, qui le rend joignable par un tunnel, `npm run dev` le désactive.

**Réseau** : l'éditeur charge sa police (Inter) depuis Google Fonts; le site public, lui, ne fait aucun appel extérieur.

**Mise en forme des fichiers** : au premier enregistrement, l'éditeur écrit le texte à sa façon (puces `*`, `\[` devant un marqueur, blocs indentés). Tout le contenu du site est déjà dans ce format. Après une modification faite à la main ou par Claude Code, `npm run content:format` le rétablit, sans rien changer aux données : un fichier dont l'enregistrement changerait une donnée, une image ou le rendu (image mal nommée, notes collées…) est laissé tel quel et signalé, avec la raison.
