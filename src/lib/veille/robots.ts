// Respect du robots.txt d'un site officiel (ARCHITECTURE, section 14, « bonne conduite du robot ») : groupe
// propre à notre robot, sinon groupe « * »; la règle Allow ou Disallow la plus longue l'emporte, Allow à égalité.
type Rule = { allow: boolean; pattern: string };
type Group = { agents: string[]; rules: Rule[] };

function groups(robots: string): Group[] {
  const result: Group[] = [];
  let current: Group | undefined;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
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
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === 'allow' || field === 'disallow') && current) {
      // « Disallow: » sans valeur n'interdit rien.
      if (value) current.rules.push({ allow: field === 'allow', pattern: value });
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

// `path` : chemin et requête de l'adresse (« /fr/nouvelles?x=1 »); `agent` : jeton de notre robot.
export function robotsAllows(robots: string, agent: string, path: string): boolean {
  const all = groups(robots);
  const token = agent.toLowerCase();
  const group = all.find((g) => g.agents.some((a) => a !== '*' && token.includes(a))) ?? all.find((g) => g.agents.includes('*'));
  if (!group) return true;
  let best: Rule | undefined;
  for (const rule of group.rules) {
    if (!toRegex(rule.pattern).test(path)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) best = rule;
  }
  return best?.allow ?? true;
}
