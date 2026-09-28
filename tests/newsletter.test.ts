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

function graphOf(setup: (f: Fixture) => void, now = NOW) {
  fixture = createFixture();
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, testConfig(), { now, includeDrafts: false, timezone: 'America/Toronto' });
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

  it("remonte sept jours de calendrier, même au passage à l'heure d'été", () => {
    // 15 mars 2026, 0 h 30 à Montréal : une semaine plus tôt, c'est le 8 mars (et non le 7).
    expect(nextIssue(graphOf(() => {}, new Date('2026-03-15T04:30:00Z'))).since).toBe('2026-03-08');
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

  it("rend les échappements de l'éditeur, les sauts de ligne forcés et les listes numérotées", () => {
    const intro = markdownToEmail(
      'R\\&D et 5 \\* 3 : [A\\&B](https://ex.ca/?a=1\\&b=2) et [x](https://ex.ca/a_\\(b\\)).\n\nLigne\\\nSuite\n\n1. Un\n2. Deux\n\n## Voir [le guide](/guides/g/)',
      'https://example.com',
      styles,
    );
    expect(intro.html).toContain('R&amp;D et 5 * 3');
    expect(intro.html).toContain('<a href="https://ex.ca/?a=1&amp;b=2" style="a">A&amp;B</a>');
    expect(intro.html).toContain('<a href="https://ex.ca/a_(b)" style="a">x</a>');
    expect(intro.html).toContain('Ligne<br>Suite');
    expect(intro.html).toContain('<ol start="1" style="l"><li>Un</li><li>Deux</li></ol>');
    expect(intro.text).toContain('1. Un\n2. Deux');
    expect(intro.text).toContain('VOIR LE GUIDE (https://example.com/guides/g/)');
  });

  it('porte l’expéditeur, le désabonnement et les articles du numéro, en HTML et en texte', () => {
    const graph = graphOf((f) => {
      f.mdx('content/articles/recent.mdx', articleData({ status: 'publie', publishedAt: '2026-09-24' }));
      f.mdx('content/newsletters/2026-001.mdx', issue({ status: 'envoye', sentAt: '2026-09-25', articles: ['recent', 'absent'], preheader: 'Aperçu' }));
      f.mdx('content/newsletters/2026-002.mdx', issue({ issueNumber: 2 }));
    });
    const draft = graph.get('newsletters', '2026-002');
    if (!draft) throw new Error('numéro absent');
    expect(issueEmail(graph, draft, markdownToEmail('Bonjour.', 'https://example.com', styles)).problems[0]).toMatch(/^numéro pas encore archivé/);
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

describe('version du texte de consentement', () => {
  it('porte sur le texte affiché : nom du site, typographie et libellé du lien de confidentialité', async () => {
    const { consentVersion, displayedConsent } = await import('../src/lib/newsletter/consent.ts');
    const texts = { consent: "J'accepte de recevoir l'infolettre de {site} : un numéro par semaine.", privacyLinkLabel: 'Politique de confidentialité' };
    const shown = displayedConsent(texts, 'Mon site');
    expect(shown.text).toBe("J'accepte de recevoir l'infolettre de Mon site : un numéro par semaine.");
    expect(shown.version).toBe(consentVersion(`${shown.text} ${texts.privacyLinkLabel}`));
    // Renommer le site change la version, sans modification de config/newsletter.json.
    expect(displayedConsent(texts, 'Autre nom').version).not.toBe(shown.version);
  });
});
