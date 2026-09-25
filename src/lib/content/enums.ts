// Énumérations qui pilotent l'affichage (puces, icônes, types schema.org).
// Leurs libellés vivent dans config/i18n/fr.json, section « enums » ; seules les valeurs sont ici.

export const PUBLICATION_STATUS = ['brouillon', 'programme', 'publie', 'archive'] as const;
export const LEGAL_STATUS = [
  'projet',
  'consultation',
  'adopte',
  'en-vigueur',
  'partiellement-en-vigueur',
  'modifie',
  'abroge',
  'retire',
] as const;
export const WHO_IS_AFFECTED = ['particuliers', 'entreprises', 'plateformes', 'emetteurs', 'professionnels', 'institutions'] as const;
export const GUIDE_LEVEL = ['facile', 'moyen', 'avance'] as const;
export const AUDIENCE = ['particuliers', 'entreprises', 'professionnels'] as const;
export const JURISDICTION_LEVEL = ['federal', 'provincial', 'supranational', 'national', 'international'] as const;
export const JURISDICTION_BADGE = ['plein', 'contour-point', 'contour'] as const;
export const CATEGORY_BADGE = ['plein-500', 'plein-700', 'plein-900', 'doux-800', 'doux-900', 'clair-300', 'ardoise'] as const;
export const AUTHORITY_TYPE = [
  'regulateur-valeurs-mobilieres',
  'administration-fiscale',
  'banque-centrale',
  'renseignement-financier',
  'ministere',
  'organisme-autoreglementation',
  'tribunal',
  'assemblee-legislative',
  'autre',
] as const;
export const TEXT_TYPE = [
  'loi',
  'reglement',
  'projet-de-loi',
  'avis-du-personnel',
  'instruction-generale',
  'bulletin-interpretation',
  'folio',
  'position-administrative',
  'decision-administrative',
  'decision-judiciaire',
  'consultation',
] as const;
export const TAX_TYPE = ['impot-revenu', 'gain-capital', 'tps-tvq', 'retenue', 'declaration-information'] as const;
export const SOURCE_TYPE = [
  'legislation',
  'reglement',
  'gouvernement',
  'regulateur',
  'decision-justice',
  'doctrine-administrative',
  'consultation',
  'communique',
  'rapport',
  'universitaire',
  'industrie',
  'presse',
] as const;
export const AGENDA_TYPE = ['echeance-fiscale', 'consultation', 'entree-en-vigueur', 'audience', 'evenement'] as const;
export const REVIEW_EVERY = ['aucun', '3', '6', '12'] as const;
export const NEWSLETTER_STATUS = ['brouillon', 'envoye'] as const;
export const THEME_GROUP = ['reglementation', 'fiscalite', 'general'] as const;
export const SCHEMA_TYPE = ['NewsArticle', 'AnalysisNewsArticle', 'OpinionNewsArticle', 'BackgroundNewsArticle', 'Article'] as const;
export const SOCIAL_NETWORK = ['linkedin', 'x', 'bluesky', 'mastodon', 'youtube', 'facebook', 'rss', 'courriel', 'site'] as const;
export const LANG = ['fr', 'en'] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUS)[number];
export type LegalStatus = (typeof LEGAL_STATUS)[number];
export type JurisdictionBadge = (typeof JURISDICTION_BADGE)[number];
export type CategoryBadge = (typeof CATEGORY_BADGE)[number];
export type SourceType = (typeof SOURCE_TYPE)[number];
export type SocialNetwork = (typeof SOCIAL_NETWORK)[number];
