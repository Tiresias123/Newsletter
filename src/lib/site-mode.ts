// Mode du build : production (brouillons masqués, pages indexables) ou aperçu (brouillons visibles, noindex,
// formulaires d'essai). SITE_MODE (« preview » ou « production ») le fixe; sinon, dans Workers Builds, toute
// branche autre que la branche de production construit un aperçu (ARCHITECTURE 15.1).
export const PRODUCTION_BRANCH = 'main';

type Environment = Record<string, string | undefined>;

export function previewBuild(env: Environment = process.env): boolean {
  if (env.SITE_MODE === 'preview') return true;
  if (env.SITE_MODE === 'production') return false;
  return Boolean(env.WORKERS_CI_BRANCH) && env.WORKERS_CI_BRANCH !== PRODUCTION_BRANCH;
}
