// Configuration de l'éditeur Keystatic (ARCHITECTURE, section 4) : mode local, collections de content/,
// réglages de config/. Les schémas Zod restent la source de vérité ; ce formulaire en est le miroir.
import { config } from '@keystatic/core';
import site from '../../../config/site.json' with { type: 'json' };
import { editorialCollections } from './collections-editorial.ts';
import { referenceCollections } from './collections-reference.ts';
import { editorText } from './labels.ts';
import { singletons } from './singletons.ts';

const group = (key: string) => editorText('navigation', key);

export default config({
  storage: { kind: 'local' },
  // Français de France, seul proposé par Keystatic : une partie de son habillage reste en anglais.
  locale: 'fr-FR',
  ui: {
    brand: { name: site.name },
    navigation: {
      [group('contenus')]: ['articles', 'guides', 'dossiers', 'newsletters', 'pages'],
      [group('fiches')]: ['juridictions', 'organismes', 'textes', 'traitements', 'lexique', 'agenda'],
      [group('references')]: ['sources', 'auteurs'],
      [group('classements')]: ['categories', 'themes', 'formats', 'activites', 'contribuables'],
      [group('reglages')]: ['site', 'navigation', 'homepage', 'theme', 'newsletter', 'legal', 'veilleSources', 'ads', 'redirects', 'ticker', 'services', 'messages'],
    },
  },
  collections: { ...editorialCollections, ...referenceCollections },
  singletons,
});
