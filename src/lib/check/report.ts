// Mise en forme du rapport « À vérifier » : regroupement par gravité puis par règle,
// fichier docs/A-VERIFIER.md. La page /a-verifier/ du mode développement réutilise le regroupement.
import messages from '../../../config/i18n/fr.json' with { type: 'json' };
import type { GraphProblem, Severity } from '../content/graph.ts';
import { formatDateTime } from '../format.ts';
import { t } from '../i18n.ts';
import type { CheckResult } from './index.ts';

export const SEVERITIES: readonly Severity[] = ['bloquant', 'avertissement', 'information'];

const RULE_TITLES: Record<string, string> = messages.report.rules;
const SEVERITY_TITLES = { bloquant: t('report.blocking'), avertissement: t('report.warnings'), information: t('report.info') };
const SEVERITY_HELP: Partial<Record<Severity, string>> = { bloquant: t('report.blockingHelp'), avertissement: t('report.warningsHelp') };

export type ReportGroup = { rule: string; title: string; problems: GraphProblem[] };
export type ReportSection = { severity: Severity; title: string; help?: string; groups: ReportGroup[]; count: number };

export function groupProblems(problems: readonly GraphProblem[]): ReportSection[] {
  return SEVERITIES.map((severity) => {
    const own = problems.filter((p) => p.severity === severity);
    const rules = [...new Set(own.map((p) => p.rule))];
    const groups = rules.map((rule) => ({
      rule,
      title: RULE_TITLES[rule] ?? rule,
      problems: own.filter((p) => p.rule === rule).sort((a, b) => a.file.localeCompare(b.file)),
    }));
    return { severity, title: SEVERITY_TITLES[severity], help: SEVERITY_HELP[severity], groups, count: own.length };
  });
}

// « 0 erreur bloquante · 12 points à vérifier · 5 informations ».
export function summaryLine(problems: readonly GraphProblem[]): string {
  const count = (severity: Severity) => problems.filter((p) => p.severity === severity).length;
  return [
    t('report.blockingCount', { count: count('bloquant') }),
    t('report.warningsCount', { count: count('avertissement') }),
    t('report.infoCount', { count: count('information') }),
  ].join(' · ');
}

export function generatedLine(result: CheckResult): string {
  const date = formatDateTime(result.generatedAt, t('dates.dateAtTime'), result.timezone);
  return t('report.generatedAt', { date, mode: t(`report.modes.${result.mode}`) });
}

// Le texte vient des contenus : on neutralise les balises (« <Image> ») et les apostrophes inverses.
const escape = (text: string) => text.replace(/([\\`<])/g, '\\$1');

export function renderMarkdown(result: CheckResult): string {
  const lines = [`# ${t('report.title')}`, '', t('report.intro'), '', generatedLine(result), '', `**${summaryLine(result.problems)}**`, ''];
  for (const section of groupProblems(result.problems)) {
    lines.push(`## ${section.title} (${section.count})`, '');
    if (section.help) lines.push(section.help, '');
    if (section.count === 0) lines.push(t('report.none'), '');
    for (const group of section.groups) {
      lines.push(`### ${group.title} (${group.problems.length})`, '');
      for (const p of group.problems) lines.push(`- \`${p.file}\` — ${escape(p.field)} : ${escape(p.message)}`);
      lines.push('');
    }
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
