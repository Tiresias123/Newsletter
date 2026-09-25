import { afterEach, describe, expect, it } from 'vitest';
import { checkBlocks } from '../src/lib/check/blocks.ts';
import { bodyLinks, fieldLinks, resolveInternalPath } from '../src/lib/check/links.ts';
import { loadContent } from '../src/lib/check/load.ts';
import { findMarkers, markersIn } from '../src/lib/check/markers.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { findBlocks } from '../src/lib/content/blocks.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

describe('marqueurs', () => {
  it('reconnaît les marqueurs, avec ou sans précision', () => {
    expect(findMarkers("Texte [À VÉRIFIER] puis [À COMPLÉTER PAR L’AUTEUR] et [À VÉRIFIER : date exacte].")).toEqual([
      '[À VÉRIFIER]',
      '[À COMPLÉTER PAR L’AUTEUR]',
      '[À VÉRIFIER : date exacte]',
    ]);
    expect(findMarkers('Un [lien](/a/) et [EXEMPLE] ou [NOM-DU-SITE].')).toEqual(['[EXEMPLE]', '[NOM-DU-SITE]']);
    expect(findMarkers('[à vérifier] en minuscules ne compte pas')).toEqual([]);
  });

  it('parcourt les données et ignore les notes internes', () => {
    const data = { title: '[EXEMPLE] Titre', faq: [{ answer: '[À VÉRIFIER]' }], note: '[À VÉRIFIER]' };
    expect(markersIn(data, ['note'])).toEqual([
      { path: ['title'], markers: ['[EXEMPLE]'] },
      { path: ['faq', 0, 'answer'], markers: ['[À VÉRIFIER]'] },
    ]);
  });
});

describe('blocs riches', () => {
  const resolvers = {
    state: (collection: 'lexique' | 'dossiers' | 'auteurs', id: string) =>
      collection === 'lexique' && id === 'staking' ? ('visible' as const) : id === 'brouillon' ? ('hidden' as const) : ('missing' as const),
    partner: (id: string) => id === 'partenaire',
    image: (src: string) => src === 'ok.webp',
  };
  const problems = (body: string) => checkBlocks(body, resolvers).map((p) => `${p.line} ${p.message}`);

  it('ignore les balises citées dans du code', () => {
    expect(findBlocks('Écrivez `<Callout variant="x">` ou\n\n```mdx\n<Inconnu />\n```')).toEqual([]);
  });

  it('accepte des blocs conformes au contrat', () => {
    const body = [
      '<Callout variant="attention" title="À noter">Texte</Callout>',
      '<Definition term="staking">jalonnement</Definition>',
      '<Chronologie items={[{ date: "2026-01-01", title: "Début" }]} />',
      '<Image src="ok.webp" alt="Schéma" credit="Auteur" />',
      '<BlocPartenaire id="partenaire" />',
    ].join('\n\n');
    expect(problems(body)).toEqual([]);
  });

  it('signale bloc inconnu, propriété inconnue, valeur interdite et propriété manquante', () => {
    expect(problems('<Encadre>x</Encadre>')[0]).toContain('1 bloc Encadre : bloc inconnu');
    expect(problems('<Callout variant="attention" titre="x">t</Callout>')).toEqual([
      '1 bloc Callout : propriété « titre » inconnue. Propriétés possibles : variant, title, href.',
    ]);
    expect(problems('<Callout variant="rouge">t</Callout>')[0]).toContain('valeur « rouge » non permise');
    expect(problems('\n\n<Video id="abcdefghijk" />')).toEqual(['3 bloc Video : propriété obligatoire « title » manquante.']);
  });

  it('contrôle les formes attendues et les blocs de page', () => {
    expect(problems('<Video id="abc" title="t" />')[0]).toContain('identifiant YouTube attendu');
    expect(problems('<Video id="[À COMPLÉTER PAR L’AUTEUR]" title="t" />')).toEqual([]);
    expect(problems('<TexteDeLoi reference="r" version="v" url="www.x.ca">t</TexteDeLoi>')[0]).toContain('adresse complète attendue');
    expect(problems('<Hero title="t">x</Hero>')[0]).toContain('bloc de page, réservé aux pages statiques');
    expect(checkBlocks('<Hero title="t">x</Hero>', resolvers, { isPage: true })).toEqual([]);
    expect(checkBlocks('<Definition term="brouillon">x</Definition>', resolvers)).toEqual([
      { line: 1, message: 'bloc Definition : « brouillon » n\'est pas publié : le bloc s\'affichera sans lien tant qu\'il ne l\'est pas.', warning: true },
    ]);
  });

  it('vérifie les références, le contenu attendu et les règles propres à un bloc', () => {
    expect(problems('<Definition term="inconnu">x</Definition>')[0]).toContain("« inconnu » n'existe pas dans le lexique");
    expect(problems('<Note />')[0]).toContain('ce bloc entoure un texte');
    expect(problems('<MiseEnGarde></MiseEnGarde>')[0]).toContain('balise autofermante');
    expect(problems('<Callout variant="pour-approfondir">x</Callout>')[0]).toContain('exige un lien');
    expect(problems('<Chronologie items="[]" />')[0]).toContain('attend une liste entre accolades');
    expect(problems('<Image src="absente.webp" alt="a" credit="c" />')[0]).toContain('image introuvable');
    expect(problems('<BlocPartenaire id="autre" />')[0]).toContain('absent de config/ads.json');
  });
});

describe('liens', () => {
  it('extrait liens et images du corps, hors code', () => {
    const body = 'Voir [le dossier](/dossiers/a/ "titre") et ![](schema.webp).\n\n[renvoi]: /guides/\n\n<Callout variant="pour-approfondir" href="/lexique/">x</Callout>\n\n`[pas](/un-lien/)`';
    const { links, images } = bodyLinks(body);
    expect(links.map((l) => `${l.line} ${l.href}`)).toEqual(['1 /dossiers/a/', '3 /guides/', '5 /lexique/']);
    expect(images).toEqual([{ alt: '', src: 'schema.webp', line: 1 }]);
  });

  it('extrait les adresses des champs : internes sous les clés d’adresse, externes partout', () => {
    const data = { cover: { src: '../images/a.webp', creditUrl: 'https://example.org/p' }, timeline: [{ url: '/dossiers/b/' }], title: '/pas-un-lien/' };
    expect(fieldLinks(data).map((l) => l.href)).toEqual(['https://example.org/p', '/dossiers/b/']);
  });

  describe('résolution selon la table des routes', () => {
    let fixture: Fixture;
    afterEach(() => fixture.cleanup());

    it('distingue adresses valides, cassées et non publiées', () => {
      fixture = createFixture();
      fixture.mdx('content/articles/publie.mdx', articleData({ status: 'publie', publishedAt: '2026-09-20', tags: ['mica'] }));
      fixture.mdx('content/articles/brouillon.mdx', articleData());
      fixture.mdx('content/pages/contact.mdx', { title: 'Contact', status: 'publie' });
      const content = loadContent(fixture.root);
      expect(content.problems).toEqual([]);
      const graph = buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
      const status = (href: string) => {
        const result = resolveInternalPath(href, graph);
        return result.ok ? 'ok' : result.unpublished ? 'non publié' : result.message;
      };
      for (const href of ['/', '/articles/publie/', '/articles/page/2/', '/actualites/', '/actualites/page/3/', '/actualites/rss.xml', '/contact/', '/dossiers/', '/fiscalite/traitements/', '/tags/mica/', '/themes/stablecoins/', '/rss.xml', '/recherche/?q=mica', '/veille/#haut']) {
        expect(status(href), href).toBe('ok');
      }
      expect(status('/articles/brouillon/')).toBe('non publié');
      expect(status('/articles/absent/')).toContain("n'existe pas");
      expect(status('/dossiers')).toContain('Barre oblique finale manquante');
      expect(status('/inconnu/')).toBe('Adresse inconnue du site.');
      expect(status('/a-verifier/')).toContain('développement');
      expect(status('/en/')).toContain('anglaise');
      expect(status('/articles/page/1/')).toBe('Adresse inconnue du site.');
    });
  });
});
