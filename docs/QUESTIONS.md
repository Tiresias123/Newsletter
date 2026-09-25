# Questions de fin de phase 0

> Rédigé le 25 septembre 2026. Les 17 questions du point 13 du brief, chacune avec ma recommandation par défaut, pour que tu puisses répondre par oui ou par non.
> Format de réponse suggéré : « 1 oui, 2 oui, 3 non : Vercel, … ».
> **Sans réponse sur un point réversible, la recommandation s'applique. Les points marqués [irréversible], ou qui engagent un coût, attendent ta réponse explicite avant la phase 1.**
> Les décisions irréversibles sont celles de la section 20 d'ARCHITECTURE. Les faits marqués « (s) » viennent d'extraits de moteur de recherche non recoupés : ils sont à confirmer avant tout engagement.

---

## Réponses de l'auteur (25 septembre 2026)

> « Oui tu peux continuer, fais les choix que tu estimes les plus judicieux, et éventuellement Brevo ou toute solution gratuite dans un premier temps. »

- **Toutes les recommandations par défaut sont retenues**, y compris les points marqués [irréversible] : famille A (question 2), Cloudflare Workers (3), option d'URL C `/articles/[slug]/` (6), dépôt privé (14).
- **Newsletter (4)** : Brevo, forfait gratuit, au lancement. Le lieu des données, le plafond du forfait gratuit et l'interface en français seront vérifiés en phase 4, avant l'ouverture du compte. Si l'un de ces points ne convient pas, l'abstraction `NewsletterProvider` permet de passer à une autre solution gratuite sans toucher au reste du site.
- **Autres réponses par défaut** : anglais en v3 (5), or activé (7), ticker livré mais désactivé (8), aucune monétisation en v1 (9), mot-symbole temporaire (10), LinkedIn, X et RSS (11), 2 à 4 articles et une newsletter par semaine (12), Umami Cloud (13), catégories « Analyses » et « Opinion » créées mais absentes du menu (16), tableau statique des traitements fiscaux (17).
- **Points annexes** : brief et références ajoutés au dépôt (A1), Keystatic en mode local (A2), habillage de Keystatic en anglais (A3), les dix choix de direction artistique par défaut (A4), « infolettre » dans les libellés visibles (A5).
- **Restent à fournir avant la phase 4** : le nom du site et le domaine (1), les URL des comptes sociaux (11), le nom et le titre du responsable de la protection des renseignements personnels (15).

---

### 1. Nom du site et nom de domaine **[irréversible]**

**Recommandation** : garder le jeton `[NOM-DU-SITE]` pendant les phases 1 à 3 (il est centralisé dans `config/site.json`) et arrêter le nom et le domaine avant la phase 4, parce que l'adresse d'envoi de la newsletter et les images de partage en dépendent.

- Domaine en `.ca`, réservé dès que le nom est choisi, après avoir vérifié la disponibilité du `.com` et des comptes sociaux.
- Critères : court, prononçable en français et en anglais, sans le mot « crypto » seul (trop connoté), sans marque concurrente déposée.

**Oui ou non?** Si tu as déjà un nom, donne-le.

### 2. Contributeurs, relecture, publication à l'heure près (décisif entre A et B) **[irréversible]**

Le choix de famille est coûteux à défaire : une migration est possible, mais c'est un projet à part entière (ARCHITECTURE, sections 20 et 23).

**Recommandation** : **famille A**, si tu confirmes les trois points suivants pour les douze prochains mois :
- a) tu restes seul auteur, ou tu as au plus un contributeur occasionnel, sans rôles distincts;
- b) pas de relecteur obligatoire avant publication;
- c) une publication programmée peut paraître avec une vingtaine de minutes de décalage au pire (une dizaine en moyenne), sans garantie écrite de Cloudflare; la latence réelle sera mesurée en phase 4.

Si l'un des trois est faux dès la v1, la famille B (Next.js et Payload) devient raisonnable, avec un coût et une charge d'exploitation plus élevés (ARCHITECTURE, sections 3 et 18). **Oui à a, b et c?**

### 3. Hébergeur **[irréversible pour la délégation du DNS]**

**Recommandation** : **Cloudflare Workers**, forfait gratuit (0 $). C'est ce que recommandent la documentation de Cloudflare pour tout nouveau projet et le guide de déploiement d'Astro (note ajoutée en mai 2025); depuis mars 2026, l'adaptateur Astro ne prend plus en charge que Workers. Il offre :
- des pages statiques servies gratuitement et sans limite;
- 3 000 minutes de build par mois;
- des aperçus par branche;
- des tâches planifiées, plus ponctuelles que celles de GitHub mais sans garantie écrite, qui portent la publication programmée;
- Turnstile (anti-pourriel) et une mesure d'audience, gratuits.

**Conséquences à accepter** :
- **Les serveurs de noms du domaine doivent être gérés par Cloudflare.** Le domaine peut être acheté chez un registraire canadien, mais son DNS est délégué à Cloudflare.
- **Les journaux techniques de Cloudflare** (adresse IP, navigateur) sont traités dans ses centres de données du monde entier. Aucune offre ne permet de les garder au Canada : l'offre Entreprise permet seulement de choisir l'UE ou les États-Unis. C'est à mentionner dans la politique de confidentialité.

**Écartés** :
- Vercel gratuit : usage commercial interdit (s), tâches planifiées une fois par jour (s);
- Netlify gratuit : environ 20 déploiements de production par mois, puis mise en pause des sites (s).

**Oui?**

### 4. Fournisseur de newsletter et lieu d'hébergement des données **[irréversible]**

**Recommandation** : **Brevo**, sous réserve de confirmer trois points non recoupés avant tout engagement : le lieu des données, le plafond du forfait gratuit et l'interface en français.
- **Données** : dans l'UE (France et Allemagne, sauvegardes en Belgique), selon l'aide de Brevo (s).
- **Consentement** : double opt-in natif par API, avec les attributs de preuve de consentement (vérifié dans le SDK officiel).
- **Interface** : en français, présumée (entreprise française), non vérifiée.
- **Coût** : nul tant que la liste compte moins de 300 abonnés (forfait gratuit plafonné à 300 envois par jour (s)), puis environ 9 $ US par mois au forfait d'entrée (s). Tarif à revérifier le jour du choix.
- **Formulaire de contact** : Brevo pourrait aussi en envoyer les courriels, ce qui éviterait un fournisseur de plus. Ce point n'a pas été vérifié, ni le partage éventuel du plafond de 300 envois par jour. À défaut, Resend, comme le prévoit le brief.

**Alternative** : **Cyberimpact**, avec des données à Montréal (s), si tu veux éviter toute communication de la liste d'abonnés hors du Québec et profiter de champs LCAP natifs (consentement exprès ou tacite, expiration, preuve automatique) (s). Il coûte environ 39 $ CA par mois dès le départ (38,59 $ CA (s)), l'API n'étant incluse qu'à partir du forfait Plus. Sa documentation d'API n'a pas pu être lue.

La qualification Loi 25 et LCAP des deux options t'appartient. Un changement ultérieur reste possible, au prix d'une migration de la liste et des preuves de consentement (ARCHITECTURE, section 11.3). **Brevo, oui? Sinon, Cyberimpact?**

### 5. Version anglaise : jamais, plus tard, ou dès la v1

**Recommandation** : **plus tard (v3)**, avec tout le nécessaire prévu dès la v1 : chaînes d'interface par langue, routage avec le français à la racine et `/en/` réservé, champ `translationKey`, formatage selon la langue, balises `hreflang`. Coût en v1 : quasi nul. Coût évité : une migration d'URL plus tard. **Oui?**

### 6. Architecture des URL : option A ou B **[irréversible]**

**Recommandation** : **ni A ni B, mais une option C** : `/articles/[slug]/` pour tous les articles, le reste du tableau de routes du brief étant inchangé (`/dossiers/[slug]/`, `/guides/[slug]/`, `/fiscalite/traitements/[slug]/`, hubs `/reglementation/`, `/fiscalite/`…).
- L'adresse d'un article ne dépend alors d'aucun classement : tu peux changer sa catégorie ou son format sans jamais casser un lien. C'est décisif pour un média que des juristes citeront dans des avis et des courriels.
- La catégorie reste visible dans le fil d'Ariane, que Google affiche dans ses résultats.

Si tu veux rester dans les options du brief : **A** (`/[categorie]/[slug]/`), avec des redirections automatiques et un contrôle des URL disparues à chaque build. **B** est à écarter : elle contredit le tableau de routes du brief et met dans l'URL la juridiction, trop changeante (ARCHITECTURE, section 8). **C, oui? Sinon A?**

### 7. Accent or activé ou palette strictement bleue

**Recommandation** : **or activé**, limité à ses deux usages du brief : le total des exemples chiffrés et les puces d'échéance fiscale de l'agenda. Il rend les échéances repérables d'un coup d'œil.
- L'or vif (gold-500 et gold-600) n'est jamais employé en texte, faute de contraste suffisant.
- Seul un or foncé ajouté, gold-700, sert au texte des puces d'échéance (5,33:1 sur blanc, 4,84:1 sur gold-100; DA, sections 3.2 et 4).
- Le désactiver est un booléen dans `theme.json` : tout repasse en bleu, sans modification de composant.

**Oui?**

### 8. Ticker de marché au lancement

**Recommandation** : **désactivé au lancement**, livré et prêt, activable dans `ticker.json`. Trois raisons :
- un bandeau de cours en tête de page tire l'identité vers le « média crypto de marché » plutôt que vers la revue réglementaire;
- il ajoute une dépendance externe (clé d'API, quotas, attribution obligatoire), même si les cours ne sont récupérés qu'au build;
- le forfait gratuit de CoinGecko **n'autoriserait pas l'usage commercial** (s). Si le site est un jour monétisé, il faudra le forfait payant (environ 35 $ US par mois (s)) ou retirer le module.

La section d'accueil « Les cryptos en bref » (`market-brief`), en dollars canadiens et moins envahissante, peut être activée seule si tu veux un repère de marché; la même réserve de licence s'applique. **Oui?**

### 9. Monétisation : aucune, commanditaires, abonnement premium plus tard

**Recommandation** : **aucune en v1**, et **commanditaires de la newsletter en v2** si l'audience le justifie : c'est le format le moins intrusif et le plus compatible avec un ton institutionnel.
- Tout est prévu : `ads.json`, `PartnerBlock` désactivé, champ `sponsor` des numéros, page transparence.
- Pas d'affiliation vers des plateformes de négociation, qui heurterait la crédibilité d'un média de conformité.
- Un abonnement premium relève de la famille B (comptes utilisateurs).

**Oui?**

### 10. Logo existant ou mot-symbole temporaire

**Recommandation** : **mot-symbole temporaire** (nom en Manrope 800 bleu roi et pictogramme de grille, DA section 7), puis un vrai logo SVG référencé dans `site.json` quand le nom sera arrêté. Le favicon et les images de partage suivent automatiquement. **Oui?** Si tu as un logo, envoie-le en SVG.

### 11. Comptes de réseaux sociaux à afficher

**Recommandation** : **LinkedIn et X** au lancement, plus le **flux RSS**, qui compte pour un public de juristes et de journalistes. Aucun compte n'est affiché tant qu'il n'est pas actif. La liste vit dans `site.json` : ajouter Bluesky, Mastodon ou YouTube plus tard ne demande pas de code. **Oui?** Indique les URL si les comptes existent.

### 12. Fréquence de publication envisagée

**Recommandation** : je retiens **2 à 4 articles par semaine** et **une newsletter hebdomadaire**. Cela dimensionne la reconstruction planifiée du site et le budget de builds (ARCHITECTURE, sections 15.3 et 15.5), le script `newsletter:draft` (un numéro par semaine) et la section « Dernières actualités » (20 éléments). **Oui?** Sinon, donne ta fréquence réaliste.

### 13. Analytique : Plausible, Umami ou aucune

**Recommandation** : **Umami Cloud**, forfait gratuit, région UE.
- Sans témoin, donc sans bandeau de consentement.
- C'est le seul outil gratuit qui mesure les événements prévus par le brief (inscription à la newsletter, recherche, clic sortant) et qui offre une API pour brancher « Les plus lus » en v2. L'accès à l'API sur le forfait gratuit reste à confirmer.
- **Quota** : environ 100 000 événements par mois (s). Chaque page vue et chaque propriété d'événement comptant pour un événement, il couvre environ 1 000 visiteurs par jour au plus (hypothèses d'ARCHITECTURE, section 18).
- **Au-delà**, deux voies : Umami Pro (20 $ US par mois (s)) ou Cloudflare Web Analytics (gratuit et illimité, mais sans événements).

Plausible est excellent mais payant : environ 9 $ US par mois (s), et environ 19 $ US pour l'API nécessaire aux « plus lus » (s). « Aucune » se défend aussi pour un lancement sobre, mais tu perdrais la mesure de ce qui fonctionne. **Oui à Umami?**

### 14. Dépôt GitHub existant ou à créer **[irréversible pour la visibilité de l'historique]**

**Recommandation** : utiliser le dépôt existant `Tiresias123/Newsletter` (ce dépôt), et le **garder privé**. Il l'est (vérifié le 25 septembre 2026).
- Un dépôt public exposerait pour toujours l'historique complet : brouillons, notes, anciennes versions d'articles juridiques.
- Le renommer quand le nom du site sera arrêté ne casse rien : GitHub redirige.
- Hébergement, Keystatic et GitHub Actions fonctionnent avec un dépôt privé; seul le quota gratuit de minutes GitHub Actions s'applique (ARCHITECTURE, section 15).

**Oui?**

### 15. Coordonnées du responsable de la protection des renseignements personnels

**Recommandation** : toi, en tant qu'exploitant du site, avec une **adresse courriel dédiée** sur le domaine du site (par exemple `confidentialite@…`) plutôt que ton adresse personnelle. Je prévois le champ dans `legal.json`, avec le marqueur `[À COMPLÉTER PAR L'AUTEUR]` : nom, titre, courriel. Je n'écris pas le texte légal; c'est toi qui le valides. **Oui?** Donne le nom et le titre à afficher.

### 16. Sections « Analyses » et « Opinion » dès la v1 ou plus tard

**Recommandation** : **catégories et formats créés dès la v1**, absents du menu et de l'accueil au lancement.
- Tu les ajoutes toi-même au menu et à l'accueil (case `enabled` dans `navigation.json` et `homepage.json`) quand tu le juges utile.
- Aucun affichage automatique selon le nombre de contenus : seul le `noindex` des pages trop pauvres reste automatique.
- Les formats `analyse` et `opinion` servent dès la v1 à typer correctement les contenus (schema.org et avertissement d'opinion).

Aucun coût, aucune rubrique vide visible. **Oui?**

### 17. Matrice des traitements fiscaux : structure seule ou tableau filtrable dès la v1

**Recommandation** : **structure et tableau statique dès la v1, sans filtres interactifs**. La page `/fiscalite/traitements/` présente un tableau HTML complet, trié par juridiction, type de contribuable et activité : lisible sans JavaScript, imprimable et indexable. L'avertissement fiscal s'affiche toujours. Les filtres s'ajoutent quand la matrice dépasse une trentaine de fiches, en une session de travail (ARCHITECTURE, section 7.7). **Oui?**

---

## Points annexes (hors liste du brief)

Ces points ne font pas partie des 17 questions, mais ils conditionnent la phase 1. Une réponse courte suffit.

### A1. Brief et références absents du dépôt

Le dépôt était vide : `docs/BRIEF.md` et `docs/references/` n'existaient pas. J'ai travaillé à partir des fichiers joints à ta demande (brief v2, quatre captures, PDF d'exemple).

**Recommandation** : les ajouter au dépôt dans le premier commit de la phase 1 (brief dans `docs/BRIEF.md`, captures dans `docs/references/`), pour que les sessions futures y aient accès. Les captures de Cryptoast resteraient dans un dépôt privé, à titre de référence interne. **Oui?**

### A2. Éditeur en ligne (mode GitHub de Keystatic)

**Recommandation** : **mode local au lancement**. Keystatic tourne alors sur ton ordinateur et offre le meilleur aperçu. Le mode GitHub sur `/keystatic`, prévu par le brief, reste documenté et prêt à activer en fin de phase 3, si tu confirmes avoir besoin d'éditer ailleurs que sur ton ordinateur. Son activation demande une GitHub App, trois secrets et deux routes serveur (ARCHITECTURE, section 4.2). **Oui?**

### A3. Interface de Keystatic

Les libellés de tous les champs seront en français. En revanche, l'habillage de l'outil (boutons, menus et messages propres à Keystatic, comme « Save », « Delete », « Branch ») restera en partie en anglais : la traduction française officielle ne couvre que 27 chaînes et en traduit mal certaines (« branche » rendue par « succursale »).

**Recommandation** : habillage en anglais, tout le reste en français. **Oui?**

### A4. Choix de direction artistique à confirmer (DA, section 15)

Chaque point a une valeur par défaut, appliquée sauf réponse contraire :

1. Police serif (Source Serif 4) pour les citations de textes de loi : **oui**.
2. Corps des articles à 17 px sur mobile (valeur hors de l'échelle du brief) : **oui**.
3. Menu sans « Accueil » (le logo y mène) et avec un bouton « S'abonner » à la place de l'entrée « Newsletter » : **oui**.
4. Pictogramme temporaire en attendant un logo : **oui**.
5. En-tête de 56 px sur mobile au lieu de 64 px : **oui**.
6. Barre latérale d'article en deux zones, pour que le sommaire reste visible pendant la lecture : **oui**.
7. Trait de couleur de la catégorie à gauche des titres de cartes : **oui**.
8. Colonne latérale (veille officielle ou agenda) à droite de la liste « Dernières actualités » de l'accueil : **non en v1**.
9. Polices choisies dans une liste préinstallée; en ajouter une autre demande Claude Code : **oui**.
10. Composant d'onglets livré seulement quand une page en aura besoin : **oui**.

**Oui aux dix valeurs par défaut?**

### A5. « Newsletter » ou « infolettre » dans l'interface publique

Le brief emploie « newsletter »; l'Office québécois de la langue française recommande « infolettre ».

**Recommandation** : « infolettre » dans les libellés visibles (menu, boutons, formulaires, courriels). Les noms techniques (`newsletter.json`, route `/newsletter/`) restent inchangés, ce qui n'engage rien : une chaîne de `fr.json` à modifier. Les documents de travail gardent « newsletter », le terme du brief. **Oui?**
