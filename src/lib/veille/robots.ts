// Respect du robots.txt d'un site officiel (ARCHITECTURE, section 14, « bonne conduite du robot »), selon la
// RFC 9309 : règles de tous les groupes qui nomment notre robot, sinon de tous les groupes « * »; la règle Allow
// ou Disallow la plus longue l'emporte, Allow à égalité; chemins et motifs comparés sous la même forme encodée.
type Rule = { allow: boolean; pattern: string };
type Group = { agents: string[]; rules: Rule[] };

// Jeton de produit d'une ligne User-agent (« VeilleReglementaireBot/1.0 » : « veillereglementairebot »).
const productToken = (value: string) => (value.startsWith('*') ? '*' : (/^[A-Za-z_-]+/.exec(value)?.[0] ?? '').toLowerCase());

// Caractères non ASCII encodés en UTF-8 (« é » : « %C3%A9 »), séquences en majuscules, caractères non réservés
// décodés (« %7E » : « ~ »).
function normalize(path: string): string {
  return path
    .replace(/[\u0080-￿]+/g, (chars) => {
      try {
        return encodeURIComponent(chars);
      } catch {
        return chars;
      }
    })
    .replace(/%([0-9A-Fa-f]{2})/g, (sequence, hex: string) => {
      const char = String.fromCharCode(parseInt(hex, 16));
      return /[A-Za-z0-9._~-]/.test(char) ? char : sequence.toUpperCase();
    });
}

function groups(robots: string): Group[] {
  const result: Group[] = [];
  let current: Group | undefined;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n|\r/)) {
    const line = raw.replace(/#.*/, '').trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = (match[1] ?? '').toLowerCase();
    const value = (match[2] ?? '').trim();
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        result.push(current);
      }
      // Une ligne « User-agent: » vide ouvre un groupe qui ne s'applique à personne.
      const token = productToken(value);
      if (token) current.agents.push(token);
      lastWasAgent = true;
    } else if ((field === 'allow' || field === 'disallow') && current) {
      // « Disallow: » sans valeur n'interdit rien.
      if (value) current.rules.push({ allow: field === 'allow', pattern: normalize(value) });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return result;
}

// Motif robots.txt (« * » : n'importe quelle suite; « $ » final : fin de l'adresse) en expression régulière.
function toRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

// `product` : jeton de notre robot (« VeilleReglementaireBot »); `path` : chemin et requête de l'adresse
// (« /fr/nouvelles?x=1 »).
export function robotsAllows(robots: string, product: string, path: string): boolean {
  const all = groups(robots);
  const token = productToken(product);
  const own = all.filter((g) => g.agents.includes(token));
  const rules = (own.length > 0 ? own : all.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules);
  const target = normalize(path);
  let best: Rule | undefined;
  for (const rule of rules) {
    if (!toRegex(rule.pattern).test(target)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) best = rule;
  }
  return best?.allow ?? true;
}
