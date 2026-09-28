// Lecture d'une valeur littérale JavaScript écrite entre accolades dans un bloc MDX ({[…]}, {{…}}), sans
// l'exécuter : textes, nombres, true, false, null, listes et objets. Tout le reste (calcul, variable, gabarit,
// décomposition) n'est pas une valeur littérale : la fonction renvoie undefined.
const FAIL = Symbol('échec');
type Parsed = unknown;
const ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0', '\n': '' };

export function parseLiteral(source: string): { value: unknown } | undefined {
  let i = 0;
  const space = () => {
    while (i < source.length && /\s/.test(source[i] ?? '')) i += 1;
  };
  const text = (): Parsed => {
    const quote = source[i];
    let out = '';
    for (i += 1; i < source.length; i += 1) {
      const c = source[i] as string;
      if (c === quote) {
        i += 1;
        return out;
      }
      if (c === '\n') return FAIL;
      if (c !== '\\') {
        out += c;
        continue;
      }
      i += 1;
      const unicode = /^u(?:\{([0-9a-fA-F]+)\}|([0-9a-fA-F]{4}))/.exec(source.slice(i));
      if (unicode) {
        out += String.fromCodePoint(parseInt((unicode[1] ?? unicode[2]) as string, 16));
        i += unicode[0].length - 1;
      } else {
        const e = source[i] ?? '';
        out += ESCAPES[e] ?? e;
      }
    }
    return FAIL;
  };
  const match = (pattern: RegExp): string | undefined => {
    const found = pattern.exec(source.slice(i))?.[0];
    if (found !== undefined) i += found.length;
    return found;
  };
  const list = (close: string, item: () => Parsed): Parsed[] | typeof FAIL => {
    const out: Parsed[] = [];
    i += 1;
    space();
    while (source[i] !== close) {
      const value = item();
      if (value === FAIL) return FAIL;
      out.push(value);
      space();
      if (source[i] === ',') i += 1;
      else if (source[i] !== close) return FAIL;
      space();
    }
    i += 1;
    return out;
  };
  const key = (): Parsed => (source[i] === '"' || source[i] === "'" ? text() : (match(/^(?:[A-Za-z_$][\w$]*|\d+)/) ?? FAIL));
  const value = (): Parsed => {
    space();
    const c = source[i];
    if (c === '"' || c === "'") return text();
    if (c === '[') return list(']', value);
    if (c === '{') {
      const entries = list('}', () => {
        const k = key();
        space();
        if (k === FAIL || source[i] !== ':') return FAIL;
        i += 1;
        const v = value();
        return v === FAIL ? FAIL : [k, v];
      });
      return entries === FAIL ? FAIL : Object.fromEntries(entries as Array<[string, unknown]>);
    }
    const scalar = match(/^(?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|true|false|null)(?![\w$])/);
    if (scalar === undefined) return FAIL;
    return scalar === 'true' ? true : scalar === 'false' ? false : scalar === 'null' ? null : Number(scalar);
  };
  const result = value();
  space();
  return result === FAIL || i !== source.length ? undefined : { value: result };
}

// Valeur que l'éditeur sait relire : textes, null, listes et objets de ces valeurs. Il refuse un nombre (même
// positif, ses champs sont des textes), true et false.
export function isEditorValue(value: unknown): boolean {
  if (value === null || typeof value === 'string') return true;
  if (Array.isArray(value)) return value.every(isEditorValue);
  if (typeof value === 'object') return Object.values(value).every(isEditorValue);
  return false;
}
