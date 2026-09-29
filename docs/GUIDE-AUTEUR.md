# Guide de l'auteur

Ce guide explique comment faire vivre le site sans toucher au code. Toutes les fonctions qu'il décrit sont livrées; la mise en ligne elle-même, à faire une fois, est en section 41. Tout se fait dans l'éditeur (section 3), qui remplit les fichiers décrits ici; ces fichiers restent modifiables avec un simple éditeur de texte.

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
31. Les services en un coup d'œil
32. L'infolettre : ouvrir le compte Brevo et brancher l'inscription
33. Sauvegarder les abonnés : l'export mensuel
34. Le formulaire de contact
35. La protection contre les robots : Turnstile
36. La mesure d'audience : Umami
37. La veille officielle
38. Reconstruction nocturne, surveillance et alertes
39. Les cours des cryptoactifs
40. Les pages légales et de confiance
41. Mettre le site en ligne
42. Les vérifications automatiques

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
| ajouter un actif au bandeau des cours | Réglages › Bandeau des cours (section 39) |
| ajouter une source à la veille | Réglages › Sources de la veille (section 37) |
| ajouter une redirection | Réglages › Redirections (section 26) |
| préparer et envoyer un numéro de l'infolettre | `npm run newsletter:draft` (section 28) |
| brancher l'inscription à l'infolettre (Brevo) | section 32 |
| sauvegarder la liste des abonnés | export mensuel (section 33) |
| activer le formulaire de contact | Réglages › Services › Formulaire de contact (section 34) |
| régler la protection contre les robots | Réglages › Services › Protection contre les robots (section 35) |
| activer la mesure d'audience | Réglages › Services › Mesure d'audience (section 36) |
| savoir où ranger une clé secrète | section 31 |
| compléter la politique de confidentialité, les mentions légales, la page À propos | Contenus › Pages (section 40) |
| savoir si le site en ligne est à jour | section 38 |
| mettre le site en ligne la première fois | section 41 |
| voir une branche en ligne avant de publier | section 41, « Aperçus de branche » |
| revenir à la version précédente du site en ligne | section 41, « Retour en arrière » |
| être averti si le site ne répond plus | sonde de disponibilité (section 41, étape 11) |
| savoir si les vérifications automatiques passent | section 42 |
| essayer le site et ses formulaires sur mon ordinateur | `npm run trial` (section 31) |
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
| `npm run consent:version` | affiche la version du texte de consentement de l'infolettre et son texte exact (section 32) |
| `npm run content:format` | remet les fichiers au format de l'éditeur après une modification faite à la main (section 30) |
| `npm run check` | vérifie tout le contenu et écrit le rapport `docs/A-VERIFIER.md` (section 16) |
| `npm run build` | lance `check`, construit le site public dans `dist/` (sans les brouillons), crée l'index de la recherche, puis contrôle le résultat (section 24) |
| `npm run preview` | sert le dossier `dist/` en local, pour voir le site tel qu'il sera publié |
| `npm test` | lance les tests automatiques |
| `npm run typecheck` | vérifie le code (utile après une modification technique) |
| `npm run veille:fetch` | relève les publications des sources de la veille; `-- --diagnostic` essaie les sources sans rien enregistrer (section 37) |
| `npm run surveillance` | vérifie que le site en ligne est à jour (section 38) |
| `npm run trial` | construit une version d'aperçu, puis sert le site et ses formulaires en mode d'essai sur http://127.0.0.1:8791 : rien n'est envoyé (section 31) |
| `npm run test:e2e` | lance les parcours de fumée dans Chromium, comme la vérification automatique de GitHub (section 42) |

**Deux modes d'affichage.**

- **Production** (`npm run build`) : seuls les contenus publiés existent. Les brouillons n'apparaissent nulle part : ni page, ni liste, ni flux.
- **Aperçu** (`npm run dev`, `npm run trial`, `SITE_MODE=preview npm run build`, et chaque aperçu de branche en ligne, section 41) : les brouillons et les contenus programmés sont visibles, avec une pastille « Brouillon, non publié ». Un bandeau jaune le rappelle en haut de chaque page, et les pages portent la consigne `noindex`, qui les écarte des moteurs de recherche.

En mode `npm run dev` seulement, trois pages de travail existent : l'éditeur, http://127.0.0.1:4321/keystatic (section 3); le rapport « À vérifier » à jour, http://127.0.0.1:4321/a-verifier/ (section 16); et http://127.0.0.1:4321/exemple/, qui montre chaque bloc d'écriture et chacune de ses variantes (section 20).

La recherche n'existe qu'une fois le site construit : pour l'essayer en local, lancez `npm run build` (ou `SITE_MODE=preview npm run build`), puis `npm run preview`.

## 3. L'éditeur : ouvrir, enregistrer, mettre en ligne

L'éditeur est un ensemble de formulaires, en français, au-dessus des fichiers du site : il écrit les mêmes fichiers que ceux décrits dans ce guide. Il fonctionne sur votre ordinateur, pendant que le site tourne en local.

**Ouvrir l'éditeur** : lancez `npm run dev`, puis ouvrez http://127.0.0.1:4321/keystatic. Le menu de gauche regroupe :

- **Contenus** : articles, guides, dossiers, numéros de l'infolettre, pages;
- **Fiches** : juridictions, organismes, textes, traitements fiscaux, lexique, agenda;
- **Références** : sources réutilisables et auteurs;
- **Classements** : catégories, thèmes, formats, activités fiscales, types de contribuables;
- **Réglages** : un formulaire par fichier de `config/` (identité du site, menus, page d'accueil, thème, infolettre, services, mentions juridiques, sources de la veille, partenaires, redirections, bandeau des cours, textes de l'interface).

**La liste d'une collection** montre l'identifiant, le titre, le statut et la date. Le champ de recherche de la liste ne cherche que dans les identifiants (« impot », pas « Impôt »). Le bouton « Ajouter » crée une entrée.

**Le formulaire** range les champs par groupes (Contenu, Classement, Publication, Révision, Réglementation, Fiscalité, Sources, Relations, Infolettre, Référencement). Sous chaque libellé, une aide rappelle la règle; un astérisque marque un champ obligatoire. Pour les articles, les guides, les pages et les numéros de l'infolettre, le texte occupe le centre de l'écran et les champs la colonne de droite.

**Enregistrer** (« Sauvegarder ») écrit le fichier dans le dossier du site : rien n'est encore en ligne. L'éditeur refuse d'enregistrer tant qu'un champ enfreint sa règle (le message s'affiche sous le champ). Les règles qui croisent plusieurs contenus (source officielle, relations, marqueurs) sont vérifiées ensuite par `npm run check`, ou sur la page http://127.0.0.1:4321/a-verifier/.

**Voir la page** : l'icône en forme de flèche sortante (« Preview ») ouvre la page du contenu sur le site local, brouillons compris, dans un nouvel onglet. Elle se met à jour à chaque enregistrement.

**Mettre en ligne** : chaque enregistrement modifie des fichiers; la mise en ligne consiste à les envoyer sur GitHub.

1. Ouvrez GitHub Desktop : la liste des fichiers modifiés s'affiche, avec les changements en couleur.
2. Relisez-les, écrivez un résumé (ex. « Publie l'article sur l'inscription des plateformes »), puis cliquez sur « Commit to main ».
3. Cliquez sur « Push origin ». La construction du site en ligne démarre et dure quelques minutes (section 41). Si une erreur bloquante subsiste, le site en ligne garde sa version précédente (section 17).

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

**Programmer une publication.** Choisissez le statut « Programmé », puis la date et l'heure de publication; sauvegardez et mettez en ligne comme d'habitude. Le contenu reste invisible jusqu'à l'heure dite. À chaque construction, le site publie la liste des heures de publication à venir (`/schedule.json`, sans titre ni adresse : rien ne fuit avant l'heure). Une tâche planifiée la consulte toutes les 15 minutes et relance la construction du site dès qu'une heure est passée : le contenu paraît au plus une vingtaine de minutes après l'heure choisie (une fois le site en ligne, section 41). Le rapport « À vérifier » liste les publications programmées. Un contenu programmé est vérifié comme s'il était déjà publié : un marqueur oublié bloque la construction dès sa mise en ligne, et non à l'heure dite, quand personne ne regarde.

## 6. Images

Les champs d'image (couverture, image de partage, photo d'un auteur) ont un bouton « Choose file » pour choisir le fichier et « Remove » pour le retirer. Le site produit lui-même les tailles et les formats utiles : envoyez une image assez grande (1 600 pixels de large pour une couverture), en JPEG, PNG ou WebP. Le rapport « À vérifier » signale une image de plus de 500 Ko.

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
| `veille-latest` | les dernières publications officielles (section 37) | `count`, `cta` |
| `lexique-spotlight` | des termes du lexique, qui changent chaque jour | `count`, `cta` |
| `most-read` | les plus lus : la liste `manualSelection` (le classement par la mesure d'audience est prévu en version 2, section 36) | `manualSelection`, `count` |
| `newsletter-cta` | l'invitation à s'abonner | `list` (liste de `config/newsletter.json`) |
| `partner-block` | un bloc partenaire signalé « Publicité » | `partnerId` (partenaire de `config/ads.json`, qui doit être activé) |
| `custom-html` | un texte libre, affiché tel quel (aucun code n'est exécuté) | `content` (paragraphes séparés par une ligne vide) |
| `market-brief`, `trending-assets` | données de marché (section 39) | — |

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
- `privacyOfficer` : la personne responsable de la protection des renseignements personnels (Loi 25), affichée sur la page Confidentialité (section 40).
- `dataInventory` : le tableau des renseignements recueillis (traitement, renseignements, où, lieu d'hébergement, conservation), affiché lui aussi sur la page Confidentialité.
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

- Un contenu **publié** ou **programmé** qui contient encore un marqueur **bloque la construction du site** en production. Un brouillon peut en contenir autant qu'il faut.
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

La vérification des liens externes interroge chaque site cité : elle est lente et demande un accès réseau. Elle se lance à part, avec `npm run check -- --liens-externes`, et le rapport hebdomadaire la fait chaque lundi (section 38).

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
- `<CarteAuteur id="auteur" />` et `<Newsletter />` (`list="…"` pour une autre liste active de `config/newsletter.json` que la première);
- `<ListeSources jurisdiction="…" type="…" />`, ou `ids={["source-1", "source-2"]}` : sources réutilisables;
- `<Tableau caption="…" columns={[…]} rows={[…]} />`;
- `<FormulaireContact />` : le formulaire de contact (**Réglages › Services › Formulaire de contact**, section 34), ou votre courriel de contact s'il est désactivé;
- `<ResponsableProtection />` : nom, titre et courriel du responsable de la protection des renseignements personnels (**Réglages › Mentions juridiques**);
- `<InventaireDonnees />` : tableau des renseignements recueillis (**Réglages › Mentions juridiques › Renseignements recueillis**).

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
- **Veille officielle** : `/veille/` liste les publications des autorités relevées automatiquement (section 37), avec des filtres par source, juridiction et période.
- **Impression** : dossiers, fiches et articles s'impriment sur une seule colonne, sans menus ni barre latérale, avec l'adresse des liens externes et les blocs repliables ouverts (bouton « Imprimer » des dossiers, textes et traitements fiscaux).

## 28. L'infolettre : préparer et envoyer un numéro

1. **Préparer** : `npm run newsletter:draft` crée le prochain numéro en brouillon (`content/newsletters/AAAA-NNN.mdx`). Il reprend les articles publiés depuis la date d'envoi du dernier numéro envoyé (ce jour compris), cochés « Proposer dans l'infolettre », moins ceux qu'un numéro envoyé contient déjà. Sans numéro envoyé, il remonte une semaine.
2. **Rédiger** : dans l'éditeur, **Numéros de l'infolettre**, remplissez l'objet, le pré-en-tête (texte d'aperçu affiché dans la boîte de réception) et le mot d'introduction; retirez ou réordonnez les articles. Le mot d'introduction accepte paragraphes, intertitres, listes à puces ou numérotées, gras, italique et liens; une citation y devient un paragraphe, et les blocs n'y passent pas.
3. **Archiver** : passez le statut à « Envoyé », indiquez la date d'envoi (aujourd'hui), sauvegardez et mettez en ligne. Le numéro rejoint l'archive `/newsletter/` : le lien « Lire ce numéro dans votre navigateur » du courriel y mène, il faut donc qu'elle existe avant l'envoi.
4. **Produire le courriel** : `npm run newsletter:draft -- --html` crée `exports/infolettre/<numéro>.html` et sa version texte `.txt` (pour un numéro précis : `npm run newsletter:draft -- --html 2026-002`). La commande avertit si le courriel contient encore un marqueur, un article non publié, un partenaire désactivé, ou si le numéro n'est pas encore archivé.
5. **Envoyer** : chez le fournisseur (Brevo), créez une campagne, choisissez l'éditeur « code HTML » et collez le contenu du fichier `.html`. Le lien de désabonnement est la balise que le fournisseur remplace à l'envoi : réglages de l'infolettre, « Lien de désabonnement » (`{{ unsubscribe }}` chez Brevo, à vérifier au premier envoi d'essai). Envoyez-vous d'abord un essai. Vous pouvez ensuite noter l'identifiant de la campagne dans le numéro.

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

**Réseau** : l'éditeur charge sa police (Inter) depuis Google Fonts. Le site public, lui, n'appelle un service extérieur que pour la protection contre les robots, au premier contact avec un formulaire (section 35), et pour la mesure d'audience si elle est activée (section 36).

**Mise en forme des fichiers** : au premier enregistrement, l'éditeur écrit le texte à sa façon (puces `*`, `\[` devant un marqueur, blocs indentés). Tout le contenu du site est déjà dans ce format. Après une modification faite à la main ou par Claude Code, `npm run content:format` le rétablit, sans rien changer aux données : un fichier dont l'enregistrement changerait une donnée, une image ou le rendu (image mal nommée, notes collées…) est laissé tel quel et signalé, avec la raison.

## 31. Les services en un coup d'œil

Le site se construit seul, sans aucun service. Pour l'infolettre, le formulaire de contact, la mesure d'audience et les cours de marché, il s'appuie sur des services extérieurs, tous gratuits au lancement. Chacun a son compte (à protéger par la double authentification) et, pour certains, une clé secrète.

| Service | Rôle | Réglage dans l'éditeur | Secret (jamais dans un fichier du site) |
|---|---|---|---|
| Brevo | inscriptions à l'infolettre (double consentement), envoi des numéros, messages du formulaire de contact | Réglages › Infolettre (section 32); Réglages › Services › Formulaire de contact (section 34) | `NEWSLETTER_API_KEY` |
| Cloudflare Turnstile | protection des formulaires contre les robots | Réglages › Services › Protection contre les robots (section 35) | `TURNSTILE_SECRET_KEY` |
| Umami Cloud | mesure d'audience, sans témoin | Réglages › Services › Mesure d'audience (section 36) | aucun |
| CoinGecko | cours du bandeau et des sections de marché | Réglages › Bandeau des cours (section 39) | `COINGECKO_API_KEY` |
| Cloudflare Workers | hébergement, envoi des formulaires, publication programmée | aucun (fichier `wrangler.jsonc`) | `IP_HASH_SALT`, `DEPLOY_HOOK_URL`, `CONTACT_TO` (facultatif) |
| GitHub Actions | veille officielle, surveillance, rapport hebdomadaire, vérifications automatiques | aucun (dossier `.github/workflows/`) | aucun |
| UptimeRobot | sonde de disponibilité (section 41, étape 11) | aucun | aucun |

**Où vont les secrets.** Dans le tableau de bord de Cloudflare, sur la page du Worker du site, « Settings », puis « Variables and Secrets », partie « Production » : chaque secret y est ajouté en type « Secret », jamais « Text ». `COINGECKO_API_KEY` est une variable de construction : elle se déclare dans les réglages de construction (« Build »), puisque les cours sont lus pendant la construction. La mise en ligne pas à pas, secrets compris, est en section 41; d'ici là, les formulaires affichent leurs messages mais n'envoient rien.

| Secret | Ce que c'est | Si vous le perdez |
|---|---|---|
| `NEWSLETTER_API_KEY` | clé d'API de Brevo (section 32) | en créer une nouvelle dans Brevo, puis la remplacer |
| `TURNSTILE_SECRET_KEY` | clé secrète du widget Turnstile (section 35) | la régénérer dans Cloudflare |
| `IP_HASH_SALT` | suite de caractères aléatoires qui rend l'empreinte des adresses IP impossible à remonter : au moins 32 caractères, tirés au hasard par un gestionnaire de mots de passe | en créer un nouveau; les empreintes déjà enregistrées restent des preuves valables. Ne le changez jamais sans raison |
| `DEPLOY_HOOK_URL` | adresse qui déclenche une construction du site (publication programmée) | la régénérer dans Workers Builds si elle a été divulguée |
| `CONTACT_TO` | facultatif : adresse qui reçoit les messages du formulaire, si elle diffère du courriel de contact de l'identité du site | aucun risque |
| `COINGECKO_API_KEY` | clé « Demo » de CoinGecko (section 39) | en créer une nouvelle chez CoinGecko |

**Comment un envoi est protégé.** Chaque envoi de formulaire passe, dans l'ordre : origine (le formulaire doit venir du site), taille maximale, champ piège invisible (un robot qui le remplit reçoit un faux succès), validation des champs, limitation de débit par adresse IP, vérification anti-robot (section 35), puis, pour l'infolettre, limitation par adresse courriel (après la vérification, pour qu'un tiers ne puisse pas bloquer l'adresse d'un lecteur). La limitation accepte 5 envois par minute depuis une même adresse IP (tout un réseau derrière un même routeur ou un même opérateur mobile compte pour une), et, pour l'infolettre, 5 par minute pour une même adresse courriel; au-delà, le lecteur lit « Trop d'envois en peu de temps ». Elle se règle dans `wrangler.jsonc` (`ratelimits`) et reste approximative, chaque centre de données de Cloudflare comptant de son côté. Cloudflare ne dit pas si elle est offerte en forfait gratuit : si le premier déploiement la refuse, on la retire, et Turnstile, le champ piège et le double consentement suffisent \[À VÉRIFIER au premier déploiement]. Rien de ce qui est envoyé n'est conservé par le site, et ses journaux ne contiennent ni adresse IP ni adresse courriel.

**Essayer le site et ses formulaires sur votre ordinateur** (utile après une modification technique) : `npm run trial`. La commande construit une version d'aperçu (brouillons compris), puis sert le site avec son Worker en mode d'essai sur http://127.0.0.1:8791 :

- inscriptions et messages restent en mémoire : rien n'est envoyé, aucun secret n'est nécessaire;
- la vérification anti-robot utilise la clé d'essai de Cloudflare, posée d'office par la construction d'aperçu : ne la saisissez pas dans les réglages. Le script de Turnstile demande Internet;
- pour essayer le formulaire de contact, activez-le le temps de l'essai (**Réglages › Services › Formulaire de contact**); en mémoire, aucune adresse de réception n'est exigée;
- la tâche planifiée se déclenche à la main avec `curl "http://127.0.0.1:8791/cdn-cgi/local/scheduled?cron=7,22,37,52+*+*+*+*"`;
- Ctrl+C arrête l'essai.

N'ajoutez jamais les options `--ip 0.0.0.0` ni `--tunnel` à la commande `wrangler`, qui ouvriraient l'essai à d'autres ordinateurs. Les aperçus de branche en ligne fonctionnent de la même façon (section 41).

## 32. L'infolettre : ouvrir le compte Brevo et brancher l'inscription

À faire une fois, dans l'ordre. Les libellés de Brevo peuvent varier légèrement.

1. **Compte.** Créez le compte Brevo (forfait gratuit), puis passez l'interface en français : menu du compte, « Mon profil », « Langue ».
2. **Domaine d'envoi.** Dans « Expéditeurs, domaines et IP dédiées », onglet « Domaines », ajoutez le domaine du site et suivez les consignes : Brevo donne trois ou quatre enregistrements DNS (code Brevo, DKIM, DMARC) à créer chez Cloudflare, dans la zone DNS du domaine. Sans domaine authentifié, Brevo remplace votre adresse d'expédition par une des siennes, et les grandes messageries classent vos envois en indésirables. Une adresse Gmail ou Hotmail ne peut pas servir d'expéditeur.
3. **Liste.** Dans « Contacts », « Listes », créez la liste « Infolettre hebdomadaire ». Son numéro s'affiche dans la liste des listes : saisissez-le dans **Réglages › Infolettre › Listes d'inscription › Identifiant chez le fournisseur**. Seules les listes actives acceptent des inscriptions : les formulaires sans liste précisée (pied de page, barre latérale, page Infolettre) inscrivent à la première liste active, et le rapport refuse une section d'accueil ou un bloc « Infolettre » relié à une liste désactivée.
4. **Attributs de la preuve de consentement.** Dans les réglages des contacts, « Attributs », créez ces six attributs de type **Texte**, en majuscules, exactement ainsi : `CONSENT_AT`, `CONSENT_SOURCE`, `CONSENT_TEXT_VERSION`, `CONSENT_IP_HASH`, `NL_LIST`, `NL_TAGS`. Brevo ignore sans prévenir un attribut qui n'existe pas : un nom mal écrit, et la preuve n'est pas enregistrée.
5. **Courriel de confirmation.** Dans « Modèles », créez un modèle en français (« Confirmez votre inscription à l'infolettre… ») :
   - un bouton dont le lien est de type « Double opt-in link » (dans le code, `{{ doubleoptin }}`);
   - l'étiquette (« Tag ») `optin`, dans les réglages avancés du modèle;
   - l'expéditeur sur votre domaine authentifié;
   - aucun champ de personnalisation (prénom, etc.) : Brevo ne les remplit pas dans ce courriel.

   Activez le modèle, puis saisissez son numéro dans **Réglages › Infolettre › Modèle du courriel de confirmation**. Le lien du courriel mène à la page `/newsletter/confirmation/` du site (adresse fixe), dont le titre et le texte se règlent dans **Réglages › Infolettre › Textes**.
6. **Clé d'API.** Dans « SMTP et API », « Clés API », créez une clé nommée « Site » au moment de la saisir dans le secret `NEWSLETTER_API_KEY` du Worker (section 41, étape 8), et copiez-la aussitôt. Ne la collez nulle part ailleurs.
7. **Blocage des adresses IP.** Dans « Sécurité », « IP autorisées », désactivez le blocage des adresses IP inconnues. Les adresses de Cloudflare changent sans cesse : sans ce réglage, Brevo refuse toutes les inscriptions après trente jours (« unrecognised IP address »).
8. **Essai**, avec vos propres adresses, sur le site en ligne. Notez chaque résultat dans ARCHITECTURE, section 25.6 (« Protocole d'essai de Brevo ») : plusieurs comportements de Brevo ne sont connus que par des extraits de sa documentation.
   - Nouvelle adresse : le courriel de confirmation arrive.
   - Même adresse, avant de cliquer sur le lien : le message de succès est le même; un second courriel part-il? \[À VÉRIFIER]
   - Clic sur le lien : l'adresse entre dans la liste; ouvrez le contact dans Brevo, les six attributs doivent être remplis, et la date d'ajout à la liste doit être celle du clic.
   - Même adresse, après le clic : message de succès, aucun nouveau courriel \[À VÉRIFIER].
   - Contact déjà connu de Brevo, hors de la liste, et adresse désabonnée : notez ce qui se passe.
   - Attributs relus avant et après le clic : notez lesquels changent.

**Ce que voit le lecteur.** Il saisit son adresse, coche la case de consentement (jamais cochée d'avance) et envoie. Un message neutre s'affiche (« si votre adresse n'est pas déjà inscrite… ») : le site ne révèle jamais si une adresse est inscrite. Il reçoit le courriel de confirmation, clique, et arrive sur la page de confirmation. Il n'est ajouté à la liste qu'à ce moment.

**La preuve de consentement**, conservée chez Brevo avec chaque abonné confirmé : la date et l'heure de la demande (`CONSENT_AT`), la page et l'emplacement du formulaire (`CONSENT_SOURCE`), la version du texte de consentement affiché (`CONSENT_TEXT_VERSION`, empreinte courte du texte tel qu'il s'affiche : texte de consentement avec le nom du site, puis libellé du lien de confidentialité; `npm run consent:version` affiche la version en cours et son texte, et, lancée sur une version passée du site, celle de l'époque; renommer le site change donc la version), l'empreinte de l'adresse IP (`CONSENT_IP_HASH`, jamais l'adresse elle-même), la liste et l'emplacement (`NL_LIST`, `NL_TAGS`). La date de confirmation est la date d'ajout à la liste, qui figure dans l'export (section 33) \[À VÉRIFIER : essai de l'étape 8].

**Plafond du forfait gratuit** : 300 envois par jour, courriels de confirmation, messages du formulaire de contact et chaque destinataire d'un numéro compris; la mention « Sent with Brevo » est imposée. Au-delà de 300 abonnés, un numéro ne part qu'en plusieurs jours. Prévoyez le forfait Starter (de l'ordre de 9 $ US par mois, prix à revérifier le jour du choix) quand la liste approche 250 abonnés.

## 33. Sauvegarder les abonnés : l'export mensuel

Les abonnés et leurs preuves de consentement n'existent que chez Brevo. Chaque mois :

1. Dans Brevo, « Contacts », ouvrez la liste « Infolettre hebdomadaire », puis « Exporter ».
2. Cochez l'adresse courriel, les six attributs de la section 32 et la date d'ajout, format CSV.
3. Récupérez le fichier (cloche des notifications, ou courriel), puis rangez-le dans l'emplacement chiffré de votre choix \[À COMPLÉTER PAR L'AUTEUR].

Ce fichier contient des renseignements personnels : **jamais dans le dossier du site**, jamais sur GitHub. Il permettrait, en cas de changement de fournisseur, de réimporter la liste avec ses preuves.

## 34. Le formulaire de contact

- **Activer** : **Réglages › Services › Formulaire de contact** : « Activé », l'adresse d'expédition (une adresse de votre domaine authentifié chez Brevo, section 32, par exemple `contact@votre-domaine.ca`) et le nom d'expéditeur. Les messages arrivent au **courriel de contact** de **Réglages › Identité du site** (ou à l'adresse du secret `CONTACT_TO`).
- **Où il apparaît** : sur la page Contact, par le bloc « Formulaire de contact » (section 20). Les liens « Signaler une erreur » et « Suggérer un sujet » des articles y mènent, avec le sujet choisi et l'adresse de la page déjà remplis. Désactivé, le formulaire laisse place à votre courriel de contact; ses textes (**Réglages › Textes de l'interface**, section `contactForm`) ne s'affichent pas, et leurs marqueurs ne bloquent pas la mise en ligne.
- **Répondre** : répondez simplement au courriel reçu : la réponse part au lecteur.
- **Ne cliquez jamais « Se désabonner »** dans ces courriels : Brevo bloquerait votre propre adresse. Si c'est fait, retirez-la de la liste de blocage des courriels transactionnels, dans Brevo.
- Le site ne conserve rien : le message est transmis, puis oublié.

## 35. La protection contre les robots : Turnstile

Turnstile, le service anti-robots de Cloudflare, vérifie chaque envoi de formulaire. La plupart du temps, il reste invisible; il n'affiche un défi que s'il doute, et le formulaire l'annonce alors (« Une vérification anti-robot est nécessaire… »). Son script n'est chargé qu'au premier contact avec un formulaire, quand un de ses champs reçoit le focus (clic ou tabulation) ou qu'on appuie sur son bouton : aucune connexion à Cloudflare avant. Cloudflare conseille plutôt de le charger dès l'ouverture de la page, pour une vérification un peu plus rapide; le site a choisi la discrétion. Le widget s'affiche en français et suit le thème, clair ou sombre, du site.

1. Dans le tableau de bord de Cloudflare, « Turnstile », ajoutez un widget : nom du site, nom d'hôte = domaine du site (ses sous-domaines sont couverts d'office), mode « Géré » (« Managed »), préautorisation (« Pre-clearance ») désactivée.
2. Copiez la **clé de site** dans **Réglages › Services › Protection contre les robots › Clé de site**, et la **clé secrète** dans le secret `TURNSTILE_SECRET_KEY` du Worker, une fois celui-ci créé (section 41, étape 8).
3. **Changer la clé secrète** (si elle a fuité) : « Rotate secret key » dans Cloudflare; l'ancienne reste valable deux heures, le temps de remplacer le secret.

Sans ces deux clés, les formulaires refusent tout envoi : le rapport « À vérifier » le rappelle (section 16), et bloque la construction une fois le site en ligne, comme tout réglage manquant qui fait refuser les envois (modèle ou numéro de liste Brevo, aucune liste active, adresse d'expédition du contact). Les clés d'essai de Cloudflare (celles qui commencent par `1x0000`, `2x0000` ou `3x0000`) ne servent qu'en mode d'essai : sur votre ordinateur (section 31) et dans les aperçus de branche (section 41), dont la construction pose d'office la clé de site d'essai. Ne les saisissez jamais dans les réglages : le rapport bloque une clé de site d'essai une fois le site en ligne, et le Worker refuse une clé secrète d'essai hors du mode d'essai.

## 36. La mesure d'audience : Umami

1. Créez un compte Umami Cloud. Le forfait gratuit (« Hobby ») couvre un seul site, 100 000 événements par mois et six mois d'historique. La région des données (États-Unis ou Union européenne) se choisit à la création du compte : prenez l'Union européenne.
2. Ajoutez le site (« Add website », avec son domaine) et copiez son identifiant (« Website ID »).
3. Dans **Réglages › Services › Mesure d'audience** : « Activé », l'identifiant, et le domaine du site dans « Domaines mesurés », écrit exactement comme dans la barre d'adresse (`www` compris s'il y a lieu). Le rapport signale un domaine qui ne correspond pas à l'adresse du site : ses visites ne seraient pas comptées.
4. Une fois le site en ligne, vérifiez que les mesures partent : sur une page du site, ouvrez les outils de développement du navigateur, onglet « Réseau ». Un envoi vers `gateway.umami.is/api/send` doit répondre 200. S'il est bloqué par la politique de sécurité (« CSP »), Umami a changé d'adresse de collecte, comme en juin 2026 : saisissez la nouvelle dans « Adresses de collecte ».
5. Pour ne pas compter vos propres visites, tapez une fois `localStorage.setItem('umami.disabled', 1)` dans la console du navigateur, sur le site en ligne (à refaire sur chaque navigateur).

**Ce qui est mesuré** : les pages vues; les inscriptions à l'infolettre, avec l'emplacement du formulaire; les messages de contact; les recherches (le terme tapé, 50 caractères au plus, et le nombre de résultats; un terme qui pourrait contenir un renseignement personnel n'est pas transmis : adresse courriel, cinq chiffres ou plus, longue suite de caractères sans espace comme une adresse de portefeuille) \[À VALIDER PAR L'AUTEUR : conserver les termes de recherche]; les clics vers d'autres sites (l'adresse visitée, sans ses paramètres). Les adresses des pages perdent leurs paramètres, sauf ceux des campagnes (`utm_…`, utiles pour les liens de l'infolettre). Rien ne part d'un navigateur qui demande à ne pas être suivi (« Do Not Track » ou « Global Privacy Control »), ni, si le consentement est exigé, après un refus, même donné en cours de visite. Une nouvelle recherche sur la page de recherche ne compte pas une page vue de plus. Le script n'est chargé que sur le site en ligne : ni en développement, ni dans un aperçu.

**Ce qu'Umami fait des données**, selon sa documentation : aucun témoin; l'adresse IP sert à situer le visiteur (pays, région, ville) et à reconnaître une visite, sans être conservée; serveurs aux États-Unis et dans l'Union européenne. Umami ne dit rien de la Loi 25 : ces éléments sont à reporter dans la politique de confidentialité \[À VALIDER PAR L'AUTEUR].

**Budget** : une page vue compte pour un événement, une inscription pour deux, un clic sortant pour deux, une recherche pour trois. Ce qu'Umami fait au-delà de 100 000 événements par mois n'est pas documenté \[À VÉRIFIER]. « Les plus lus » (feuille de route, version 2) demandera le forfait Pro (20 $ US par mois selon Umami, à revérifier), seul à ouvrir l'accès programmatique aux statistiques.

**Consentement.** Le site n'affiche pas de bandeau tant qu'aucun service ne dépose de témoin : c'est le choix du brief \[À VALIDER PAR L'AUTEUR : la localisation des visiteurs par leur adresse IP (pays, région, ville) appelle-t-elle un avis ou un consentement au sens de la Loi 25?]. Si cela changeait un jour, **Réglages › Services › Consentement aux témoins** fait demander l'accord du lecteur avant tout chargement du script, avec un bouton en pied de page pour changer d'avis. Les textes du bandeau sont dans **Réglages › Textes de l'interface**, section `consentBanner`; tant que le consentement n'est pas exigé, ils ne s'affichent pas, et leurs marqueurs ne bloquent pas la mise en ligne.

## 37. La veille officielle

La page `/veille/` et la section d'accueil « veille » listent les publications récentes des autorités : titre, organisme, date et lien vers la source officielle, jamais le texte lui-même.

- **Les sources** : **Réglages › Sources de la veille**. Pour chaque source : adresse du fil (RSS ou Atom), organisme, juridiction, langue, mots-clés facultatifs (seules les publications dont le titre ou le résumé en contient un sont gardées; « actif numérique » trouve aussi « actifs numériques », sans égard aux accents ni aux majuscules), « Alerte après (jours sans publication) », et « Activé ».
- **Les sources actives**, lues avec succès le 28 septembre 2026 : ministère des Finances, Agence du revenu du Canada, Banque du Canada et LEGISinfo (projets de loi fédéraux). Leurs mots-clés sont des propositions, à ajuster \[À VALIDER PAR L'AUTEUR] : sans eux, le ministère des Finances, par exemple, publierait chaque annonce ministérielle. Désactivées, avec la raison en note : CANAFE (rien publié dans le fil depuis 2023), Revenu Québec (refus du robot) et la Gazette du Canada. Pour la Gazette, chaque élément est un numéro entier, avec un résumé générique : aucun mot-clé ne peut isoler un règlement. Activée sans mots-clés, elle annoncerait chaque numéro (Partie I chaque semaine, Partie II toutes les deux semaines) : à vous de choisir.
- **La collecte** : la tâche GitHub « veille » passe à 8 h 07 et à 14 h 07 (heure de Montréal) les jours ouvrables, sur la branche de production. Elle n'enregistre `data/veille/cache.json` que s'il y a du nouveau, ce qui reconstruit le site. Une publication déjà relevée que son fil redate (LEGISinfo : nouvelle étape d'un projet de loi) remonte en tête, avec son nouveau titre. Les publications restent douze mois (**Réglages › Sources de la veille › Durée de conservation (mois)**). Sur votre ordinateur : `npm run veille:fetch`.
- **Essayer une source** avant de l'activer : `npm run veille:fetch -- --diagnostic` essaie toutes les sources qui ont une adresse, même désactivées, et affiche le résultat sans rien enregistrer : état du fil, nombre d'entrées, date de la plus récente, et, pour une source filtrée, les entrées que ses mots-clés retiennent (de quoi les ajuster). Sur GitHub : onglet « Actions », « veille », « Run workflow », case « Essayer toutes les sources (même désactivées)… ». Lancée ainsi sur une autre branche que `main`, la tâche ne surveille pas le site en ligne. Au premier essai, le 28 septembre 2026, les mots-clés ne retenaient aucune publication des douze derniers mois : la veille restera vide tant qu'aucune publication récente ne touche les sujets du site.
- **La santé des sources** : le rapport « À vérifier » (section « Veille officielle ») signale une source en erreur, illisible (page de pare-feu ou adresse périmée), interdite au robot par le site, ou silencieuse : son fil n'a rien publié, tous sujets confondus, depuis plus longtemps que son seuil d'alerte. Les mots-clés n'y entrent pas : une source filtrée peut rester des mois sans publication retenue sans être en défaut. Un fil mort ne passe ainsi jamais pour une semaine calme. La date indiquée est celle du début de la panne, avec la cause relevée ce jour-là. En cas de panne, les publications déjà relevées restent affichées. Pour information, le rapport signale aussi un fil dont aucune date n'est lisible : ses publications y sont datées du jour de leur première collecte.
- **Tâche arrêtée** : le rapport hebdomadaire signale une tâche « veille » qui n'est pas passée depuis plus de 4 jours (désactivée dans l'onglet « Actions », ou suspendue par GitHub). Réactivez-la : la surveillance du site en ligne tourne avec elle.
- **Bonne conduite** : le robot s'identifie (son nom, l'adresse du site une fois en ligne et votre courriel de contact de **Réglages › Identité du site**, que le rapport demande), respecte le fichier `robots.txt` de chaque site et ne passe que deux fois par jour.
- **Branche protégée** : si vous protégez un jour la branche `main` dans les réglages de GitHub, autorisez la tâche « veille » à y écrire, sinon la collecte échouera à l'enregistrement.
- **Sans fil** : plusieurs autorités (ACVM, OCRI, BSIF, Gazette officielle du Québec…) ne publient aucun fil. Abonnez-vous à leurs avis par courriel.

## 38. Reconstruction nocturne, surveillance et alertes

- **Reconstruction nocturne** : la tâche planifiée de Cloudflare reconstruit le site chaque nuit à 5 h 07 UTC (1 h 07 à Montréal en été, 0 h 07 en hiver), pour les sections qui dépendent du jour (« À surveiller », statuts de l'agenda) et les cours de marché. Si la demande échoue ou si le passage manque, elle est relancée aux passages suivants pendant deux heures. La même tâche passe toutes les 15 minutes pour les publications programmées (section 5). Elle se règle dans `wrangler.jsonc` (`triggers`) : l'expression doit continuer de passer à 5 h 07 UTC, faute de quoi la reconstruction nocturne n'a plus lieu.
- **Surveillance du site en ligne** (deux fois par jour ouvrable, dans la tâche « veille ») : si le site en ligne n'a pas été reconstruit depuis plus de 30 heures (reconstruction nocturne manquée), ou si votre dernier envoi n'est toujours pas en ligne une heure plus tard (le site en ligne indique le commit qu'il contient : un commit fait avant la reconstruction nocturne et envoyé après est aussi repéré), la tâche échoue et **GitHub vous écrit**. Cherchez alors la cause dans Cloudflare, Workers Builds, journal de la dernière construction (section 17). Cloudflare n'envoie en effet aucun courriel quand une construction échoue. Sur votre ordinateur : `npm run surveillance`.
- **Rapport hebdomadaire** (chaque lundi, 8 h 13) : un ticket GitHub « Rapport « À vérifier » du… », avec l'étiquette « rapport », reprend le rapport complet, liens externes compris; celui de la semaine précédente est fermé. Lancé à la main sur une autre branche, il porte le nom de la branche et ne ferme rien. Le ticket vous est assigné : GitHub vous en avise, sur le site et, selon vos réglages de notification, par courriel.
- **Tâches en échec** : GitHub envoie un courriel pour chaque tâche planifiée qui échoue.
- **Sonde de disponibilité** (le site répond-il?) : un service gratuit vérifie toutes les 5 minutes l'accueil et la route `/api/sante` du Worker, et vous écrit s'ils ne répondent plus (section 41, étape 11).

## 39. Les cours des cryptoactifs

Le bandeau des cours (au-dessus de l'en-tête) et les sections d'accueil « Les cryptoactifs en bref » (`market-brief`) et « Cryptoactifs à suivre » (`trending-assets`) sont désactivés au lancement.

1. Créez un compte gratuit chez CoinGecko et une clé d'API « Demo ».
2. Déclarez-la comme variable de construction `COINGECKO_API_KEY` (section 31).
3. Dans **Réglages › Bandeau des cours** : « Activé », puis les actifs (identifiant CoinGecko, par exemple `bitcoin`, symbole et nom). Les sections d'accueil s'activent dans **Réglages › Page d'accueil**.

Les cours sont ceux de la dernière construction (l'heure est affichée), rafraîchis à chaque construction et chaque nuit, en dollars canadiens (sans décimales dès 100 $, deux décimales dès 1 $, quatre chiffres significatifs en dessous) : un seul appel à CoinGecko par construction, loin du plafond gratuit (10 000 par mois selon CoinGecko). Sans clé, ou si CoinGecko ne répond pas, le bandeau et les sections disparaissent simplement; une clé refusée est nommée dans le journal de la construction.

**Conditions de CoinGecko** (lues dans des extraits de ses pages, inaccessibles ici \[À VÉRIFIER]) :
- **Attribution** : la mention « Données fournies par CoinGecko » accompagne les cours et mène à la page de l'API de CoinGecko (**Réglages › Bandeau des cours › Lien de la source**). CoinGecko demanderait la formule anglaise « Powered by CoinGecko » : demandez-lui si la traduction lui convient.
- **Usage commercial** : le forfait gratuit porterait la mention « attribution requise », les forfaits payants la mention « usage commercial ». Si le site est un jour monétisé (publicité, commandites, services), prévoyez le forfait payant (environ 35 $ US par mois) ou retirez le module; au besoin, demandez à CoinGecko par écrit si un média d'information non monétisé peut utiliser le forfait gratuit.

## 40. Les pages légales et de confiance

Les pages À propos, Méthodologie, Politique éditoriale, Politique de correction, Transparence, Déclaration d'intérêts, Mentions légales, Confidentialité, Avertissement, Contact et Questions fréquentes existent en **brouillon** (**Contenus › Pages**), avec des marqueurs à la place de ce qui vous revient. Complétez-les, faites valider les textes juridiques, puis publiez chacune (statut « Publié ») : le pied de page y mène déjà.

- **Confidentialité** : deux blocs se tiennent à jour seuls. « Responsable de la protection des renseignements » affiche le nom, le titre et le courriel saisis dans **Réglages › Mentions juridiques**; « Renseignements recueillis » affiche le tableau des traitements de ces mêmes réglages (« Renseignements recueillis » : traitement, renseignements, où, lieu d'hébergement, conservation). Mettez ce tableau à jour à chaque nouveau service.
- **Témoins** : le site n'en dépose aucun et n'affiche donc pas de bandeau, par choix de conception (section 36) \[À VALIDER PAR L'AUTEUR]. Turnstile fonctionne dans son propre cadre, hébergé par Cloudflare, dont les témoins et le stockage ne sont pas documentés \[À VÉRIFIER]. Lisez l'addendum de confidentialité de Turnstile (https://www.cloudflare.com/turnstile-privacy-policy/) avant de rédiger la politique : Cloudflare y décrit les signaux qu'il traite (adresse IP, navigateur), possiblement aux États-Unis.
- **Contact** : bloc « Formulaire de contact » (section 34).
- Les textes proposés sont des gabarits : ils portent `[À VALIDER PAR L'AUTEUR]` et bloquent la mise en ligne tant qu'ils ne sont pas validés (section 15).

## 41. Mettre le site en ligne

À faire une fois, dans l'ordre. Comptez une demi-journée, plus l'attente du domaine (jusqu'à 24 heures). Tout est gratuit, sauf le domaine. Les libellés de GitHub et de Cloudflare peuvent varier légèrement; Claude Code peut vous accompagner à chaque étape.

**Avant de commencer.**

- Le nom du site, son domaine (acheté chez le registraire de votre choix), le courriel de contact et le responsable de la protection des renseignements sont choisis.
- Les contenus à publier sont prêts, sans marqueur (section 15), et le contenu de démonstration est retiré (section 18).
- Pour la mesure d'audience dès l'ouverture, le compte Umami est ouvert (section 36).

Dès que la vraie adresse du site est saisie (étape 5), un marqueur de la configuration ou un réglage qui fait refuser les envois arrête la construction : c'est voulu, le site ne part pas incomplet.

**1. Le dépôt GitHub.**

1. **Visibilité** : le dépôt doit être **privé** (question 14 de `docs/QUESTIONS.md`) : « Settings », « General », tout en bas (« Danger Zone »), « Change visibility ». Un dépôt public laisse n'importe qui lire vos brouillons, vos notes, le rapport hebdomadaire et tout l'historique.
2. **Branche de production** : le travail vit pour l'instant sur la branche `claude/zealous-lamport-nbfijd`, branche par défaut du dépôt. Créez la branche `main` à partir d'elle (page du dépôt, menu des branches, « View all branches », « New branch »), puis faites-en la branche par défaut (« Settings », « General », « Default branch »). Les tâches planifiées (veille, rapport hebdomadaire) ne tournent que sur la branche par défaut, et n'agissent que si c'est `main`.
3. Dans GitHub Desktop, « Current branch » : `main`. Vos enregistrements y vont désormais (section 3). Claude Code travaille sur ses propres branches et vous propose ses changements par une demande de fusion (« pull request ») : il ne pousse jamais sur `main` sans votre accord.

**2. Le domaine chez Cloudflare.**

1. Créez le compte Cloudflare (forfait gratuit) et activez la double authentification.
2. Ajoutez le domaine (« Onboard a domain »), forfait « Free ». Cloudflare relève les enregistrements DNS existants, sans garantie de les trouver tous : comparez sa liste à celle du registraire, et ajoutez à la main ceux du courriel qui manquent (types MX et TXT, noms qui contiennent `_domainkey` ou `_dmarc`). Supprimez en revanche ceux du domaine lui-même et de `www` (types A, AAAA ou CNAME, souvent une page d'attente du registraire), qui empêcheraient d'y rattacher le site.
3. Chez le registraire, désactivez DNSSEC s'il est actif, puis remplacez les serveurs de noms par les deux que donne Cloudflare, copiés exactement. Le domaine reste chez le registraire : activez son renouvellement automatique.
4. Attendez le courriel de Cloudflare qui annonce le domaine actif (jusqu'à 24 heures, selon Cloudflare). DNSSEC peut ensuite être réactivé depuis Cloudflare.
5. « SSL/TLS », « Edge Certificates » : activez « Always Use HTTPS » (une visite en `http` est renvoyée en `https`).

**3. Brevo, Turnstile et le formulaire de contact**, maintenant que le domaine est chez Cloudflare :

1. Brevo : section 32, étapes 1 à 5 et 7. Les enregistrements DNS du domaine d'envoi se créent dans la zone Cloudflare de l'étape 2. La clé d'API (section 32, étape 6) attendra l'étape 8 : le Worker qui la reçoit n'existe pas encore.
2. Turnstile : section 35, étape 1, avec la clé de site saisie dans les réglages. La clé secrète attendra aussi l'étape 8.
3. Formulaire de contact, si vous le voulez à l'ouverture : section 34.

**4. Le domaine dans `wrangler.jsonc`.** Ajoutez ces deux lignes juste au-dessus de la ligne `"preview_urls": true,`, avec votre domaine (sans `https://` ni barre oblique finale) :

```jsonc
  "routes": [{ "pattern": "votre-domaine.ca", "custom_domain": true }],
  "workers_dev": false,
```

La première rattache le domaine au site : Cloudflare crée lui-même l'enregistrement DNS et le certificat. La seconde ferme l'adresse provisoire en `workers.dev`, qui doublerait le site. Les adresses des aperçus de branche, et celle de chaque version déployée, restent actives, écartées des moteurs de recherche (voir « Aperçus de branche », plus bas). Ce fichier fait foi : un domaine ajouté seulement dans le tableau de bord serait retiré au déploiement suivant. Le rapport « À vérifier » signale un domaine qui ne correspond pas à l'adresse du site.

**5. L'adresse du site.** **Réglages › Identité du site › Adresse du site** : `https://votre-domaine.ca` (section 7); le cas échéant, le même domaine dans **Réglages › Services › Mesure d'audience › Domaines mesurés** (section 36). Sauvegardez, puis lancez `npm run check` et corrigez chaque erreur bloquante. Dans GitHub Desktop, « Commit to main » (le commit emporte aussi `wrangler.jsonc`, modifié à l'étape 4), puis « Push origin » : rien n'est encore mis en ligne, Cloudflare n'étant pas branché.

**6. Brancher Workers Builds.**

1. Dans Cloudflare, « Workers & Pages », « Create application », puis « Import a repository ». Connectez votre compte GitHub; quand GitHub le demande, limitez l'application « Cloudflare Workers & Pages » au seul dépôt du site (« Only select repositories »).
2. Choisissez le dépôt, puis réglez :
   - nom du Worker : `media-cryptoactifs`, exactement le `name` de `wrangler.jsonc`, faute de quoi la construction échoue;
   - branche de production : `main`. Si une autre branche est proposée, reprenez l'étape 1.2 : construit depuis une autre branche, le site partirait en version d'aperçu (brouillons visibles, pages exclues des moteurs de recherche, formulaires refusés);
   - commande de construction (« Build command ») : `npm run build`;
   - commande de déploiement (« Deploy command ») : `npx wrangler deploy`, la valeur proposée;
   - variable de construction `COINGECKO_API_KEY`, seulement si les cours sont activés (section 39).
3. « Save and Deploy ». La construction dure quelques minutes. Son journal (page du Worker, « Deployments », « View build history ») donne, en cas d'échec, le message en français de `check` (section 17). Si le message, en anglais, cite `ratelimits` ou `FORM_LIMITER`, Cloudflare refuse la limitation de débit en forfait gratuit : faites retirer les deux blocs `ratelimits` de `wrangler.jsonc` par Claude Code, puis relancez la construction (« Retry build »); la protection des formulaires tient sans eux (section 31). Réussie, la construction publie le site sur votre domaine.

**7. Les réglages de construction** (page du Worker, « Settings », « Build ») :

- « Branch control » : branche de production `main`; cochez « Enable Preview Builds » (aperçus de branche, plus bas). La commande des aperçus reste `npx wrangler preview`.
- « Build watch paths » : inclure `*`; exclure `docs/*` et `.github/*`, rien d'autre. La surveillance (section 38) attend en ligne, dans l'heure, tout autre changement.
- « Build cache » : « Enable » (dépendances et images optimisées gardées d'une construction à l'autre).
- « Deploy Hooks » : créez un Deploy Hook nommé « Tâche planifiée », branche `main`, et copiez son adresse dans le secret `DEPLOY_HOOK_URL` (étape 8). Cette adresse suffit à déclencher une construction : ne la collez nulle part ailleurs.

**8. Les secrets** (page du Worker, « Settings », « Variables and Secrets », partie « Production ») : « Add », type « Secret », nom et valeur; « Add variable » pour le suivant; enfin « Deploy ». Il en faut quatre, plus un facultatif (section 31) :

- `NEWSLETTER_API_KEY` : créez maintenant la clé d'API de Brevo (section 32, étape 6) et collez-la directement ici;
- `TURNSTILE_SECRET_KEY` : la clé secrète du widget Turnstile (section 35);
- `IP_HASH_SALT` : une suite d'au moins 32 caractères tirée au hasard par un gestionnaire de mots de passe;
- `DEPLOY_HOOK_URL` : l'adresse du Deploy Hook de l'étape 7;
- au besoin, `CONTACT_TO`.

Les aperçus de branche n'en demandent aucun.

**9. L'adresse avec `www`** (conseillé), pour que `www.votre-domaine.ca` mène au site :

1. « DNS », « Records », « Add record » : type `A`, nom `www`, adresse `192.0.2.1`, proxy activé (« Proxied »). Cette adresse fictive, celle de l'exemple de Cloudflare, ne reçoit jamais rien : Cloudflare répond avant.
2. « Rules », « Redirect Rules » : une règle de type « Wildcard pattern », avec l'adresse demandée (« Request URL ») `https://www.*`, l'adresse cible (« Target URL ») `https://${1}`, le code (« Status code ») `301` et « Preserve query string » coché; puis « Deploy ».

**10. Les vérifications du premier déploiement.** Notez chaque résultat dans ARCHITECTURE, section 25.7.

- Le site répond sur `https://votre-domaine.ca`, sans bandeau jaune d'aperçu, et `https://votre-domaine.ca/robots.txt` contient `Allow: /`. Sinon, le site est parti en version d'aperçu : reprenez l'étape 6.2.
- `https://votre-domaine.ca/api/sante` affiche `{"ok":true}`. Sinon (`{"ok":false,"error":"indisponible"}`), un secret manque, la clé secrète de Turnstile est une clé d'essai, ou un réglage des services est incomplet.
- `https://votre-domaine.ca/schedule.json` contient un champ `commit` : Workers Builds fournit bien le commit construit, que la surveillance compare à `main` (section 38).
- Limitation de débit : notez si Cloudflare l'a acceptée (étape 6.3).
- Infolettre : protocole d'essai de Brevo (section 32, étape 8). Formulaire de contact, s'il est activé : un message d'essai.
- Tâche planifiée : dans les réglages du Worker, l'expression `7,22,37,52 * * * *` figure parmi les déclencheurs (« Trigger Events »). Le lendemain matin, `schedule.json` montre une construction de la nuit (vers 5 h 07 UTC).
- Veille : au premier passage qui trouve du nouveau, le commit « chore(veille): … » doit lancer une construction (« Deployments »). Sinon, faites appeler le Deploy Hook par la tâche « veille » (Claude Code).
- Publication programmée : pour votre premier contenu programmé, notez l'heure prévue et l'heure de mise en ligne effective : l'écart attendu est d'une vingtaine de minutes au plus (section 5).
- Performance : https://pagespeed.web.dev/ sur l'accueil et sur un article, mobile et ordinateur (section 42).

**11. La sonde de disponibilité.** La surveillance de la section 38 vérifie que le site est à jour; la sonde vérifie qu'il répond, toutes les 5 minutes, et vous écrit sinon. Service proposé : UptimeRobot, forfait gratuit (50 sondes toutes les 5 minutes, alertes par courriel, sans carte de paiement; usage commercial permis depuis 2026 selon ses conditions \[À VÉRIFIER à l'inscription : conditions du jour et « Fair Use Policy »]).

1. Créez le compte et activez la double authentification. Si une carte de paiement est demandée, arrêtez-vous : le choix vous revient.
2. Deux sondes de type « HTTP(s) », toutes les 5 minutes, avec votre courriel comme contact d'alerte :
   - « Site » : `https://votre-domaine.ca/`;
   - « Formulaires » : `https://votre-domaine.ca/api/sante`. Elle répond 200 quand les réglages des formulaires sont en place, 503 sinon : secret absent, clé secrète de Turnstile d'essai, réglage des services incomplet. Elle en vérifie la présence, pas la validité : une clé révoquée ne se voit qu'à un vrai envoi. Elle ne touche ni Brevo ni Turnstile.
3. Essai : ajoutez une troisième sonde vers `https://votre-domaine.ca/api/essai`, qui répond 404 : le courriel d'alerte doit arriver (voyez aussi les indésirables). Supprimez-la ensuite.
4. Connectez-vous au moins une fois tous les six mois : UptimeRobot désactive les comptes gratuits inactifs \[À VÉRIFIER].

N'activez pas le réglage « Bot Fight Mode » de Cloudflare : il soumettrait la sonde et la surveillance à des défis, d'où de fausses alertes. Le certificat du domaine est renouvelé par Cloudflare sans intervention. Plus complet mais plus technique : Grafana Cloud, forfait gratuit, avec une alerte d'expiration du certificat et des sondes canadiennes, présentes dans son code mais peut-être pas dans l'offre gratuite \[À VÉRIFIER]; voir ARCHITECTURE, section 15.6.

**Aperçus de branche.** Chaque envoi sur une autre branche que `main` construit un aperçu : le site avec les brouillons et les contenus programmés, bandeau jaune compris, sans mesure d'audience ni tâche planifiée. Ses formulaires restent en mémoire (aucune inscription réelle, aucun message envoyé) et sa vérification anti-robot utilise la clé d'essai de Cloudflare, sans secret à fournir. L'adresse de l'aperçu, `<branche>-media-cryptoactifs.<votre-sous-domaine>.workers.dev`, figure dans la section « Previews » du Worker, et en commentaire de la demande de fusion s'il y en a une. Elle est écartée des moteurs de recherche, mais **publique** : quiconque la connaît voit vos brouillons. De même, chaque version déployée du site en ligne reste lisible à sa propre adresse en `workers.dev`, pour qui la connaît.

Pour exiger une connexion : Cloudflare Access (page du Worker, onglet « Access », « Protect this Worker behind Access », « Previews only », puis, sous « Authentication policy », « Cloudflare account » : seuls les membres de votre compte Cloudflare entrent). Ne choisissez jamais « Email domain » avec le domaine d'une messagerie publique (gmail.com, outlook.com…) : tout titulaire d'une adresse de ce domaine entrerait. Access suppose d'activer Cloudflare Zero Trust, dont le forfait gratuit demande quand même une carte de paiement, sans prélèvement selon Cloudflare : à vous de choisir (`docs/QUESTIONS.md`). Le forfait gratuit garde 100 aperçus par Worker : au-delà, les plus anciens sont supprimés d'office.

**Retour en arrière.** Si une mise en ligne casse le site : page du Worker, « Deployments », menu « ⋯ » de la version précédente, « Rollback ». Le retour est immédiat, sans construction. Annulez ensuite le commit fautif (section 29) : la construction suivante, au plus tard celle de la nuit, remettrait sinon la version cassée.

**Plus tard (facultatif).**

- **Moteurs de recherche** : Google Search Console et Bing Webmaster Tools (gratuits). Vérifiez le domaine par un enregistrement DNS chez Cloudflare, puis soumettez `https://votre-domaine.ca/sitemap-index.xml`.
- **Protéger `main`** : « Settings », « Rules », « Rulesets », une règle sur `main` avec « Restrict deletions » et « Block force pushes ». N'exigez pas de demande de fusion : vos enregistrements et la tâche « veille » écrivent directement sur `main` (section 37). Sur un dépôt privé, GitHub n'applique ces règles qu'avec une offre payante (GitHub Pro, par exemple) : à décider.

## 42. Les vérifications automatiques

- **À chaque envoi sur GitHub** (sauf celui du cache de la veille), la tâche « ci » vérifie en trois minutes environ :
  - les types (`npm run typecheck`), les tests (`npm test`) et le format de l'éditeur;
  - la construction de production et la taille du Worker (100 Kio au plus);
  - des parcours de fumée dans Chromium, sur ordinateur et sur mobile : une trentaine de pages (accueil, rubriques, pages fixes, et une entrée de chaque collection, choisie dans votre contenu) et la page introuvable, en clair et en sombre, sans erreur, sans défilement horizontal et sans défaut d'accessibilité (WCAG 2.2 AA, vérifiée par axe), plus l'inscription à l'infolettre en mode d'essai, la recherche, les menus et le thème. Supprimer ou renommer un contenu ne les fait pas échouer.
- **Le résultat** : coche verte ou croix rouge à côté du commit, sur GitHub. En cas d'échec, GitHub vous écrit (selon vos réglages de notification); le rapport des parcours (captures, traces) reste joint à l'exécution, onglet « Actions », pendant sept jours.
- **Elle n'arrête pas la mise en ligne** : Cloudflare construit chaque envoi sur `main` avec ses propres garde-fous (`check`, contrôles du dossier `dist/`). Elle vise surtout les changements de code : Claude Code la fait passer avant de vous proposer une demande de fusion.
- **Sur votre ordinateur** : `npm run test:e2e` lance les mêmes parcours, après une installation unique de Chromium (`npx playwright install chromium`).
- **Performance** : l'audit Lighthouse de la phase 5 donne 98 à 100 en performance, 100 en accessibilité et en bonnes pratiques (ARCHITECTURE, section 27). Pour mesurer le site en ligne : https://pagespeed.web.dev/.
- **Coût** : gratuit pour un dépôt public; pour un dépôt privé, environ 3 minutes par envoi, sur les 2 000 minutes gratuites par mois dont la veille et le rapport hebdomadaire prennent une centaine : de quoi couvrir plus de 500 envois par mois.
