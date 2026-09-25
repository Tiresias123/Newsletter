// Contrôle des blocs d'un corps MDX contre leur contrat (content/blocks.ts) : nom connu, propriétés permises
// et obligatoires, valeurs et formes, références, contenu attendu, blocs de page hors des pages.
import { BLOCKS, findBlocks } from '../content/blocks.ts';
import { findMarkers } from './markers.ts';

type Target = 'lexique' | 'dossiers' | 'auteurs';

export type BlockResolvers = {
  // « hidden » : le contenu existe mais n'est pas publié (le lien ou l'infobulle ne s'affichera pas).
  state: (collection: Target, id: string) => 'visible' | 'hidden' | 'missing';
  partner: (id: string) => boolean;
  // Chemin relatif à content/images/.
  image: (src: string) => boolean;
};

// « warning » : le rendu reste correct, mais le point mérite l'attention de l'auteur.
export type BlockProblem = { line: number; message: string; warning?: boolean };

const TARGETS: Record<Target, string> = { lexique: 'le lexique', dossiers: 'les dossiers', auteurs: 'les auteurs' };

export function checkBlocks(body: string, resolve: BlockResolvers, options: { isPage?: boolean } = {}): BlockProblem[] {
  const problems: BlockProblem[] = [];
  for (const use of findBlocks(body)) {
    const add = (message: string, warning = false) => problems.push({ line: use.line, message: `bloc ${use.name} : ${message}`, warning });
    const spec = BLOCKS[use.name];
    if (!spec) {
      add(`bloc inconnu. Blocs possibles : ${Object.keys(BLOCKS).join(', ')}.`);
      continue;
    }
    if (spec.pageOnly && !options.isPage) add('bloc de page, réservé aux pages statiques (content/pages/).');
    const allowed = Object.keys(spec.props);
    for (const [prop, value] of Object.entries(use.props)) {
      const rule = spec.props[prop];
      if (!rule) {
        add(`propriété « ${prop} » inconnue. Propriétés possibles : ${allowed.join(', ') || 'aucune'}.`);
        continue;
      }
      if (typeof value !== 'string') continue;
      if (rule.expression) add(`« ${prop} » attend une liste entre accolades, par exemple ${prop}={[…]}.`);
      else if (rule.values && !rule.values.includes(value)) add(`valeur « ${value} » non permise pour « ${prop} ». Valeurs possibles : ${rule.values.join(', ')}.`);
      else if (rule.pattern && findMarkers(value).length === 0 && !rule.pattern.regex.test(value)) add(`« ${prop} » : ${rule.pattern.message}.`);
      else if (rule.references) {
        const state = resolve.state(rule.references, value);
        if (state === 'missing') add(`« ${value} » n'existe pas dans ${TARGETS[rule.references]}.`);
        else if (state === 'hidden') add(`« ${value} » n'est pas publié : le bloc s'affichera sans lien tant qu'il ne l'est pas.`, true);
      }
    }
    for (const [prop, rule] of Object.entries(spec.props)) {
      if (rule.required && !(prop in use.props)) add(`propriété obligatoire « ${prop} » manquante.`);
    }
    if (spec.children === 'required' && use.selfClosing) add(`ce bloc entoure un texte : <${use.name} …>texte</${use.name}>.`);
    if (spec.children === 'none' && !use.selfClosing) add(`ce bloc s'écrit sans contenu, en balise autofermante : <${use.name} … />.`);

    const { variant, href, id, src } = use.props;
    if (use.name === 'Callout' && variant === 'pour-approfondir' && !href) add('la variante « pour-approfondir » exige un lien (href).');
    if (use.name === 'BlocPartenaire' && typeof id === 'string' && !resolve.partner(id)) add(`partenaire « ${id} » absent de config/ads.json.`);
    if (use.name === 'Image' && typeof src === 'string' && !resolve.image(src)) add(`image introuvable : content/images/${src}.`);
  }
  return problems;
}
