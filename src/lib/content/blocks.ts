// Contrat des blocs riches utilisables dans le corps MDX (brief 6.15, ARCHITECTURE 7.15) :
// nom du composant, propriétés attendues, valeurs permises. Le script check refuse tout écart ;
// les composants eux-mêmes (phase 2) et l'éditeur (phase 3) suivent ce même contrat.

export const CALLOUT_VARIANTS = [
  'important',
  'a-retenir',
  'attention',
  'en-pratique',
  'exemple',
  'date-a-retenir',
  'ce-qui-change',
  'pour-les-particuliers',
  'pour-les-entreprises',
  'source-officielle',
  'mise-a-jour',
  'pour-approfondir',
  'bon-a-savoir',
] as const;

export type PropSpec = {
  required?: boolean;
  // Valeurs permises pour une propriété texte.
  values?: readonly string[];
  // Propriété passée comme expression ({[…]}) : liste ou objet.
  expression?: boolean;
  // Collection dans laquelle l'identifiant doit exister.
  references?: 'lexique' | 'dossiers';
};

export type BlockSpec = {
  props: Record<string, PropSpec>;
  children: 'required' | 'none' | 'optional';
};

export const BLOCKS: Record<string, BlockSpec> = {
  Callout: { props: { variant: { required: true, values: CALLOUT_VARIANTS }, title: {}, href: {} }, children: 'required' },
  TexteDeLoi: { props: { reference: { required: true }, version: { required: true }, url: { required: true } }, children: 'required' },
  ExempleChiffre: { props: { title: {}, rows: { required: true, expression: true }, total: { required: true, expression: true } }, children: 'none' },
  Chronologie: { props: { items: { required: true, expression: true } }, children: 'none' },
  Comparatif: { props: { caption: { required: true }, columns: { required: true, expression: true }, rows: { required: true, expression: true } }, children: 'none' },
  Citation: { props: { author: { required: true }, role: {}, source: {}, date: {} }, children: 'required' },
  Video: { props: { id: { required: true }, title: { required: true } }, children: 'none' },
  Definition: { props: { term: { required: true, references: 'lexique' } }, children: 'required' },
  MiseEnGarde: { props: {}, children: 'none' },
  StatutReglementaire: { props: { dossier: { required: true, references: 'dossiers' } }, children: 'none' },
  BlocPartenaire: { props: { id: { required: true } }, children: 'none' },
  Note: { props: {}, children: 'required' },
  Image: { props: { src: { required: true }, alt: { required: true }, caption: {}, credit: { required: true } }, children: 'none' },
};

export type BlockUse = { name: string; props: Record<string, string | { expression: string }>; selfClosing: boolean; line: number };

// Remplace le code (blocs et extraits) par des blancs : on n'y cherche ni blocs ni liens,
// et les numéros de ligne restent justes.
export function hideCode(text: string): string {
  const blank = (code: string) => code.replace(/[^\n]/g, ' ');
  return text.replace(/```[\s\S]*?```/g, blank).replace(/`[^`\n]*`/g, blank);
}

// Repère les balises de composants (<Nom …> ou <Nom … />) d'un corps MDX, hors code.
export function findBlocks(body: string): BlockUse[] {
  const uses: BlockUse[] = [];
  const text = hideCode(body);
  const tag = /<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g;
  for (let match = tag.exec(text); match; match = tag.exec(text)) {
    let i = match.index + match[0].length;
    const props: BlockUse['props'] = {};
    let selfClosing = false;
    while (i < text.length) {
      const rest = text.slice(i);
      const space = /^\s+/.exec(rest);
      if (space) {
        i += space[0].length;
        continue;
      }
      if (rest.startsWith('/>')) {
        selfClosing = true;
        i += 2;
        break;
      }
      if (rest.startsWith('>')) {
        i += 1;
        break;
      }
      const name = /^([A-Za-z][\w-]*)/.exec(rest);
      if (!name) break;
      i += name[0].length;
      if (text[i] !== '=') {
        props[name[1] as string] = 'true';
        continue;
      }
      i += 1;
      const quote = text[i];
      if (quote === '"' || quote === "'") {
        const end = text.indexOf(quote, i + 1);
        props[name[1] as string] = text.slice(i + 1, end);
        i = end + 1;
      } else if (quote === '{') {
        let depth = 0;
        const start = i;
        for (; i < text.length; i += 1) {
          if (text[i] === '{') depth += 1;
          else if (text[i] === '}' && --depth === 0) break;
        }
        props[name[1] as string] = { expression: text.slice(start + 1, i) };
        i += 1;
      }
    }
    uses.push({ name: match[1] as string, props, selfClosing, line: text.slice(0, match.index).split('\n').length });
  }
  return uses;
}
