// Contrôle des blocs riches d'un corps MDX contre leur contrat (content/blocks.ts) :
// nom connu, propriétés permises et obligatoires, valeurs, références, contenu attendu.
import { BLOCKS, findBlocks } from '../content/blocks.ts';

export type BlockResolvers = {
  exists: (collection: 'lexique' | 'dossiers', id: string) => boolean;
  partner: (id: string) => boolean;
  // Chemin relatif à content/images/.
  image: (src: string) => boolean;
};

export type BlockProblem = { line: number; message: string };

const TARGETS = { lexique: 'le lexique', dossiers: 'les dossiers' } as const;

export function checkBlocks(body: string, resolve: BlockResolvers): BlockProblem[] {
  const problems: BlockProblem[] = [];
  for (const use of findBlocks(body)) {
    const add = (message: string) => problems.push({ line: use.line, message: `bloc ${use.name} : ${message}` });
    const spec = BLOCKS[use.name];
    if (!spec) {
      add(`bloc inconnu. Blocs possibles : ${Object.keys(BLOCKS).join(', ')}.`);
      continue;
    }
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
      else if (rule.references && !resolve.exists(rule.references, value)) add(`« ${value} » n'existe pas dans ${TARGETS[rule.references]}.`);
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
