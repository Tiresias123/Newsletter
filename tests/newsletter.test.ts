import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { getConfig } from '../src/lib/config/index.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { renderEmail } from '../src/lib/newsletter/email.ts';
import { issueEmail, nextIssue } from '../src/lib/newsletter/issue.ts';
import { markdownToEmail } from '../src/lib/newsletter/markdown.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

function graphOf(setup: (f: Fixture) => void) {
  fixture = createFixture();
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
}

const issue = (data: Record<string, unknown>) => ({ subject: 'Numéro de test', issueNumber: 1, status: 'brouillon', list: 'generale', ...data });
const styles = { paragraph: 'p', heading: 'h', list: 'l', link: 'a' };

describe('prochain numéro', () => {
  it('reprend les articles proposés et publiés depuis le dernier envoi, sans ceux déjà envoyés', () => {
    const graph = graphOf((f) => {
      f.mdx('content/newsletters/2026-001.mdx', issue({ status: 'envoye', sentAt: '2026-09-18', articles: ['deja-envoye'] }));
      f.mdx('content/articles/deja-envoye.mdx', articleData({ status: 'publie', publishedAt: '2026-09-18' }));
      f.mdx('content/articles/avant.mdx', articleData({ status: 'publie', publishedAt: '2026-09-17' }));
      f.mdx('content/articles/meme-jour.mdx', articleData({ status: 'publie', publishedAt: '2026-09-18' }));
      f.mdx('content/articles/recent.mdx', articleData({ status: 'publie', publishedAt: '2026-09-24' }));
      f.mdx('content/articles/exclu.mdx', articleData({ status: 'publie', publishedAt: '2026-09-24', newsletterEligible: false }));
      f.mdx('content/articles/programme.mdx', articleData({ status: 'programme', publishedAt: '2026-09-26' }));
      f.mdx('content/articles/brouillon.mdx', articleData({ publishedAt: '2026-09-24' }));
      f.mdx('content/newsletters/2026-002.mdx', issue({ issueNumber: 2 }));
    });
    expect(nextIssue(graph)).toEqual({ id: '2026-003', issueNumber: 3, articles: ['recent', 'meme-jour'], since: '2026-09-18', unsentDrafts: ['2026-002'] });
  });

  it('sans numéro envoyé, remonte une semaine', () => {
    const graph = graphOf((f) => {
      f.mdx('content/articles/vieux.mdx', articleData({ status: 'publie', publishedAt: '2026-09-17' }));
      f.mdx('content/articles/semaine.mdx', articleData({ status: 'publie', publishedAt: '2026-09-18' }));
    });
    expect(nextIssue(graph)).toMatchObject({ id: '2026-001', issueNumber: 1, articles: ['semaine'], since: '2026-09-18' });
  });
});

describe('courriel', () => {
  it('convertit le mot d’introduction, retire les blocs et rend les liens absolus', () => {
    const intro = markdownToEmail(
      'Bonjour : voici **l’essentiel** et *le reste*.\n\n<Callout variant="attention">\nTexte\n</Callout>\n\n## Intertitre\n\n- un [lien](/articles/a/)\n- deux\n\nÀ <script> & fin.',
      'https://example.com',
      styles,
    );
    expect(intro.warnings).toEqual(['bloc Callout retiré : les blocs ne passent pas dans un courriel.']);
    expect(intro.html).toContain('<p style="p">Bonjour : voici <strong>l’essentiel</strong> et <em>le reste</em>.</p>');
    expect(intro.html).toContain('<h2 style="h">Intertitre</h2>');
    expect(intro.html).toContain('<li>un <a href="https://example.com/articles/a/" style="a">lien</a></li>');
    expect(intro.html).toContain('À &lt;script&gt; &amp; fin.');
    expect(intro.text).toContain('- un lien (https://example.com/articles/a/)');
  });

  it('porte l’expéditeur, le désabonnement et les articles du numéro, en HTML et en texte', () => {
    const graph = graphOf((f) => {
      f.mdx('content/articles/recent.mdx', articleData({ status: 'publie', publishedAt: '2026-09-24' }));
      f.mdx('content/newsletters/2026-001.mdx', issue({ articles: ['recent', 'absent'], preheader: 'Aperçu' }));
    });
    const entry = graph.get('newsletters', '2026-001');
    if (!entry) throw new Error('numéro absent');
    const { data, problems } = issueEmail(graph, entry, markdownToEmail('Bonjour.', 'https://example.com', styles));
    expect(problems).toEqual(["l'article « absent » n'est pas publié : il est retiré du courriel."]);
    const { html, text } = renderEmail(data, getConfig().theme);
    expect(html).toContain('https://example.com/articles/recent/');
    expect(html).toContain('href="{{ unsubscribe }}"');
    expect(html).toContain('https://example.com/newsletter/2026-001/');
    expect(html).not.toMatch(/<style|class="/);
    expect(html).toContain(getConfig().theme.colors.brand['600']);
    expect(text).toContain('Se désabonner : {{ unsubscribe }}');
    expect(text).toContain('Un titre d’article de test assez long');
  });
});
