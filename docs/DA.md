# Direction artistique : déclinaison de bleu roi

> Phase 0, livrable 2 sur 3. Rédigé le 25 septembre 2026.
> Sources : brief v2 (points 2, 3, 7 et 8), analyse des quatre captures d'inspiration et du PDF d'exemple d'article (section 13), sources indirectes sur cryptoast.fr (section 13.6), calcul des contrastes WCAG 2.2 (section 4).
> Statut : proposition à valider. Rien n'est encore codé. Les valeurs ci-dessous deviendront `config/theme.json` en phase 1. Les choix qui s'écartent du brief ou qui s'y ajoutent sont regroupés en section 15 et dans la question A4 de `docs/QUESTIONS.md`.

---

## Sommaire

1. Concept et vocabulaire
2. Principes de mise en forme
3. Jetons de couleur définitifs
4. Vérification des contrastes et ajustements
5. Typographie
6. Espacements, grille, rayons, ombres, mouvements
7. Iconographie, images et logo
8. Inventaire des composants
9. Blocs riches de l'éditeur (MDX) et blocs de page
10. Accessibilité : règles visuelles
11. Structure de `config/theme.json`
12. Maquettes filaires (ordinateur et mobile)
13. Références visuelles : analyse image par image
14. Divergences entre les références et le brief
15. Points de DA ouverts

---

## 1. Concept et vocabulaire

La précision juridique rencontre la crypto. Le site doit se lire comme une revue juridique moderne tenue par un média financier : du blanc, une grille visible dans la structure mais jamais décorative à l'excès, des filets, une typographie nette, des chiffres alignés, des documents cités avec soin.

Trois motifs graphiques, et seulement trois, portent l'identité :

- **Le filet vertical** de 4 px, à gauche d'un titre de carte ou d'un encadré. Il signale la catégorie ou le type d'encadré. Les captures de référence en font un marqueur fort (section 13.1). Nous le réservons à la couleur de catégorie, jamais en arc-en-ciel.
- **La grille** fine (lignes de 1 px en brand-100 ou brand-800 selon le fond), utilisée dans les couvertures générées, les en-têtes de dossiers et les gabarits sociaux. Elle évoque le document, le registre et le tableau.
- **La puce** : catégorie, juridiction, statut réglementaire, échéance. Toujours un libellé texte, jamais une couleur seule.

Ce que l'identité refuse : néons, dégradés agressifs, orange bitcoin, pièces de monnaie en 3D, fusées, graphiques de chandeliers décoratifs, esthétique de jeu. Le seul dégradé autorisé est le dégradé bleu roi sobre (brand-700 vers brand-900) des couvertures générées.

**Vocabulaire employé dans ce document** :

| Terme | Sens | Composants |
|---|---|---|
| **Puce** | Étiquette de classement, au rayon de 6 px | `Badge`, `CategoryBadge`, `JurisdictionBadge`, `StatusBadge`, `Tag` |
| **Pastille de lien** | Bouton arrondi qui mène à une liste (« Tout voir → ») | `Button` en variante `link` |
| **Point** | Marqueur rond décoratif (Québec, frises) | intégré aux composants |
| **Filet** | Trait vertical de 4 px à gauche d'un titre ou d'un encadré | intégré aux composants |
| **Encadré** | Bloc éditorial à filet et fond teinté | `Callout` |

## 2. Principes de mise en forme

1. **Mode clair d'abord.** Le mode sombre est livré en v1, mais toute décision se prend en mode clair puis se vérifie en sombre.
2. **Densité maîtrisée.** Densité d'information élevée comme les références (grilles de 3 à 4 colonnes, listes compactes), avec des respirations nettes entre les sections (64 à 80 px sur ordinateur).
3. **Hiérarchie par la taille et la graisse, pas par la couleur.** Les titres de section sont en ink ou en brand-700, jamais en dégradé.
4. **Un seul composant par besoin.** `ArticleCard` a six variantes, pas six composants par sujet.
5. **Les données se lisent** : chiffres tabulaires, montants en `$ CA` après le nombre, dates en toutes lettres, heures au format « 17 h 17 » ou « 15 h ».
6. **La confiance se voit** : « Vérifié le », sources officielles distinguées, notes de correction datées. Ce sont des éléments de design, pas des notes de bas de page cachées.
7. **Une page se lit de haut en bas.** Sections empilées sur toute la largeur, dans l'ordre de `homepage.json` : ni carrousel, ni onglets, ni juxtaposition de sections.

---

## 3. Jetons de couleur définitifs

Toutes les valeurs du brief sont conservées, sauf slate-500, ajusté (◆). Dix-sept valeurs sont ajoutées (★) :
- huit pour le mode clair : gold-700, slate-400, success-strong, success-50, danger-strong, danger-50, warning-strong, warning-50;
- neuf pour le mode sombre : l'or sombre, la bordure forte, le fond d'encadré info, trois couleurs sémantiques et leurs trois fonds.

Une association du brief change aussi : la puce « Analyses » (◆). Tout est justifié en section 4.

### 3.1 Échelle de marque (bleu roi), inchangée

| Jeton | Hex | Usage |
|---|---|---|
| brand-50 | `#EEF2FF` | fonds très clairs, survols de lignes, fond d'encadré « info » |
| brand-100 | `#DDE4FF` | fonds de puces, encadrés « info forte », bouton secondaire |
| brand-200 | `#BBC9FF` | bordures actives; métadonnées sur brand-800 à brand-950; texte de puce en sombre; primaire pressé en sombre |
| brand-300 | `#8FA6FF` | fond de la puce « Analyses » (style `clair-300`); survol du primaire en sombre |
| brand-400 | `#5F7CF6` | primaire en mode sombre (fonds, icônes, filets); jamais de texte sur blanc (3,68:1) |
| brand-500 | `#3B5BEA` | survol du primaire; style de puce `plein-500` (Actualités) |
| brand-600 | `#2743D3` | **primaire** : boutons, liens, logo, navigation active, focus; style de puce `plein` (Canada) |
| brand-700 | `#1E35AD` | primaire pressé; titres colorés; titres d'encadrés « info »; style `plein-700` (Réglementation) |
| brand-800 | `#182B88` | fonds de bandeaux (newsletter, annonce); titres d'encadrés « info forte »; style `doux-800` (Guides) |
| brand-900 | `#132264` | pied de page; sections de marque; styles `plein-900` (Dossiers) et `doux-900` (Fiscalité) |
| brand-950 | `#0B1440` | texte de la puce « Analyses ». Le brief l'appelle aussi « fond du mode sombre », puis fixe ce fond à `#0A0E27` : c'est `#0A0E27` qui est retenu (ARCHITECTURE, écart B23) |

### 3.2 Accent chaud (or), facultatif et limité

L'or reste limité aux deux usages du brief : le total des exemples chiffrés (`ExempleChiffre`) et les puces d'échéance fiscale de l'agenda.

| Jeton | Hex | Usage |
|---|---|---|
| gold-100 | `#FFF4CC` | fond du total d'`ExempleChiffre` et des puces d'échéance |
| gold-500 | `#E0A800` | point de la puce d'échéance, filet décoratif; jamais de texte (2,15:1) |
| gold-600 | `#B98700` | bordure décorative de la puce d'échéance; jamais de texte (3,22:1) |
| gold-700 ★ | `#8A6500` | seul or employé en texte : libellé des puces d'échéance (5,33:1 sur blanc, 4,84:1 sur gold-100) |
| gold-dark ★ | `#E6B93A` | or du mode sombre : libellé des puces d'échéance sur `#2A1D06` (8,90:1) |

Si `accentGold` vaut `false` dans `theme.json`, la génération remplace gold-100 par brand-100, gold-500 par brand-600, gold-600 par brand-700 et gold-700 par brand-800 (9,55:1 sur brand-100). En sombre, la puce d'échéance et le total passent alors sur le fond d'encadré info `#15204F`, avec un texte brand-200 (9,55:1) ou `#E7EAF6` (12,95:1). Le site reste strictement bleu et neutre, sans aucune modification de composant.

### 3.3 Neutres froids

| Jeton | Hex | Usage |
|---|---|---|
| ink | `#0E1230` | texte principal |
| slate-700 | `#3C4262` | texte secondaire; métadonnées sur brand-100 et brand-200; style de puce `ardoise` (Opinion) |
| slate-500 ◆ | `#62688A` (brief : `#6B7190`) | métadonnées, légendes, crédits, sur les fonds clairs jusqu'à brand-50 |
| slate-400 ★ | `#878DAA` | bordures de champs de formulaire et de contrôles |
| slate-300 | `#C3C7D9` | bordures de cartes (décoratives) |
| slate-200 | `#E1E4EF` | séparateurs |
| slate-100 | `#F1F3F9` | fonds de sections |
| canvas | `#F7F8FC` | fond de page |
| surface | `#FFFFFF` | cartes |

### 3.4 Sémantiques

| Jeton | Hex | Usage |
|---|---|---|
| success | `#1B9E5B` | icônes, filets, pastilles pleines de grande taille |
| success-strong ★ | `#157A48` | texte de succès; puce « En vigueur » (texte blanc); hausse du ticker |
| success-50 ★ | `#E3F4EA` | fond d'encadré ou de puce de succès |
| danger | `#D6323C` | texte d'erreur sur blanc, icônes |
| danger-strong ★ | `#B4232C` | texte d'erreur sur fond teinté; baisse du ticker |
| danger-50 ★ | `#FBE7E8` | fond d'erreur de formulaire |
| warning | `#D97706` | icônes et filets « Attention » |
| warning-strong ★ | `#A15C07` | texte d'avertissement |
| warning-50 ★ | `#FDF1DC` | fond d'encadré « Attention » et « Mise en garde » |
| info | = brand-600 | information |

### 3.5 Mode sombre

| Rôle | Hex | Remarque |
|---|---|---|
| fond | `#0A0E27` | bleu nuit, jamais noir pur |
| surface 1 | `#111634` | cartes |
| surface 2 | `#181E44` | cartes en survol, cartes dans une section `muted`, menus, modale |
| bordure | `#262D5C` | bordures décoratives de cartes et séparateurs |
| bordure forte ★ | `#6770A6` | bordures de champs et de contrôles (3,40 à 4,02:1) |
| texte | `#E7EAF6` | |
| texte secondaire | `#A6ADCC` | métadonnées comprises |
| primaire | brand-400 `#5F7CF6` | fonds de boutons (texte `#0A0E27`), icônes, filets |
| liens | `#9DB0FF` | tout texte cliquable, anneau de focus |
| fond d'encadré info ★ | `#15204F` | titres en brand-200 ou `#9DB0FF` |
| succès, attention, danger ★ | `#3DBE7E`, `#F59E0B`, `#F2777E` | texte, icônes et filets |
| fonds de succès, d'attention, de danger ★ | `#0F2A1C`, `#2A1D06`, `#2E1216` | encadrés et puces |
| or sombre ★ | `#E6B93A` | voir section 3.2 |
| images | `filter: brightness(.9) contrast(1.05)` | atténuation légère |

### 3.6 Jetons sémantiques (alias)

Les composants n'utilisent **jamais** directement `brand-600` ou `#2743D3`. Ils utilisent des alias. Chaque alias a une valeur claire et une valeur sombre : c'est ce qui rend le mode sombre presque gratuit.

| Alias | Clair | Sombre |
|---|---|---|
| `--c-bg` | canvas | `#0A0E27` |
| `--c-surface` | surface | `#111634` |
| `--c-surface-raised` | surface + ombre | `#181E44` |
| `--c-section-muted` | slate-100 | `#111634` (les cartes y passent en `--c-surface-raised`) |
| `--c-section-brand` | brand-900 | brand-900 (brand-950 se confondrait avec le fond : 1,08:1) |
| `--c-text` | ink | `#E7EAF6` |
| `--c-text-secondary` | slate-700 | `#A6ADCC` |
| `--c-text-meta` | slate-500 | `#A6ADCC` |
| `--c-text-inverse` | blanc | blanc (texte sur brand-800 à brand-950) |
| `--c-text-meta-inverse` | brand-200 | brand-200 (métadonnées sur brand-800 à brand-950) |
| `--c-border` | slate-300 | `#262D5C` |
| `--c-border-subtle` | slate-200 | `#262D5C` |
| `--c-border-control` | slate-400 | `#6770A6` |
| `--c-primary` | brand-600 | brand-400 |
| `--c-primary-hover` | brand-500 | brand-300 |
| `--c-primary-pressed` | brand-700 | brand-200 |
| `--c-on-primary` | blanc | `#0A0E27` |
| `--c-link` | brand-600 | `#9DB0FF` |
| `--c-focus` | brand-600 | `#9DB0FF` |
| `--c-focus-inverse` | blanc | blanc (anneau sur brand-800 à brand-950) |
| `--c-heading-accent` | brand-700 | brand-200 |

### 3.7 Styles de puce : catégories, juridictions, statuts

Le brief impose des couleurs sobres, toutes dans l'échelle bleue.

Une puce demande cinq valeurs : fond et texte en clair, fond et texte en sombre, filet. Une seule couleur ne suffit pas à les déduire sans risque. `theme.json` définit donc une **liste fermée de styles de puce** (`badgeStyles`), dont chaque entrée porte ses paires claire et sombre déjà vérifiées. Chaque catégorie choisit l'un des sept styles de catégorie, et chaque juridiction l'un des trois styles de juridiction (champ `badgeStyle`, ARCHITECTURE, sections 7.4 et 7.13). Le script `check` refuse un style inconnu et recalcule les contrastes si l'auteur modifie un style. L'auteur peut donc créer une catégorie ou une juridiction sans code et sans risque de contraste insuffisant.

**Styles de catégorie** :

| Style | Clair (fond / texte) | Sombre (fond / texte) | Filet (clair) | Catégorie par défaut |
|---|---|---|---|---|
| `plein-500` | brand-500 / blanc (5,43:1) | brand-500 / blanc (5,43:1) | brand-500 | Actualités |
| `plein-700` | brand-700 / blanc (9,69:1) | brand-700 / brand-100 (7,66:1) | brand-700 | Réglementation |
| `doux-900` | brand-100 / brand-900 (11,53:1) | brand-900 / brand-200 (8,96:1) | brand-900 | Fiscalité |
| `clair-300` ◆ | brand-300 / brand-950 (7,63:1) | brand-300 / brand-950 (7,63:1) | brand-400 | Analyses (brief : brand-400, soit 3,68:1 avec un texte blanc) |
| `plein-900` | brand-900 / blanc (14,58:1) | brand-900 / brand-200 (8,96:1) | brand-900 | Dossiers |
| `doux-800` | brand-100 / brand-800 (9,55:1) | brand-800 / brand-100 (9,55:1) | brand-800 | Guides |
| `ardoise` | slate-100 / slate-700 (8,81:1) | `#262D5C` / `#A6ADCC` (5,87:1) | slate-700 | Opinion |

En sombre, tous les filets de catégorie passent en brand-400, et celui du style `ardoise` en `#A6ADCC`. Le filet est décoratif : c'est la puce qui porte l'information.

**Styles de juridiction** :

| Style | Clair | Sombre | Juridiction par défaut |
|---|---|---|---|
| `plein` | brand-600 plein, texte blanc (7,42:1) | identique (7,42:1) | Canada |
| `contour-point` | contour et texte brand-600 (7,42:1 sur blanc), point brand-900 de 6 px avant le libellé | contour et texte `#9DB0FF` (9,13:1 sur le fond, 8,49:1 sur la surface 1), point brand-200 | Québec |
| `contour` | contour et texte slate-500 (5,43:1 sur blanc, 4,90:1 sur slate-100) | contour et texte `#A6ADCC` (8,57:1 sur le fond, 7,97:1 sur la surface 1) | toutes les autres |

Le point du Québec est décoratif : le libellé « Québec » porte l'information.

**Statuts réglementaires** (`StatusBadge`, dossiers et textes). Chaque statut associe un libellé, une icône Lucide et un style, jamais la couleur seule. Les huit styles sont fixés dans `theme.json` (`statusStyles`) et vérifiés par le même script.

| Statut | Clair | Sombre | Icône |
|---|---|---|---|
| Projet | contour et texte slate-500 (5,43:1) | contour et texte `#A6ADCC` (7,97:1 sur la surface 1) | `file-pen` |
| Consultation | brand-100 / brand-800 (9,55:1) | brand-800 / brand-100 (9,55:1) | `messages-square` |
| Adopté | brand-600 / blanc (7,42:1) | identique | `stamp` |
| En vigueur | success-strong / blanc (5,37:1) | identique | `circle-check` |
| Partiellement en vigueur | success-50 / success-strong (4,71:1) | `#0F2A1C` / `#3DBE7E` (6,48:1) | `circle-dashed` |
| Modifié | brand-50 / brand-700 (8,66:1) | `#15204F` / brand-200 (9,55:1) | `pencil-line` |
| Abrogé | slate-200 / slate-700 (7,70:1) | `#262D5C` / `#A6ADCC` (5,87:1) | `archive` |
| Retiré | contour slate-400, texte slate-700 (9,78:1 sur blanc) | contour `#6770A6`, texte `#A6ADCC` (7,97:1) | `circle-slash` |

**Puce d'échéance de l'agenda** : gold-100 / gold-700 (4,84:1), bordure gold-600, point gold-500; en sombre, `#2A1D06` / `#E6B93A` (8,90:1). Remplacements sans or : section 3.2.

---

## 4. Vérification des contrastes et ajustements

**Méthode** : formule de luminance relative de WCAG 2.2, calculée par script le 25 septembre 2026, puis recalculée par une relecture indépendante.

**Seuils** :
- 4,5:1 pour le texte courant;
- 3:1 pour les grands titres (au moins 24 px, ou 18,66 px en gras) et pour les composants d'interface : bordures de champs, icônes porteuses de sens, anneau de focus.

En phase 1, le script `check` recalculera ces paires à partir de `theme.json` : si l'auteur change une teinte et casse un contraste, il le saura avant la mise en ligne.

### 4.1 Paires conformes (extrait)

| Paire | Ratio | Usage |
|---|---|---|
| ink / canvas | 17,24:1 | texte courant |
| ink / brand-100 | 14,48:1 | texte courant d'un encadré « info forte » (le plus bas des encadrés clairs) |
| slate-700 / surface | 9,78:1 | texte secondaire |
| slate-700 / brand-100 | 7,74:1 | métadonnées sur brand-100 |
| slate-700 / brand-200 | 6,01:1 | métadonnées sur brand-200 |
| slate-500 / surface | 5,43:1 | métadonnées |
| brand-600 / surface | 7,42:1 | liens |
| blanc / brand-600 | 7,42:1 | bouton primaire |
| blanc / brand-500 | 5,43:1 | bouton primaire en survol |
| brand-700 / brand-100 | 7,66:1 | bouton secondaire |
| brand-600 / brand-100 | 5,87:1 | lien dans un encadré « info forte » |
| blanc / brand-800 | 12,07:1 | texte et anneau de focus sur le bandeau newsletter et l'annonce |
| brand-200 / brand-800 | 7,42:1 | métadonnées et lien de consentement du bandeau newsletter |
| blanc / brand-900 | 14,58:1 | texte, liens et anneau de focus du pied de page et des sections de marque |
| brand-200 / brand-900 | 8,96:1 | texte secondaire du pied de page (copyright, hébergement des données) |
| brand-200 / brand-950 | 10,87:1 | métadonnées sur brand-950 |
| brand-700 / brand-50 | 8,66:1 | titre d'encadré « info » |
| brand-800 / brand-100 | 9,55:1 | titre d'encadré « info forte » |
| warning-strong / warning-50 | 4,64:1 | titre d'encadré « Attention » |
| success-strong / success-50 | 4,71:1 | titre d'encadré « Mise à jour » |
| gold-700 / gold-100 | 4,84:1 | libellé de la puce d'échéance |
| ink / gold-100 | 16,61:1 | total d'un exemple chiffré |
| success-strong / slate-100 | 4,84:1 | hausse des cours sur le bandeau (fond de section) |
| danger-strong / slate-100 | 5,88:1 | baisse des cours sur le bandeau |
| success-strong / surface | 5,37:1 | hausse des cours sur une carte |
| danger-strong / surface | 6,53:1 | baisse des cours sur une carte |
| danger / surface | 4,79:1 | message d'erreur |
| danger-strong / danger-50 | 5,50:1 | erreur sur fond teinté |
| slate-400 / surface | 3,27:1 | bordure de champ |
| Sombre : `#E7EAF6` / `#0A0E27` | 15,83:1 | texte |
| Sombre : `#E7EAF6` / `#0F2A1C` | 12,79:1 | texte courant d'encadré (le plus bas des encadrés sombres) |
| Sombre : `#A6ADCC` / `#181E44` | 7,24:1 | texte secondaire |
| Sombre : `#9DB0FF` / `#181E44` | 7,71:1 | liens |
| Sombre : `#9DB0FF` / brand-900 | 7,00:1 | liens dans une section de marque |
| Sombre : `#0A0E27` / brand-400 | 5,16:1 | bouton primaire |
| Sombre : `#0A0E27` / brand-300 | 8,20:1 | bouton primaire en survol |
| Sombre : `#3DBE7E` / `#181E44` | 6,78:1 | hausse des cours (la plus basse, sur surface 2; 7,46:1 sur surface 1) |
| Sombre : `#F2777E` / `#181E44` | 5,90:1 | baisse des cours (la plus basse, sur surface 2; 6,49:1 sur surface 1) |
| Sombre : `#F59E0B` / `#2A1D06` | 7,66:1 | titre d'encadré « Attention » |
| Sombre : `#F2777E` / `#2E1216` | 6,35:1 | erreur de formulaire |

Les paires des puces figurent dans les tableaux de la section 3.7.

### 4.2 Paires non conformes et correction retenue

| Paire du brief | Ratio | Problème | Correction |
|---|---|---|---|
| slate-500 `#6B7190` / slate-100 | 4,31:1 | métadonnées sur fond de section | slate-500 devient `#62688A` : 4,90:1 sur slate-100, 4,86:1 sur brand-50, 5,43:1 sur blanc. Règles par fond en section 4.3 |
| blanc / brand-400 | 3,68:1 | puce « Analyses » | style `clair-300` : brand-300 / brand-950 (7,63:1) |
| success / surface | 3,45:1 | texte de succès | success réservé aux icônes (au moins 3:1); texte en success-strong `#157A48` (5,37:1) |
| warning / surface | 3,19:1 | texte d'avertissement | warning réservé aux icônes et filets; texte en warning-strong `#A15C07` (5,19:1) |
| gold-500 / surface | 2,15:1 | or sur blanc | jamais en texte ni en bordure porteuse de sens; point et filet décoratifs seulement |
| gold-600 / surface | 3,22:1 | or foncé en texte | texte en gold-700 `#8A6500` (5,33:1) |
| slate-300 / surface | 1,68:1 | bordure de champ de formulaire (WCAG 1.4.11) | champs et contrôles en slate-400 `#878DAA` (3,27:1); slate-300 reste pour les cartes (décoratif) |
| danger / danger-50 | 4,04:1 | erreur sur fond teinté | danger-strong `#B4232C` (5,50:1) |
| brand-600 / brand-900 | 1,96:1 | anneau de focus sur le pied de page (1,63:1 sur brand-800) | anneau blanc sur brand-800 à brand-950 (`--c-focus-inverse`) |
| Sombre : brand-400 / `#181E44` | 4,36:1 | lien brand-400 sur la surface 2 | tout texte cliquable en `#9DB0FF`; brand-400 réservé aux fonds, icônes et filets |
| Sombre : blanc / brand-400 | 3,68:1 | bouton primaire | texte `#0A0E27` sur brand-400 (5,16:1) |
| Sombre : `#262D5C` / `#111634` | 1,36:1 | bordure de champ | bordure forte `#6770A6` : 4,02:1 sur le fond, 3,74:1 sur la surface 1, 3,40:1 sur la surface 2 |
| Sombre : brand-600 / `#111634` | 2,38:1 | puce « Québec » reprise du mode clair | styles sombres propres à chaque puce (section 3.7) |

Tout le reste du brief passe tel quel. L'ajustement de slate-500 est le seul changement d'une valeur existante.

### 4.3 Texte sur fond coloré : règle par fond

| Fond | Texte | Métadonnées | Liens | Anneau de focus |
|---|---|---|---|---|
| surface, canvas, slate-100, brand-50 | ink | slate-500 | brand-600 | brand-600 |
| brand-100, brand-200 | ink | slate-700 (7,74:1 et 6,01:1) | brand-600 (5,87:1 sur brand-100) | brand-600 |
| brand-300 à brand-700 | aucun texte hors des puces et des boutons, dont les paires sont vérifiées | | | |
| brand-800, brand-900, brand-950 | blanc | brand-200 (7,42:1, 8,96:1 et 10,87:1) | blanc souligné | blanc |

---

## 5. Typographie

### 5.1 Familles

| Rôle | Police | Graisses | Justification |
|---|---|---|---|
| Titres | **Manrope** (variable) | 700, 800 | géométrique, moderne, lisible en gras; distingue le site des médias en Inter seul |
| Texte courant et interface | **Inter** (variable) | 400, 500, 600 | lisibilité à l'écran, chiffres tabulaires natifs, excellente couverture du français |
| Citations juridiques (proposition) | **Source Serif 4** (variable) | 400, 400 italique | réservée à `TexteDeLoi` et `Citation` : l'œil reconnaît aussitôt un texte cité, et le site gagne sa touche « revue juridique » |

**Alternatives examinées** :
- **Inter pour les titres** (en Inter Display ou avec un resserrement fort) : plus neutre et une police de moins, mais une identité plus générique. C'est le repli si Manrope paraît trop large dans les grilles denses : un titre de carte sur quatre colonnes fait une ligne de plus qu'en Inter.
- **Geist** : très réussie, mais connotée « outil de développeur » (Vercel), moins institutionnelle.
- **Serif pour tous les titres** : trop « presse magazine » pour un média de conformité, et moins lisible en petite taille dans les cartes.

La serif est **facultative** : `theme.json` contient `fonts.legalSerif: true|false`. Si elle est désactivée, `TexteDeLoi` et `Citation` passent en Inter italique. Coût : une graisse et son italique en woff2, sous-ensemble latin, chargées seulement sur les pages qui les utilisent (mesuré en phase 1 : 50,8 Ko en romain et 51,5 Ko en italique; pour comparaison, Manrope pèse 24,8 Ko et Inter 48,3 Ko, toutes deux préchargées sur chaque page).

**Chargement** :
- polices auto-hébergées, servies par l'API Fonts d'Astro à partir des paquets `@fontsource-variable` (ARCHITECTURE, section 5);
- format woff2, sous-ensemble `latin`, qui couvre œ, « », l'espace insécable et l'espace fine insécable;
- `font-display: swap`, préchargement d'Inter 400 et de Manrope 800 seulement, polices de repli ajustées (`size-adjust`) pour limiter le décalage de mise en page;
- l'auteur choisit les polices dans `theme.json`, parmi une liste fermée de polices préinstallées (Manrope, Inter, Source Serif 4). Ajouter une police hors liste demande une intervention de Claude Code (ARCHITECTURE, écart B18; question A4);
- les images Open Graph et les gabarits sociaux utilisent toujours Manrope 800, en fichier statique, quel que soit le choix fait dans `theme.json`.

Les flèches, coches et triangles des maquettes sont des icônes Lucide (`arrow-right`, `arrow-up-right`, `trending-up`, `trending-down`, `check`), jamais des caractères dans les chaînes de `fr.json` : ils sont absents du sous-ensemble latin et s'afficheraient dans une police de repli.

### 5.2 Échelle

L'échelle du brief (12 à 48 px) est exprimée en rem (base 16 px).

| Jeton | px | rem | Usage principal | Interlettrage (approche) |
|---|---|---|---|---|
| `text-xs` | 12 | 0,75 | puces, libellés en capitales | +0,04 em (capitales) |
| `text-sm` | 14 | 0,875 | métadonnées, crédits, légendes, menus | 0 |
| `text-base` | 16 | 1 | interface, cartes compactes, formulaires | 0 |
| `text-lg` | 18 | 1,125 | **corps d'article (ordinateur)**, titres de cartes `medium` | 0 |
| `text-xl` | 20 | 1,25 | chapô (mobile), H3 d'article, titres de cartes `large` | −0,01 em |
| `text-2xl` | 24 | 1,5 | H2 d'article, chapô (ordinateur), titre de carte `featured` (mobile) | −0,015 em |
| `text-3xl` | 30 | 1,875 | H1 d'article (mobile), titres de section d'accueil | −0,02 em |
| `text-4xl` | 36 | 2,25 | H1 d'article (ordinateur), titre de carte `featured` (ordinateur) | −0,02 em |
| `text-5xl` | 48 | 3 | H1 de hub, de dossier et de juridiction (ordinateur) | −0,025 em |

**Interligne, fixé par rôle et non par taille**, comme le demande le brief :
- titres en Manrope (H1 à H4, titres de cartes) : **1,15**;
- texte courant (corps, chapô, cartes, formulaires, encadrés) : **1,6**;
- libellés d'une ligne (boutons, menus, puces) : 1,2. Ce ne sont pas du texte courant.

**Règles** :
- Titres en Manrope 800 pour le H1, 700 pour les H2 à H4 et les titres de cartes.
- Corps d'article : 18 px sur ordinateur, largeur de lecture maximale de 720 px (45 rem), soit environ 70 à 75 caractères par ligne.
- **Corps d'article sur mobile : 17 px (1,0625 rem).** C'est la seule valeur hors échelle, justifiée par la lecture longue de textes juridiques sur petit écran. À valider (section 15).
- `font-variant-numeric: tabular-nums` sur tous les chiffres de tableaux, montants, dates des frises, ticker et métadonnées.
- Montants, pourcentages, dates et heures passent par les utilitaires centralisés et testés : « 84 146 $ CA », « 5 % », « 24 septembre 2026 », « 17 h 17 ». Les espaces avant `:`, `$` et `%`, à l'intérieur des guillemets et entre les milliers sont insécables. Elles sont insérées au build (ARCHITECTURE, section 5).
- **Dates** : toujours en toutes lettres (« 24 septembre 2026 »). Le premier jour du mois s'écrit « 1er » (« 1er janvier 2027 »). La forme abrégée (« 30 sept. ») est réservée aux puces de date de l'agenda et produite par `formatDate(…, 'court')`. Mois en minuscules.
- **Heures** : « 17 h 17 »; heure juste sans zéros : « 15 h ».
- **Liens dans le texte** : soulignés (épaisseur 1 px, décalage 3 px), soulignement épaissi à 2 px au survol. Jamais la couleur seule.

---

## 6. Espacements, grille, rayons, ombres, mouvements

| Famille | Valeurs |
|---|---|
| Espacements (base 4 px) | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 |
| Conteneur | 1240 px de large au plus; marges latérales de 16 px (mobile), 24 px (tablette), 32 px (ordinateur) |
| Grille | 12 colonnes, gouttière de 24 px (16 px sous 768 px) |
| Pages de contenu | contenu sur le reste de la largeur (texte limité à 720 px), barre latérale de largeur fixe 340 px, collante à partir de 1024 px (`minmax(0, 1fr) 340px`). Quatre colonnes de la grille mesureraient 376 à 397 px, pas 340 : la largeur fixe l'emporte (ARCHITECTURE, écart B24) |
| Points de rupture | 640, 768, 1024, 1280 px |
| Rayons | cartes 12 px, boutons et champs 10 px, puces 6 px, pastilles de lien 999 px, images dans les cartes 8 px |
| Bordures | 1 px; filet de catégorie et d'encadré de 4 px |
| Ombres | au repos : aucune (bordure seule). Au survol : `0 6px 20px -8px rgb(14 18 48 / .18)`. Menus et modale : `0 16px 48px -12px rgb(14 18 48 / .28)`. En sombre, l'ombre est remplacée par l'éclaircissement de la surface |
| Mouvements | 150 ms (survol, soulignement), 200 ms (menus, tiroir), courbe `cubic-bezier(.2,.7,.2,1)`, translation de −2 px au survol des cartes; tout est désactivé sous `prefers-reduced-motion: reduce` |
| Hauteurs fixes | ticker 36 px (facultatif); en-tête 64 px (56 px sous 768 px, à valider : section 15); bandeau d'annonce 40 px (facultatif) |
| Couches (z-index) | contenu 0, en-tête collant 40, menus 50, tiroir 60, modale de recherche 70 |

---

## 7. Iconographie, images et logo

**Icônes** :
- Lucide, rendues en SVG au build (zéro JavaScript), trait de 1,75 px, tailles 16, 20 et 24 px.
- Icônes de réseaux sociaux : Simple Icons (licence CC0), copiées en SVG. Lucide a retiré les logos de marque depuis sa version 1.0.
- Le nom de l'icône de chaque entrée de menu est stocké dans `navigation.json`, et donc choisi par l'auteur dans une liste.
- Les icônes décoratives portent `aria-hidden="true"`. Les boutons qui n'ont qu'une icône portent un libellé accessible tiré de `fr.json`.

**Couvertures** :
- Format 1600 × 800 (2:1), WebP, déclinées en plusieurs tailles par `astro:assets`. Texte alternatif et crédit obligatoires : un contenu sans l'un ou l'autre fait échouer la validation.
- Crédit affiché sous l'image, en `text-sm` slate-500, avec lien facultatif.
- **Couverture générée par défaut** quand l'auteur n'en fournit pas :
  - dégradé de brand-700 vers brand-900, grille de 1 px en brand-600 à 40 % d'opacité;
  - puce de catégorie en style inversé (fond blanc, texte brand-900 : 14,58:1) en haut à gauche, pour rester visible sur le dégradé;
  - titre en Manrope 800 blanc, nom du site en bas.
- Le même gabarit sert aux **fiches** (organisme, texte, juridiction, traitement fiscal), avec un sigle en grand, sur le modèle des fiches des références qui partagent un gabarit commun (section 13.3). Pour une fiche d'organisme, on écrit l'acronyme (« AMF », « CANAFE »), jamais son logo officiel.
- Images **Open Graph** 1200 × 630 générées au build pour chaque page, sur le même gabarit (ARCHITECTURE, section 13).
- **Gabarits partageables** : carte sociale carrée 1080 × 1080 et en-tête de newsletter 1200 × 300, dérivés des mêmes jetons et exportés en PNG par un script. Pour LinkedIn, l'image Open Graph de la page sert telle quelle.

**Logo** :
- Mot-symbole temporaire : `[NOM-DU-SITE]` en Manrope 800, brand-600 (blanc sur fond sombre), interlettrage −0,03 em.
- Il est précédé d'un pictogramme simple, en attendant le vrai logo : un carré de 4 × 4 cases de grille dont une case est pleine, symbole de « la règle dans la grille ». Aucun symbole de cryptoactif.
- Remplaçable par un SVG référencé dans `config/site.json` (versions claire et sombre). Le favicon (SVG, et PNG en 32, 180 et 512 px) et le masque sont dérivés au build.

---

## 8. Inventaire des composants

Règle : un composant générique par besoin, nommé en anglais, commenté en français, de moins de 200 lignes, sans aucune chaîne visible en dur. Tous les libellés viennent de `config/i18n/fr.json`. Les 26 composants de l'inventaire du brief (point 3.3) y figurent, complétés par ceux qu'exigent le modèle de contenu et les formulaires.

### 8.1 Primitives

| Composant | Variantes | États et accessibilité | JS |
|---|---|---|---|
| `Button` | `primary`, `secondary`, `ghost`, `link` (pastille de lien); tailles `sm`, `md`, `lg`; avec ou sans icône | survol, focus visible, pressé, désactivé, chargement (`aria-busy`); cible d'au moins 24 × 24 px | non |
| `Badge` | `solid`, `soft`, `outline` : base de toutes les puces | texte obligatoire | non |
| `CategoryBadge` | style lu dans la taxonomie (`badgeStyle`) | lien vers le hub | non |
| `JurisdictionBadge` | style lu dans la fiche juridiction (`badgeStyle` : `plein`, `contour-point`, `contour`) | lien vers la fiche juridiction | non |
| `StatusBadge` | les 8 statuts de la section 3.7 | icône et libellé | non |
| `Tag` | puce neutre de mot-clé | lien vers `/tags/[tag]/` | non |
| `Avatar` | 24, 32 et 64 px | initiales si la photo manque; image décorative quand le nom est à côté | non |
| `Card` | `default`, `muted`, `brand` | conteneur générique | non |
| `Figure` | image, légende, crédit | `figure` et `figcaption`; crédit obligatoire | non |
| `Alert` | `info`, `success`, `warning`, `danger` | `role="status"` ou `alert` selon le cas | non |
| `Callout` | les 13 variantes de la section 9 | titre, icône, filet de 4 px | non |
| `Table` | `default`, `compact`, `striped`; défilement horizontal sur mobile avec ombre de débordement | `<caption>` obligatoire, en-têtes `scope` | non |
| `Accordion` | simple, groupe | `<details>` et `<summary>` natifs | non |
| `Tabs` | soulignés | rôles ARIA `tablist`; sans JS, sections empilées. Livré seulement si un gabarit en a besoin (section 15) | minime |
| `Dropdown` | menu d'en-tête | clavier (flèches, Échap), `aria-expanded` | minime |
| `Tooltip` | infobulle de `Definition` | au focus et au survol; fermable par Échap, survolable, persistante tant que le pointeur ou le focus y reste (WCAG 1.4.13) | minime |
| `FormField` | libellé, aide, message d'erreur | libellé toujours visible, `aria-describedby`, erreur annoncée | non |
| `Input`, `Checkbox`, `Select` | bordure `--c-border-control`; erreur en danger-strong sur danger-50 | cible d'au moins 24 × 24 px | non |
| `Breadcrumb` | | `nav` et `aria-label`, `aria-current="page"` | non |
| `Pagination` | numérotée, avec précédente et suivante | `aria-label`, `aria-current` | non |
| `Timeline` | `vertical` (dossiers, veille, agenda), `compact` (barre latérale) | liste ordonnée, dates en `<time>` | non |
| `RelativeTime` | | date absolue dans le HTML, convertie en relatif (jusqu'à 7 jours) dans le navigateur | ~1 ko |

### 8.2 Éditorial

| Composant | Variantes et contenu |
|---|---|
| `ArticleCard` | `featured`, `large`, `medium`, `small`, `horizontal`, `compact`. Un seul objet `article` en entrée : image, catégorie, juridictions, titre, chapô, auteur, date, temps de lecture, statut, et **niveau** pour les guides (« Facile · 12 min », puce `soft` à côté du temps de lecture). Filet de catégorie de 4 px à gauche du titre, puce de catégorie sur l'image (coin bas gauche). La carte entière est cliquable (lien étendu sur le titre, pas de lien imbriqué). |
| `AuthorCard` | `full` (fin d'article : photo, rôle, mention professionnelle, bio, nombre d'articles, réseaux), `inline` (ligne de métadonnées) |
| `SourceCard`, `SourceList` | sources officielles en premier, avec une icône distinctive (`landmark`); type, émetteur, date du document, lien, lien d'archive |
| `TrustBlock` (bloc de confiance) | « Vérifié le », « Cette information concerne », « Entrée en vigueur », « Révisé par », notes de correction |
| `RegulationBox` (« Cette réglementation ») | statut, autorité, juridiction, dates clés, lien vers le dossier |
| `RelatedEntities` | textes, organismes et traitements liés, en liste compacte |
| `TableOfContents` | colonne collante (ordinateur) ou `details` repliable (mobile); section courante mise en évidence (amélioration progressive) |
| `ShareButtons` | X, LinkedIn, Facebook, WhatsApp, Telegram, courriel, copie du lien, flux RSS; liens « Signaler une erreur » et « Suggérer un sujet » (`mailto` préremplis avec le titre et l'URL). Liens simples, sans script tiers. La copie affiche « Lien copié » dans le libellé du bouton lui-même, annoncé aux lecteurs d'écran. Même barre sur mobile, sur deux lignes |
| `DisclaimerBox` | variante lue dans `legal.json` selon `disclaimerVariant` |
| `NewsletterCard` | `inline` (article), `compact` (barre latérale et pied de page), `band` (accueil, fond brand-800), `page`; textes lus dans `newsletter.json` |
| `SectionHeader` | titre de section, sous-titre, pastille de lien « Tout voir → » alignée à droite |
| `EmptyState` | liste vide (juridiction sans article, etc.) |
| `PartnerBlock` | affiché seulement s'il est activé dans `ads.json`; mention « Publicité » toujours visible; fond slate-100, jamais les couleurs de marque |
| `Note` | appel de note numéroté automatiquement; notes regroupées en fin d'article, avec lien de retour vers l'appel (ARCHITECTURE, section 7.15) |
| `Hero` | bloc de page : titre, texte, bouton, image facultative |
| `ArticleList` | bloc de page « ListeArticles » : `ArticleCard` en liste ou en grille selon un filtre fixé par l'auteur; le filtrage interactif passe par la recherche |
| `FilterForm` | formulaire Thème, Format, Juridiction des hubs, qui mène à `/recherche/` avec les filtres présélectionnés (ARCHITECTURE, section 10) |
| `MarketCard` | sections `market-brief` et `trending-assets` : valeur en `$ CA`, variation avec flèche, signe et couleur, heure des données, attribution CoinGecko |

### 8.3 Structure et navigation

| Composant | Comportement |
|---|---|
| `SkipLink` | lien d'évitement « Aller au contenu », premier élément focalisable |
| `Logo` | SVG de `site.json` ou mot-symbole temporaire, versions claire et sombre |
| `Header` | logo, navigation à deux niveaux, recherche, bascule de thème, bouton « S'abonner »; collant; ombre fine après défilement |
| `MobileDrawer` | tiroir plein écran depuis la droite; recherche en tête; entrées avec icône, libellé et description; sous-menus en accordéon; bascule de thème et appel à l'abonnement en bas; la navigation au clavier reste dans le tiroir tant qu'il est ouvert; fermeture par Échap |
| `AnnouncementBar` | message et lien lus dans `site.json`, affiché tant qu'il est activé; non refermable en v1 |
| `Ticker` | actifs en `$ CA`, valeurs et heure du dernier build (ARCHITECTURE, section 12.3), sans rafraîchissement dans le navigateur ni défilement automatique; absent du HTML s'il n'y a pas de données : aucun décalage de mise en page |
| `Footer` | fond brand-900; colonnes À propos, Ressources, Mentions légales, Réseaux, Newsletter (`NewsletterCard` compacte); mention de l'hébergement des données; copyright |
| `Sidebar` | pile de modules configurables |
| `SearchModal` | élément `dialog` natif; raccourci `Ctrl`/`⌘ K`, sans raccourci d'un seul caractère (WCAG 2.1.4); résultats groupés par type, cinq par groupe, avec « Voir plus de résultats »; filtres par type, juridiction et date; navigation au clavier; index chargé à la première ouverture seulement |
| `ThemeToggle` | bascule à deux états, clair et sombre. Premier affichage selon la préférence du système, clair en l'absence de préférence, puis choix mémorisé. Un petit script intégré en tête de page évite le clignotement du mauvais thème au chargement |
| Sections d'accueil | un composant par type de `homepage.json`, composé uniquement des composants ci-dessus |

---

## 9. Blocs riches de l'éditeur (MDX) et blocs de page

Tous les encadrés ont la même structure : filet de 4 px à gauche, fond teinté, icône et titre sur une ligne, puis le contenu. La couleur vient de la famille, le libellé de `fr.json`. On garde **cinq familles de couleur, pas treize**.

| Famille | Fond | Filet | Titre et icône | Sombre (fond / titre; filet) |
|---|---|---|---|---|
| info forte | brand-100 | brand-800 | brand-800 (9,55:1) | `#15204F` / brand-200 (9,55:1); filet brand-300 |
| info | brand-50 | brand-500 | brand-700 (8,66:1) | `#15204F` / `#9DB0FF` (7,46:1); filet brand-400 |
| avertissement | warning-50 | warning | warning-strong (4,64:1) | `#2A1D06` / `#F59E0B` (7,66:1) |
| succès | success-50 | success | success-strong (4,71:1) | `#0F2A1C` / `#3DBE7E` (6,48:1) |
| neutre | slate-100 | slate-500 | slate-700 (8,81:1) | `#181E44` / `#E7EAF6` (13,38:1); filet `#A6ADCC` |

Le filet porte la couleur de la famille; le titre et l'icône, sa variante forte. Les icônes sont décoratives (`aria-hidden`) : c'est le titre qui porte le sens. Le texte courant reste en ink (au moins 14,48:1) ou, en sombre, en `#E7EAF6` (au moins 12,79:1).

| Variante `Callout` | Famille | Icône Lucide | Libellé par défaut |
|---|---|---|---|
| `important` | info forte | `badge-alert` | Important |
| `a-retenir` | info | `bookmark` | À retenir |
| `attention` | avertissement | `triangle-alert` | Attention |
| `en-pratique` | info | `list-checks` | En pratique |
| `exemple` | neutre | `calculator` | Exemple |
| `date-a-retenir` | info forte | `calendar-clock` | Date à retenir |
| `ce-qui-change` | info forte | `git-compare` | Ce qui change |
| `pour-les-particuliers` | info | `user` | Pour les particuliers |
| `pour-les-entreprises` | info | `building-complex` | Pour les entreprises |
| `source-officielle` | info forte | `landmark` | Source officielle |
| `mise-a-jour` | succès | `refresh-cw` | Mise à jour |
| `pour-approfondir` | neutre, lien interne en carte | `arrow-right` | Pour approfondir |
| `bon-a-savoir` | info | `lightbulb` | Bon à savoir |

`date-a-retenir` reste bleu : l'or est réservé aux deux usages du brief (section 3.2).

**Autres blocs** :
- **`TexteDeLoi`** : citation littérale en Source Serif 4 (ou Inter italique), filet brand-900, en-tête « Loi X, art. Y », mention « Version citée : en vigueur au [date] » et lien « Texte officiel ». Pas de guillemets décoratifs.
- **`ExempleChiffre`** : tableau libellé et montant, aligné à droite en chiffres tabulaires, montants au format `$ CA`. Ligne de total sur fond gold-100 (brand-100 si l'or est désactivé). Mention d'avertissement tirée de `legal.json` (variante `exemple-chiffre`, texte proposé : « Exemple simplifié qui ne constitue pas un conseil fiscal. » [À VALIDER PAR L'AUTEUR]).
- **`Chronologie`** : `Timeline` verticale, dates en Manrope 700.
- **`Comparatif`** : `Table` avec colonne de tête figée sur mobile.
- **`Citation`** : citation avec attribution (personne, fonction, source, date).
- **`Video`** : façade (image et bouton de lecture), puis iframe `youtube-nocookie.com` au clic. Aucun appel à YouTube avant le clic.
- **`Definition`** : terme souligné en pointillé, `Tooltip` avec la `shortDefinition` du lexique et un lien vers la fiche.
- **`MiseEnGarde`** : famille avertissement, texte fixe tiré de `legal.json`.
- **`StatutReglementaire`** : `StatusBadge` du dossier lié, en ligne ou en bloc.
- **`BlocPartenaire`** : voir `PartnerBlock`.
- **`Note`** et **`Image`** (ajouts d'ARCHITECTURE, section 7.15) : note numérotée; `Figure` avec légende, crédit et texte alternatif obligatoires.

**Blocs de page** (point 6.14 du brief), tous construits sur les composants de la section 8 : `Hero`; `ListeArticles` (`ArticleList`); `CarteAuteur` (`AuthorCard`); `Newsletter` (`NewsletterCard`); `ListeSources` (`SourceList`); `FAQ` (`Accordion` en groupe); `Chronologie` (`Timeline`); `Tableau` (`Table`).

---

## 10. Accessibilité : règles visuelles

- **Objectif WCAG 2.2 AA.** Lien d'évitement « Aller au contenu » en premier élément focalisable.
- **Focus visible partout** : anneau de 2 px `--c-focus`, décalage de 2 px, jamais supprimé. Sur les fonds brand-800 et plus foncés (pied de page, bandeau newsletter, annonce, sections de marque), l'anneau passe en `--c-focus-inverse`, blanc (12,07:1 sur brand-800, 14,58:1 sur brand-900).
- **Focus jamais masqué** (critère 2.4.11) : `scroll-padding-top` égal à la hauteur cumulée des éléments collants, pour que l'en-tête ne recouvre pas l'élément qui reçoit le focus.
- **Cibles tactiles** d'au moins 24 × 24 px (critère 2.5.8), 44 × 44 px pour les boutons principaux sur mobile.
- **Aucune information portée par la couleur seule** : catégories, statuts, variations du ticker (flèche et signe + ou −).
- **Structure de titres** : un seul H1 par page. Sur l'accueil, un H1 visuellement masqué porte le nom du site et sa baseline (tirés de `site.json`), et les titres de section sont des H2. Les titres de cartes sont des H3 sous des H2 de section.
- **Texte alternatif obligatoire** (validation). Les images décoratives, dont les couvertures générées, ont un `alt` vide; le titre figure dans le texte adjacent.
- **Contenu au survol ou au focus** (critère 1.4.13) : l'infobulle de `Definition` se ferme par Échap, peut être survolée et reste affichée tant que le pointeur ou le focus y reste.
- **Rien ne bouge seul** (critère 2.2.2) : le ticker est statique, sans défilement automatique.
- **Raccourcis clavier** : seulement avec une touche de modification (`Ctrl`/`⌘ K`), jamais d'un seul caractère (critère 2.1.4).
- `prefers-reduced-motion` est respecté; `prefers-color-scheme` ne sert qu'au premier affichage.
- **Feuille de style d'impression** pour les dossiers, fiches et traitements fiscaux : noir sur blanc, URL des liens imprimées après le texte, navigation masquée, date d'impression et date « Vérifié le » en en-tête.

---

## 11. Structure de `config/theme.json`

Esquisse du fichier créé en phase 1 (les valeurs sont celles des sections 3, 5 et 6) :

```json
{
  "accentGold": true,
  "colors": {
    "brand": { "50": "#EEF2FF", "100": "#DDE4FF", "200": "#BBC9FF", "300": "#8FA6FF", "400": "#5F7CF6",
               "500": "#3B5BEA", "600": "#2743D3", "700": "#1E35AD", "800": "#182B88", "900": "#132264", "950": "#0B1440" },
    "gold": { "100": "#FFF4CC", "500": "#E0A800", "600": "#B98700", "700": "#8A6500", "dark": "#E6B93A" },
    "neutral": { "ink": "#0E1230", "slate700": "#3C4262", "slate500": "#62688A", "slate400": "#878DAA",
                 "slate300": "#C3C7D9", "slate200": "#E1E4EF", "slate100": "#F1F3F9", "canvas": "#F7F8FC", "surface": "#FFFFFF" },
    "semantic": { "success": "#1B9E5B", "successStrong": "#157A48", "success50": "#E3F4EA",
                  "danger": "#D6323C", "dangerStrong": "#B4232C", "danger50": "#FBE7E8",
                  "warning": "#D97706", "warningStrong": "#A15C07", "warning50": "#FDF1DC" },
    "dark": { "bg": "#0A0E27", "surface1": "#111634", "surface2": "#181E44", "border": "#262D5C",
              "borderStrong": "#6770A6", "text": "#E7EAF6", "textSecondary": "#A6ADCC", "link": "#9DB0FF",
              "infoBg": "#15204F", "success": "#3DBE7E", "successBg": "#0F2A1C", "warning": "#F59E0B",
              "warningBg": "#2A1D06", "danger": "#F2777E", "dangerBg": "#2E1216" }
  },
  "badgeStyles": {
    "plein-500":     { "light": { "bg": "brand.500", "fg": "white" },      "dark": { "bg": "brand.500", "fg": "white" },      "rule": "brand.500" },
    "plein-700":     { "light": { "bg": "brand.700", "fg": "white" },      "dark": { "bg": "brand.700", "fg": "brand.100" },  "rule": "brand.700" },
    "plein-900":     { "light": { "bg": "brand.900", "fg": "white" },      "dark": { "bg": "brand.900", "fg": "brand.200" },  "rule": "brand.900" },
    "doux-800":      { "light": { "bg": "brand.100", "fg": "brand.800" },  "dark": { "bg": "brand.800", "fg": "brand.100" },  "rule": "brand.800" },
    "doux-900":      { "light": { "bg": "brand.100", "fg": "brand.900" },  "dark": { "bg": "brand.900", "fg": "brand.200" },  "rule": "brand.900" },
    "clair-300":     { "light": { "bg": "brand.300", "fg": "brand.950" },  "dark": { "bg": "brand.300", "fg": "brand.950" },  "rule": "brand.400" },
    "ardoise":       { "light": { "bg": "neutral.slate100", "fg": "neutral.slate700" }, "dark": { "bg": "dark.border", "fg": "dark.textSecondary" }, "rule": "neutral.slate700" },
    "plein":         { "light": { "bg": "brand.600", "fg": "white" },      "dark": { "bg": "brand.600", "fg": "white" } },
    "contour-point": { "light": { "border": "brand.600", "fg": "brand.600", "dot": "brand.900" }, "dark": { "border": "dark.link", "fg": "dark.link", "dot": "brand.200" } },
    "contour":       { "light": { "border": "neutral.slate500", "fg": "neutral.slate500" }, "dark": { "border": "dark.textSecondary", "fg": "dark.textSecondary" } }
  },
  "statusStyles": { "projet": "…", "consultation": "…", "adopte": "…", "en-vigueur": "…",
                    "partiellement-en-vigueur": "…", "modifie": "…", "abroge": "…", "retire": "…" },
  "fonts": { "heading": "Manrope", "body": "Inter", "legalSerif": true, "legalSerifFamily": "Source Serif 4" },
  "type": { "scale": [12, 14, 16, 18, 20, 24, 30, 36, 48], "articleBodyMobile": 17,
            "leading": { "heading": 1.15, "body": 1.6, "label": 1.2 } },
  "radius": { "card": 12, "button": 10, "badge": 6, "image": 8 },
  "layout": { "container": 1240, "sidebar": 340, "readingWidth": 720, "header": 64, "headerMobile": 56 }
}
```

`statusStyles` suit la même forme que `badgeStyles`, avec les valeurs du tableau des statuts (section 3.7).

**Conversion** : au build, un utilitaire lit ce fichier, le valide (format hexadécimal, clés attendues, styles connus, contrastes) et émet les variables CSS (`--brand-600`, puis les alias de la section 3.6 pour `:root` et `[data-theme="dark"]`). Tailwind 4 référence ces variables dans son bloc `@theme`. L'interface d'édition présente ces couleurs dans des champs hexadécimaux validés, avec un aperçu du nuancier dans l'aide contextuelle : Keystatic n'a pas de champ couleur (ARCHITECTURE, section 4).

---

## 12. Maquettes filaires (ordinateur et mobile)

**Conventions** :
- `[img]` et `[ image 2:1 ]` : image; `▌` : filet de catégorie; `(Puce)` : puce; `[ … ]` : bouton ou champ; `(av)` : avatar;
- `→` : lien interne; `↗` : lien externe; `⌕` : recherche; `☰` : menu; `◐` : bascule de thème; `▦` : pictogramme du logo; `●` et `○` : points de frise;
- `░` : fond brand-900; `▓` : fond brand-800.

Les symboles tiennent lieu d'icônes Lucide; ils ne sont jamais des caractères dans le site. Les largeurs sont indicatives. Chaque section d'accueil est une entrée de `homepage.json` : son ordre, son titre, ses filtres et sa présence se modifient sans code.

### 12.1 Accueil, ordinateur (1240 px)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BTC 84 146 $ CA ▲ 1,2 %   ETH 3 512 $ CA ▼ 0,4 %   SOL …          CoinGecko, à 14 h 10 │ ticker 36 px (facultatif)
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ▦ [NOM-DU-SITE]    Actualités ▾   Réglementation ▾   Fiscalité ▾   Dossiers   Guides   │ en-tête 64 px, collant
│ Organismes                              [ Rechercher…   Ctrl K ]    ◐    [ S'abonner ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Les dernières évolutions réglementaires du Canada et du Québec →                       │ annonce (facultative)
└────────────────────────────────────────────────────────────────────────────────────────┘

Sélection de la rédaction                                                   hero-selection
┌──────────────────────────────────────────────────┐  ┌──────────────────────────────────┐
│ [ image 2:1 ................................. ]  │  │ [img] ▌Titre de la carte, sur    │
│ [ (Réglementation)                            ]  │  │       ▌deux lignes · Il y a 3 h  │
│ (Canada) (Québec)                                │  ├──────────────────────────────────┤
│ ▌Titre principal en 36 px, Manrope 800,          │  │ [img] ▌Titre…                    │
│ ▌sur deux ou trois lignes                        │  │       ▌… · Il y a 5 h            │
│ Chapô de deux lignes en 18 px, slate-700…        │  ├──────────────────────────────────┤
│ (av) Prénom Nom · Il y a 3 h · 6 min             │  │ [img] ▌Titre…                    │
│                                                  │  │       ▌… · Hier                  │
│                                                  │  ├──────────────────────────────────┤
│                                                  │  │ [img] ▌Titre…                    │
│                                     (7 colonnes) │  │       ▌… · Hier         (5 col.) │
└──────────────────────────────────────────────────┘  └──────────────────────────────────┘

Dernières actualités    [ Toutes les actualités → ]                content-block, list, 20
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ (Réglementation) · Il y a 2 h · Prénom Nom  (Fiscalité) · Hier à 17 h 17 · Prénom Nom  │
│ ▌Titre de l'actualité, deux lignes au plus  ▌Titre de l'actualité, deux lignes au plus │
│                                                                                        │
│ (Actualités) · Il y a 2 jours               (Réglementation) · Il y a 3 jours          │
│ ▌Titre de l'actualité…                      ▌Titre de l'actualité…                     │
│                                                                                        │
│ … dix entrées par colonne,                  … une seule colonne sur mobile             │
│ séparées par des filets slate-200                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘

░░ fond brand-900 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░ Réglementation                                           [ Toute la réglementation → ] ░
░                                                                                        ░
░ ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐ ░
░ │ [ image 2:1           ]  │ │ [ image 2:1           ]  │ │ [ image 2:1           ]  │ ░
░ │ ▌Titre sur deux ou trois │ │ ▌Titre sur deux ou trois │ │ ▌Titre sur deux ou trois │ ░
░ │ ▌lignes                  │ │ ▌lignes                  │ │ ▌lignes                  │ ░
░ │ Prénom Nom · Il y a 5 h  │ │ Prénom Nom · Il y a 5 h  │ │ Prénom Nom · Il y a 5 h  │ ░
░ └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘ ░
░                                                                                        ░
░ grille de 3 × 2 cartes medium, fond brand-900 (background: brand)                      ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Fiscalité : grille de 3 × 2 identique, sur fond canvas              content-block, grid, 6

Québec                                                           content-block, compact, 6
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ ▌Titre sur │ │ ▌Titre sur │ │ ▌Titre sur │ │ ▌Titre sur │ │ ▌Titre sur │ │ ▌Titre sur │
│ ▌2 lignes  │ │ ▌2 lignes  │ │ ▌2 lignes  │ │ ▌2 lignes  │ │ ▌2 lignes  │ │ ▌2 lignes  │
│ Il y a 1 j │ │ Il y a 1 j │ │ Il y a 1 j │ │ Il y a 1 j │ │ Il y a 1 j │ │ Il y a 1 j │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘

À surveiller                                                                     watchlist
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Agenda à venir                                Dossiers en consultation                 │
│ [30 sept.] Échéance fiscale · Titre… →        (Consultation) Titre du dossier… →       │
│ [15 oct.]  Consultation · Titre… →            (Consultation) Titre du dossier… →       │
│ [1er nov.] Entrée en vigueur · Titre… →       Fin de la consultation : 15 octobre      │
│                                                                                        │
│ [30 sept.] : pastille de date, or si accentGold est activé, sinon brand-100            │
└────────────────────────────────────────────────────────────────────────────────────────┘

Dossiers    [ Tous les dossiers → ]                                         dossiers-strip
┌────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│ [ couverture générée, grille bleue ]   │  │ (En vigueur) Titre du dossier 2        →     │
│ (Consultation) Titre du dossier        │  │ (Projet) Titre du dossier 3            →     │
│ Vérifié le 20 septembre 2026           │  │ (Adopté) Titre du dossier 4            →     │
└────────────────────────────────────────┘  └──────────────────────────────────────────────┘

Les essentiels    [ Tous les guides → ]                            essentials (facultatif)
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ [ image 2:1      ] │  │ [ image 2:1      ] │  │ [ image 2:1      ] │  │ [ image 2:1      ] │
│ ▌Titre du guide    │  │ ▌Titre du guide    │  │ ▌Titre du guide    │  │ ▌Titre du guide    │
│ Facile · 12 min    │  │ Facile · 12 min    │  │ Facile · 12 min    │  │ Facile · 12 min    │
└────────────────────┘  └────────────────────┘  └────────────────────┘  └────────────────────┘

Veille officielle                                                         veille-latest, 8
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ● Il y a 1 h · AMF (Québec)       Titre de la publication officielle ↗                 │
│ │                                                                                      │
│ ● Il y a 5 h · CANAFE (Canada)    Titre de la publication officielle ↗                 │
│ │                                                                                      │
│ ○ Hier · ARC (Canada)             Titre de la publication officielle ↗                 │
│                                                                                        │
│ Publications externes : organisme émetteur et lien sortant       [ Toute la veille → ] │
└────────────────────────────────────────────────────────────────────────────────────────┘

▓▓ newsletter-cta, fond brand-800 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓ L'essentiel de la réglementation des cryptoactifs, chaque semaine                      ▓
▓ [ votre@courriel.ca                    ]  [ S'abonner ]                                ▓
▓ ☐ J'accepte de recevoir la newsletter (lien vers la politique de confidentialité)      ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

┌─ Pied de page, fond brand-900 ─────────────────────────────────────────────────────────┐
│ [NOM-DU-SITE]     À propos         Ressources       Mentions légales  Newsletter       │
│ Baseline          Méthodologie     Lexique          Confidentialité   [ courriel    ]  │
│ (in) (X) (RSS)    Corrections      Agenda           Avertissement     [ S'abonner  ]   │
│                   Transparence     Veille           Conditions        ☐ Consentement   │
│                   Contact                                                              │
│                                                                                        │
│ © 2026 [NOM-DU-SITE] · Données hébergées : [À COMPLÉTER PAR L'AUTEUR]                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- La maquette suit l'ordre de l'exemple du point 7.3 du brief, avec en plus « Les essentiels », section facultative ajoutée pour montrer le niveau et la durée des guides. « Les plus lus » (`most-read`) et les sections de marché existent, mais ne figurent pas dans la configuration par défaut.
- Les sections sont toujours empilées sur toute la largeur : ni carrousel, ni juxtaposition de deux sections. La colonne latérale proposée à côté de « Dernières actualités » est reportée (section 15).
- L'en-tête tient sur une seule ligne de 64 px à 1240 px; la maquette le coupe en deux faute de place.
- Un H1 visuellement masqué porte le nom du site et sa baseline (section 10).

### 12.2 Accueil, mobile (375 px)

```
┌─────────────────────────────────────┐
│ ▦ [NOM-DU-SITE]               ⌕   ☰ │ 56 px, collant
├─────────────────────────────────────┤
│ Annonce (facultative)             → │
├─────────────────────────────────────┤
│ Sélection de la rédaction           │
│ [ image 2:1                     ]   │
│ (Réglementation) (Québec)           │
│ ▌Titre principal, 30 px             │
│ Chapô 18 px, trois lignes au plus   │
│ Prénom Nom · Il y a 3 h             │
│ [img] ▌Titre, carte horizontale     │
│ [img] ▌Titre, carte horizontale     │
│ … quatre cartes horizontales        │
├─────────────────────────────────────┤
│ Dernières actualités                │
│ (Fiscalité) · Hier à 17 h 17        │
│ ▌Titre de l'actualité…              │
│ (Réglementation) · Il y a 2 h       │
│ ▌Titre de l'actualité…              │
│ … vingt entrées sur une colonne     │
│ [ Toutes les actualités → ]         │
├─────────────────────────────────────┤
│ Réglementation (fond brand-900)     │
│ [img] ▌Titre, carte horizontale     │
│ … six cartes empilées               │
├─────────────────────────────────────┤
│ Fiscalité, Québec : même principe   │
├─────────────────────────────────────┤
│ À surveiller                        │
│ [30 sept.] Échéance fiscale         │
│ ▌Titre de l'échéance →              │
├─────────────────────────────────────┤
│ Dossiers, Les essentiels, Veille    │
│ officielle : sections empilées      │
│ dans l'ordre de homepage.json       │
├─────────────────────────────────────┤
│ Newsletter (bandeau brand-800)      │
│ [ courriel                      ]   │
│ [ S'abonner                     ]   │
│ ☐ Consentement…                     │
├─────────────────────────────────────┤
│ Pied de page : colonnes empilées,   │
│ formulaire newsletter compact       │
└─────────────────────────────────────┘

Tiroir (☰), plein écran depuis la droite :
┌─────────────────────────────────────┐
│ ▦ [NOM-DU-SITE]                   ✕ │
│ [ Rechercher…                   ]   │
│ ◧ Actualités                      ▾ │
│   Toute l'actualité, angle canadien │
│ ▤ Réglementation                  ▾ │
│   ACVM, AMF, CANAFE, OCRI…          │
│ ▣ Fiscalité                       ▾ │
│   Impôt, TPS et TVQ, déclarations   │
│   ├ Particuliers                    │
│   ├ Entreprises                     │
│   ├ DeFi et staking                 │
│   └ Traitements fiscaux             │
│ ▥ Dossiers                          │
│ … icône, libellé et description     │
├─────────────────────────────────────┤
│ ◐ Mode sombre         [ oui | non ] │
│ [ S'abonner à la newsletter     ]   │
└─────────────────────────────────────┘
```

Sur mobile, les sections suivent l'ordre de `homepage.json`, sans onglets ni carrousel : les grilles deviennent des piles de cartes `horizontal`.

### 12.3 Article, ordinateur

```
en-tête (voir 12.1)
Accueil › Réglementation › Titre abrégé                                       fil d'Ariane

8 colonnes (texte ≤ 720 px)                                     340 px
┌────────────────────────────────────────────────────────────┐  ┌────────────────────────┐
│ (Réglementation) (Mise à jour réglementaire)               │  │ [NOM-DU-SITE]          │
│ (Canada) (Québec)                                          │  │ Baseline, deux lignes  │
│                                                            │  ├────────────────────────┤
│ H1 Titre informatif de l'article, Manrope 800, 36 px       │  │ Sommaire (collant)     │
│                                                            │  │ 1 Contexte             │
│ Chapô en exergue, 24 px, slate-700, deux à quatre lignes   │  │ 2 Ce qui change      ◂ │
│                                                            │  │ 3 Obligations          │
│ 24 septembre 2026 à 15 h · Mis à jour le 25 septembre 2026 │  │ 4 Sources              │
│ 6 minutes de lecture · (av) Prénom Nom →                   │  └────────────────────────┘
│ ┌─ Bloc de confiance ────────────────────────────────────┐ │
│ │ ✓ Vérifié le 24 septembre 2026                         │ │
│ │ Cette information concerne : (Canada) (Québec)         │ │
│ │ Entrée en vigueur : 1er janvier 2027                   │ │
│ │ Révisé par : … · Correction du 25 septembre 2026 : …   │ │
│ └────────────────────────────────────────────────────────┘ │
│ [ couverture 2:1 ..................................... ]   │
│ Crédit : Nom, source →                                     │
│ (X) (in) (f) (WhatsApp) (Telegram) (courriel) (lien) (RSS) │
│ Signaler une erreur · Suggérer un sujet                    │
│ ┌─ L'essentiel ──────────────────────────────────────────┐ │
│ │ • Point 1    • Point 2    • Point 3                    │ │
│ └────────────────────────────────────────────────────────┘ │
│ H2 Contexte                                                │
│ Corps 18 px, interligne 1,6…                               │
│ ┃ Encadré « Ce qui change »                                │
│ ┃ TexteDeLoi (serif) · Version citée · Texte officiel →    │
│ ExempleChiffre : lignes, puis total sur fond or            │
│ …                                                          │
├────────────────────────────────────────────────────────────┤  ┌────────────────────────┐
│ Cette réglementation : (En vigueur) Autorité · Juridiction │  │ Sélection de la        │
│ · dates clés · Voir le dossier →                           │  │ rédaction (3)          │
│ Sources : ⌂ officielles d'abord · lien d'archive           │  ├────────────────────────┤
│ Textes, organismes et traitements liés                     │  │ Dossiers en vedette    │
│ Newsletter (inline)                                        │  ├────────────────────────┤
│ Avertissement (variante « reglementaire »)                 │  │ Newsletter compacte    │
│ Carte auteur                                               │  └────────────────────────┘
└────────────────────────────────────────────────────────────┘

Articles liés (même dossier, puis mêmes thèmes, puis même catégorie) : 6 cartes medium, 3 × 2
```

La barre latérale est coupée en deux zones :
- une zone haute (présentation et sommaire collant), le long du corps de l'article;
- une zone basse (sélection, dossiers, newsletter compacte), le long des blocs de fin.

Un sommaire collant ne peut pas cohabiter avec une pile de modules plus haute que l'écran (section 15).

### 12.4 Article, mobile

```
┌─────────────────────────────────────┐
│ ▦ [NOM-DU-SITE]               ⌕   ☰ │
├─────────────────────────────────────┤
│ Accueil › Réglementation            │
│ (Réglementation)                    │
│ (Mise à jour réglementaire)         │
│ (Canada) (Québec)                   │
│ H1 30 px, trois à cinq lignes       │
│ Chapô 20 px                         │
│ 24 septembre 2026 à 15 h            │
│ Mis à jour le 25 septembre 2026     │
│ 6 minutes de lecture                │
│ (av) Prénom Nom →                   │
│ ┌─ Bloc de confiance ─────────────┐ │
│ │ ✓ Vérifié le 24 septembre 2026  │ │
│ │ Concerne : (Canada) (Québec)    │ │
│ │ Entrée en vigueur :             │ │
│ │ 1er janvier 2027                │ │
│ └─────────────────────────────────┘ │
│ [ couverture pleine largeur     ]   │
│ Crédit : Nom, source →              │
│ (X) (in) (f) (WhatsApp) (Telegram)  │
│ (courriel) (lien) (RSS)             │
│ Signaler une erreur                 │
│ Suggérer un sujet                   │
│ ┌─ L'essentiel ───────────────────┐ │
│ │ • Point 1  • Point 2  • Point 3 │ │
│ └─────────────────────────────────┘ │
│ ▸ Sommaire (replié)                 │
│ Corps 17 px                         │
│ Tableaux : défilement horizontal    │
│ …                                   │
│ Cette réglementation                │
│ Sources                             │
│ Textes, organismes, traitements     │
│ Newsletter                          │
│ Avertissement                       │
│ Carte auteur                        │
│ Articles liés (liste compacte)      │
└─────────────────────────────────────┘
```

La barre de partage est la même que sur ordinateur, sur deux lignes : pas de partage natif du téléphone, pour garder une seule implémentation.

### 12.5 Hub de catégorie, ordinateur (ex. `/reglementation/`)

```
Accueil › Réglementation
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ H1 Réglementation (48 px)                                                              │
│ Description de la catégorie (tirée de la taxonomie), deux lignes                       │
│ [ Canada ] [ Québec ] [ Provinces ] [ International ] [ Dossiers → ] pastilles de lien │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌─ à la une (8 col.) ────────────────────────────────────┐  ┌─ 2 cartes small (4 col.) ──┐
│ ArticleCard large                                      │  │ ArticleCard small          │
│                                                        │  │                            │
│                                                        │  │ ArticleCard small          │
│                                                        │  │                            │
└────────────────────────────────────────────────────────┘  └────────────────────────────┘
┌─ Filtrer (formulaire simple, sans script) ─────────────────────────────────────────────┐
│ Thème [ Tous ▾ ]    Format [ Tous ▾ ]    Juridiction [ Toutes ▾ ]    [ Filtrer → ]     │
│ Mène à /recherche/ avec la catégorie et les filtres présélectionnés                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌─ grille de 3 colonnes (8 col.) ────────────────────────┐  ┌─ Barre latérale ───────────┐
│ [carte] [carte] [carte]                                │  │ Veille officielle          │
│ [carte] [carte] [carte]                                │  │ ● frise verticale,         │
│ [carte] [carte] [carte]                                │  │   6 entrées                │
│ [carte] [carte] [carte]                                │  ├────────────────────────────┤
│                                                        │  │ À surveiller               │
│ ‹ Précédente   1 2 3 … 12   Suivante ›                 │  ├────────────────────────────┤
└────────────────────────────────────────────────────────┘  │ Newsletter compacte        │
                                                            └────────────────────────────┘
```

Le hub reste une page statique paginée. Le formulaire de filtres mène à la page de recherche, qui affiche les résultats filtrés : le site n'a qu'un seul rendu de résultats dans le navigateur (ARCHITECTURE, section 10 et écart B20).

### 12.6 Hub de catégorie, mobile (375 px)

```
┌─────────────────────────────────────┐
│ ▦ [NOM-DU-SITE]               ⌕   ☰ │
├─────────────────────────────────────┤
│ Accueil › Réglementation            │
│ H1 Réglementation (30 px)           │
│ Description, trois lignes au plus   │
│ [ Canada ] [ Québec ] [ Provinces ] │ pastilles de lien,
│ [ International ] [ Dossiers → ]    │ retour à la ligne
│ ▸ Filtrer                           │ panneau repliable :
├─────────────────────────────────────┤ même formulaire
│ ArticleCard large (à la une)        │
│ [ image 2:1                     ]   │
│ ▌Titre, 24 px                       │
├─────────────────────────────────────┤
│ [img] ▌Titre, carte horizontale     │
│ [img] ▌Titre, carte horizontale     │
│ … douze cartes par page             │
│ ‹ Précédente   1 / 12   Suivante ›  │
├─────────────────────────────────────┤
│ Veille officielle (5 entrées)       │
│ À surveiller                        │
│ Newsletter compacte                 │
└─────────────────────────────────────┘
```

### 12.7 Fiche organisme, ordinateur (ex. `/organismes/amf/`)

```
Accueil › Organismes › AMF
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌───────┐  H1 Autorité des marchés financiers (AMF)                                    │
│ │ AMF   │  (Québec) (Régulateur des valeurs mobilières)                                │
│ └───────┘  Rôle en une phrase…    [ Site officiel ↗ ] [ Flux RSS ]                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌─ contenu (8 col.) ─────────────────────────────────────┐  ┌─ Fiche d'identité ─────────┐
│ Présentation (MDX) : mandat, pouvoirs, textes          │  │ Juridiction : Québec →     │
│                                                        │  │ Type : régulateur…         │
│ Dossiers liés                                          │  │ Site : lautorite.qc.ca ↗   │
│ (Consultation) Dossier… →   (En vigueur) Dossier… →    │  │ Vérifié le …               │
│                                                        │  ├────────────────────────────┤
│ Dernières décisions (textes de type décision)          │  │ À surveiller (agenda lié)  │
│ • 12 septembre 2026 · Décision n° … →                  │  ├────────────────────────────┤
│                                                        │  │ Veille de l'organisme      │
│ Textes de référence (tableau : type, titre, date)      │  │ ● frise (5 entrées)        │
│                                                        │  ├────────────────────────────┤
│ Derniers articles (3 cartes medium)                    │  │ Newsletter compacte        │
│ Guides (2 cartes horizontales)                         │  └────────────────────────────┘
│ Ressources (sources officielles)                       │
└────────────────────────────────────────────────────────┘
```

Le carré « AMF » est la vignette générée (acronyme en Manrope 800 sur grille bleue), jamais le logo officiel de l'organisme. Les listes vides ne s'affichent pas.

### 12.8 Fiche organisme, mobile (375 px)

```
┌─────────────────────────────────────┐
│ ▦ [NOM-DU-SITE]               ⌕   ☰ │
├─────────────────────────────────────┤
│ Accueil › Organismes › AMF          │
│ [AMF] H1 Autorité des marchés       │
│       financiers                    │
│ (Québec) (Régulateur)               │
│ Rôle en une phrase                  │
│ [ Site officiel ↗ ] [ RSS ]         │
│ ▸ Fiche d'identité (repliable)      │
│ Sur cette page : Présentation ·     │ sommaire d'ancres,
│ Dossiers · Décisions · Articles     │ sans onglets
├─────────────────────────────────────┤
│ Présentation                        │
│ Dossiers liés                       │
│ Dernières décisions                 │
│ Textes de référence                 │
│ Derniers articles                   │
│ Guides                              │
│ Ressources                          │
│ Veille de l'organisme               │
│ Newsletter compacte                 │
└─────────────────────────────────────┘
```

Les sections s'empilent sous un sommaire d'ancres, sans onglets, comme sur ordinateur.

---

## 13. Références visuelles : analyse image par image

**Corpus** :
- quatre captures de cryptoast.fr, toutes en mode sombre : l'accueil en trois parties et le hub des actualités;
- un PDF d'exemple d'article : une fiche consacrée à un service d'intelligence artificielle, imprimée le 25 septembre 2026 selon ses métadonnées, sur sept pages.

Ces fichiers ont été fournis avec la demande et ne figurent pas dans `docs/references/` : le dépôt était vide (question A1). Ils servent à la mise en page et à l'ambiance. Aucun logo, texte, illustration ni élément de marque n'est repris.

### 13.1 Image 1 : accueil, haut de page

- **Type de page** : page d'accueil, premier écran et demi.
- **Composants** :
  - en-tête : logo avec chevron, cinq entrées de navigation chacune dans une couleur différente, loupe, bascule soleil, avatar;
  - bannière publicitaire pleine largeur, étiquetée « Publicité »;
  - section « Sélection de la rédaction » : une grande carte à gauche sur environ 7/12, quatre cartes horizontales empilées à droite;
  - section « Les dernières actus » : pastille de lien « Toutes les actus crypto › » alignée sur le titre, grille de quatre colonnes de cartes illustrées.
- **Hiérarchie** : titres de section très grands et colorés; titres de cartes en gras blanc sur trois à quatre lignes; métadonnées minuscules en gris, auteur en italique.
- **Densité** : élevée, une douzaine d'articles sur un écran et demi.
- **Typographie** : sans-serif géométrique grasse pour les titres, petite sans-serif pour les métadonnées, icônes de calendrier et de personne devant la date et l'auteur.
- **Couleurs** : fond quasi noir, cartes gris très foncé, accents orange, violet, vert et rose; titres de section en dégradé orangé.
- **Traitement des images** : illustrations éditoriales maison d'un style unique (collage, papier, demi-teintes), ratio proche de 2:1, puce de catégorie posée sur l'image en bas à droite.
- **Navigation** : horizontale, sans sous-menu visible.
- **Ce que je retiens** :
  - le schéma « une grande carte et quatre horizontales » pour `hero-selection`;
  - le **filet vertical coloré à gauche du titre**, qui rejoint notre filet d'encadré;
  - la ligne de métadonnées à icônes et la puce posée sur l'image;
  - la pastille de lien « Tout voir » alignée sur le titre de section;
  - la cohérence d'un style d'image unique, que nous obtenons avec les couvertures générées.
- **Ce que j'écarte** :
  - la bannière publicitaire en tête, la navigation multicolore, les dégradés, l'orange, l'avatar de compte;
  - le mode sombre comme ambiance de référence;
  - la grille illustrée pour « Les dernières actus » : le brief demande une liste dense (D11).

### 13.2 Image 2 : accueil, milieu

- **Type de page** : suite de l'accueil.
- **Composants** :
  - deux blocs côte à côte dans des conteneurs arrondis : « Les articles les plus lus » (une carte à image, puis trois titres avec pastilles-flèches) et « Les derniers dossiers » (même structure);
  - « Les essentiels » : grille de 4 × 2 guides illustrés, titre sous l'image, sans carte;
  - « Nos avis » : grille de 4 × 2 cartes de plateformes commerciales;
  - « Les cryptos en bref » : deux cartes (valeur, variation en pastille rouge ou verte, courbe);
  - « Cryptos tendance » : rangée défilante de cartes d'actifs avec courbe.
- **Hiérarchie** : titres de section en dégradés variés; cartes de guides sans métadonnées.
- **Densité** : élevée, mais aérée par les blocs à deux colonnes.
- **Typographie** : identique à l'image 1; valeurs de marché en gras, avec le préfixe « $ ».
- **Couleurs** : fond quasi noir, pastilles de variation saturées, titres en dégradés.
- **Traitement des images** : illustrations 3D brillantes sur fonds pastel pour les guides; visuels de marque des plateformes pour les avis; vignettes à coins arrondis; courbes de marché sans axe; puce sur l'image seulement dans « plus lus » et « dossiers ».
- **Navigation** : pastille de lien « Cours des cryptos › ».
- **Ce que je retiens** :
  - le schéma « une carte principale et trois liens » pour `dossiers-strip`;
  - deux cartes sobres avec courbe pour `market-brief`.
- **Ce que j'écarte** :
  - la juxtaposition de deux sections en deux colonnes : bon usage de la largeur, mais elle casse l'ordre linéaire de `homepage.json` (idée notée pour la v2);
  - « Nos avis » (comparatifs commerciaux, remplacés par le bloc partenaire désactivé) et les illustrations 3D brillantes;
  - les montants en dollars américains préfixés (chez nous : « 84 568 $ CA »);
  - les variations signalées par la couleur seule (chez nous : flèche, signe et couleur).
- **Divergence** : les cartes « essentiels » n'affichent ni niveau ni durée, alors que le brief les décrit (« Facile », « 12 m »). Nous les affichons (D14).

### 13.3 Image 3 : accueil, bas de page et pied de page

- **Type de page** : fin de l'accueil.
- **Composants** :
  - trois rangées en carrousel horizontal coupées au bord droit (formations, analyses, vidéos), chacune avec une ou plusieurs pastilles de lien (« Toutes nos formations », « Youtube », « Spotify »);
  - pied de page : logo, copyright, badges App Store et Google Play, colonnes « À propos » et « Mentions légales », réseaux sociaux en icônes rondes.
- **Hiérarchie** : titres de section colorés, titres de cartes sous l'image.
- **Densité** : moyenne.
- **Typographie** : identique aux images 1 et 2; titres de cartes en gras sur deux à quatre lignes, sans métadonnées; liens du pied de page en petite graisse normale.
- **Couleurs** : fond quasi noir; un dégradé différent par titre de rangée (orangé, vert, violet); pastilles à contour coloré; pied de page gris très foncé; icônes sociales blanches.
- **Traitement des images** : les **fiches crypto partagent un gabarit graphique commun** (fond blanc, pointillés, sigle de l'actif, logo sur une vague colorée); les vignettes vidéo sont des miniatures YouTube chargées d'emblée.
- **Navigation** : pastilles de lien à droite des titres; défilement horizontal des rangées; liens du pied de page en colonnes.
- **Ce que je retiens** :
  - le **gabarit commun des fiches**, transposé en couverture générée pour les organismes, textes et juridictions (acronyme sur grille bleue);
  - plusieurs pastilles de lien secondaires après un titre de section;
  - un pied de page simple en colonnes.
- **Ce que j'écarte** :
  - les carrousels, sur ordinateur comme sur mobile : contenu masqué et navigation au clavier pénible (D5);
  - les badges d'application (pas d'application en v1);
  - les vidéos à l'accueil (le bloc `Video` existe dans les articles).

### 13.4 Image 4 : hub « Actu de la crypto »

- **Type de page** : hub de catégorie.
- **Composants** :
  - titre de page suivi de pastilles de sous-rubriques;
  - grille de trois colonnes de cartes (image, puce, métadonnées « Par Auteur - Hier à 21h11 », titre);
  - colonne droite « Live » : frise verticale avec un point par entrée (le plus récent en couleur), chaque entrée étant une carte avec une date relative (« Il y a 1h »), un émoji ou un drapeau et un texte court.
- **Hiérarchie** : la frise se lit indépendamment de la grille; les dates relatives dominent.
- **Densité** : très élevée, une quinzaine d'articles et neuf brèves.
- **Typographie** : grand titre de page en sans-serif très grasse, colorée; titres de cartes en gras sur deux à quatre lignes; métadonnées en petit gris avec icône; brèves en graisse moyenne, précédées d'un émoji.
- **Couleurs** : identiques aux autres captures; point orange pour la brève la plus récente.
- **Traitement des images** : mêmes illustrations maison qu'à l'image 1, ratio proche de 2:1, puce en bas à droite; aucune image dans la frise.
- **Navigation** : pastilles de sous-rubriques sous le titre.
- **Ce que je retiens** :
  - la **frise latérale datée**, transposée en **veille officielle** : barre latérale des hubs, et section `veille-latest` à l'accueil (organisme émetteur, titre, date, lien sortant);
  - le même composant `Timeline` pour les chronologies de dossiers et l'agenda;
  - les pastilles de sous-rubriques, qui deviennent des liens vers les juridictions et les thèmes.
- **Ce que j'écarte** : les émojis et drapeaux (remplacés par `JurisdictionBadge` et le nom de l'organisme), le terme « Live » (nous ne sommes pas un fil d'information en continu), le format horaire « 21h11 » (chez nous « 21 h 11 »).
- **Point de vigilance** : les entrées de veille sont des publications officielles externes, pas du contenu éditorial. Elles doivent être étiquetées comme telles, avec la source et un lien sortant.

### 13.5 Document 5 : PDF d'exemple d'article (fiche)

- **Type de page** : article long de type fiche, capture de navigateur en largeur réduite, mode sombre.
- **Composants, dans l'ordre** :
  1. bannière publicitaire; fil d'Ariane; H1 long; chapô;
  2. dates de publication et de mise à jour avec icônes, auteur avec avatar aligné à droite;
  3. couverture;
  4. rangée d'actions : « Ajoutez-nous à vos favoris » (vers Google), « Partager cet article », « Donner mon avis »;
  5. sommaire numéroté repliable (« masquer »);
  6. H2 et H3, listes à puces colorées, images légendées en italique;
  7. renvoi interne précédé d'un émoji;
  8. bouton affilié suivi de « Publicité - Investir comporte des risques (en savoir plus) »;
  9. widget de note par étoiles; second renvoi interne;
  10. bloc newsletter : surtitre, titre, promesse chiffrée, champ, bouton, case de consentement avec lien vers la politique de confidentialité;
  11. carte auteur : avatar, nombre d'articles, réseaux, bio;
  12. commentaires; « AVERTISSEMENT »; « D'autres articles sur [étiquette] »; pied de page.
- **Hiérarchie** : H1 sur trois lignes, chapô, sommaire numéroté, H2 et H3 nettement différenciés.
- **Densité** : faible; une seule colonne, sans barre latérale à cette largeur.
- **Typographie et dates** : titres en sans-serif grasse; mois avec majuscule (« 13 Mai 2026 »); « mail » au lieu de « courriel »; espace avant le point d'interrogation (usage de France).
- **Couleurs** : fond quasi noir; liens, puces de liste et numéros du sommaire orangés; bouton d'inscription jaune; bouton affilié violet; étoiles jaunes.
- **Traitement des images** : couverture sur le gabarit commun des fiches; captures d'écran du produit dans le corps; légendes centrées en italique; aucun crédit (D12).
- **Navigation** : en-tête mobile (menu à gauche, logo centré, loupe et avatar à droite); fil d'Ariane; sommaire à ancres repliable; renvois internes précédés d'une main pointée.
- **Constat majeur** : une **fenêtre publicitaire superposée** (slide-in avec bouton de fermeture) recouvre le texte des pages 2 à 7 de l'impression. C'est exactement ce que le brief interdit.
- **Ce que je retiens** :
  - l'ordre général, qui confirme le gabarit du point 7.2 du brief;
  - les dates de publication **et** de mise à jour visibles côte à côte;
  - le sommaire repliable en tête sur mobile;
  - la case de consentement explicite, liée à la politique;
  - la carte auteur avec compteur d'articles;
  - la section « D'autres articles sur [étiquette] »;
  - la mention « Publicité » accolée au lien commercial.
- **Ce que j'écarte** : slide-in et bannière publicitaires, étoiles, commentaires, « Donner mon avis », émojis, majuscule aux mois, espace avant «? », bouton de partage unique (D13).
- **Idée à étudier (v2)** : le bouton « Ajoutez-nous à vos favoris » renvoie à la fonction de sources privilégiées de Google. Elle pourrait devenir un lien configurable dans `site.json`. Non vérifiée pour le Canada.

### 13.6 Compléments sur cryptoast.fr (sources indirectes)

L'accès direct à cryptoast.fr était bloqué le 25 septembre 2026 par la politique réseau de l'environnement de travail. Les constats ci-dessous viennent :
- d'une copie HTML complète d'un article de janvier 2023 et d'une capture en Markdown d'un article d'avril 2026, archivées par des tiers sur GitHub;
- d'extraits de moteur de recherche.

Ils sont datés et **à revérifier** depuis un accès complet (ARCHITECTURE, section 26.3). Le menu et la recherche de 2026 n'ont pas pu être vus.

**Principes à reprendre** :
- **Adresses** : articles à plat en `/{slug}/`, sans catégorie dans l'URL; la catégorie n'apparaît que dans le fil d'Ariane et les données structurées. C'est ce qui permet de reclasser un article sans redirection, d'où l'option C d'ARCHITECTURE, section 8.
- **Menu mobile** : un sous-titre sous chaque entrée (instantané de 2023), ce que reprend notre tiroir.
- **Recherche instantanée** : résultats groupés par type (prix, guides, fiches, actualités) avec « Aucun résultat trouvé » (2023), ce que reprend `SearchModal`.
- **Gabarit d'article** :
  - fil d'Ariane balisé `BreadcrumbList`; date et heure (« le 6 janvier 2023 à 17:30 »); « 2 minutes de lecture »;
  - partage vers X, Facebook, LinkedIn, WhatsApp, Telegram et copie du lien, avec le retour « Copié »;
  - ligne « Source : » en italique en fin d'article, remplacée chez nous par un bloc de sources structuré;
  - carte auteur avec nombre d'articles, doublée d'une entité `Person`; bloc « D'autres articles sur {étiquette} »;
  - données `NewsArticle` avec `articleSection`.
- **Guides** : classés par difficulté (facile, moyen, difficile) avec un temps de lecture; le libellé exact des cartes n'a pas pu être vu.
- **Transparence** : pages `/transparence/` et `/situation-financiere/`, d'où notre proposition de page « Déclaration d'intérêts » (ARCHITECTURE, section 7.14).
- **Newsletter** : passée d'un récapitulatif hebdomadaire (2023) à une lettre quotidienne (2026), ce qui suppose une équipe. Pour un auteur seul, le rythme hebdomadaire reste recommandé (question 12).
- **Mode sombre** : thème mémorisé avec repli sur la préférence du système, et deux balises `theme-color` (claire et sombre).

**Défauts à ne pas reproduire** : attribut `lang="en"` sur un site en français, pages AMP, pop-ups, notifications push, commentaires, cartes d'affiliation au milieu du texte, nombreux scripts tiers (jQuery, Bootstrap, Swiper, gestionnaire de balises).

**Point de vigilance juridique** : les avertissements de Cryptoast citent l'AMF française. Au Québec, l'Autorité des marchés financiers porte le même sigle dans un cadre différent. Aucun de ces textes n'est repris ni adapté : nos avertissements sont rédigés par l'auteur, avec le marqueur [À VALIDER PAR L'AUTEUR].

---

## 14. Divergences entre les références et le brief

Conformément à la consigne, je signale ces écarts sans trancher à la place de l'auteur. Pour chacun, le brief s'applique par défaut, sauf réponse contraire.

| # | Ce que montrent les références | Ce que dit le brief | Application par défaut |
|---|---|---|---|
| D1 | Toutes les captures sont en mode sombre. Le thème par défaut de Cryptoast n'y est pas visible; selon les sources indirectes (section 13.6), il suivrait la préférence du système | Le clair prime; le sombre ne passe jamais avant la lisibilité du clair | Premier affichage selon la préférence du système, clair en l'absence de préférence, choix mémorisé ensuite; toutes les décisions de DA se prennent en clair |
| D2 | Navigation multicolore, dégradés orange, rose et violet | Bleu roi, aucun dégradé agressif, pas d'orange | Bleu roi seul; couleur de catégorie limitée au filet et à la puce |
| D3 | Bannière publicitaire en tête, slide-in qui recouvre l'article | Ni pop-up, ni slide-in, ni publicité intrusive | Aucune bannière; `PartnerBlock` désactivé et toujours signalé |
| D4 | Avatar et espace membre à droite de l'en-tête | Espace membre exclu en v1 | Bouton « S'abonner » à la place |
| D5 | Carrousels horizontaux | Non mentionnés; densité et accessibilité exigées | Aucun carrousel : grilles sur ordinateur, cartes empilées sur mobile |
| D6 | Notes par étoiles, commentaires, « Donner mon avis » | Gamification et commentaires exclus en v1 | Absents; liens « Signaler une erreur » et « Suggérer un sujet » à la place |
| D7 | Badges App Store et Google Play | Pas d'application mobile | Absents |
| D8 | « Hier à 21h11 », « 13 Mai 2026 », « $84 568 », « mail » | Conventions québécoises, « $ CA » après le nombre, « courriel » | Utilitaires de formatage centralisés |
| D9 | Section « Nos avis » (comparatifs de plateformes) | Blocs partenaires désactivés par défaut et toujours signalés | Pas de section d'avis en v1 |
| D10 | « Live » avec émojis et drapeaux | Ton institutionnel | « Veille officielle », organisme émetteur, puce de juridiction |
| D11 | « Les dernières actus » en grille de cartes illustrées (image 1) | Liste dense d'une vingtaine d'articles (2.1) | Liste (`layout: list`); la grille reste possible par `layout: grid` |
| D12 | Couverture sans crédit (document 5) | Crédit d'image obligatoire (2.1 et 9) | Crédit sous chaque couverture, validation bloquante |
| D13 | Un seul bouton « Partager cet article » (document 5) | Barre de partage détaillée (2.1 et 7.2) | Barre complète, sur ordinateur comme sur mobile |
| D14 | Guides sans niveau ni durée (image 2) | « Facile », « 12 m » (2.1 et 2.2) | Niveau et durée affichés (« Facile · 12 min ») |

Aucune de ces divergences ne me semble justifier de s'écarter du brief. Les choix de mise en page que j'ajoute au brief, ou qui s'en écartent, sont listés en section 15 et restent à confirmer.

---

## 15. Points de DA ouverts

Chaque point a une valeur par défaut, appliquée sauf réponse contraire (question A4 de `docs/QUESTIONS.md`).

| # | Point | Proposition par défaut | Origine |
|---|---|---|---|
| 1 | Serif pour les citations juridiques (Source Serif 4) | oui, désactivable dans `theme.json` | ajout (le brief autorise une serif légère) |
| 2 | Corps d'article à 17 px sur mobile, hors échelle | oui (autres choix : 16 ou 18 px) | ajout |
| 3 | Navigation d'en-tête : « Accueil » retiré (le logo y mène), « Newsletter » transformé en bouton « S'abonner », pour faire tenir six entrées, la recherche et la bascule de thème sur 1240 px | oui; tout reste modifiable dans `navigation.json` | écart à l'exemple du point 7.4 |
| 4 | Pictogramme temporaire (carré de grille avec une case pleine) en attendant un vrai logo | oui (question 10) | ajout |
| 5 | En-tête à 56 px sous 768 px | oui | écart au point 3.3 (64 px) |
| 6 | Barre latérale d'article en deux zones (section 12.3) | oui : c'est ce qui permet un sommaire collant | ajout |
| 7 | Filet de catégorie à gauche des titres de cartes (image 1) | oui | ajout tiré des références |
| 8 | Colonne latérale (veille officielle ou agenda) à droite de la liste « Dernières actualités » de l'accueil | **non en v1** : sections empilées | ajout tiré de l'image 4, reporté |
| 9 | Polices choisies dans une liste préinstallée (Manrope, Inter, Source Serif 4) | oui | écart au point 4 (ARCHITECTURE, écart B18) |
| 10 | Composant `Tabs` de l'inventaire du brief : aucun gabarit de la v1 n'en a besoin (fiches en sections avec sommaire d'ancres) | livré seulement quand un gabarit en aura besoin | écart au point 3.3 |
| 11 | Accent or | activé, limité aux deux usages du brief (question 7) | brief |
