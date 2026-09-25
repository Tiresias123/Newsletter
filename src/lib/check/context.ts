// Contexte partagé par les contrôles du script check.
import type { SiteConfig } from '../config/index.ts';
import type { Entry, Graph, Severity } from '../content/graph.ts';

export type CheckMode = 'production' | 'apercu';

// Ajoute un problème : fichier, champ (chemin de données ou texte libre comme « ligne 12 »), message, règle, gravité.
export type Add = (file: string, where: PropertyKey[] | string, message: string, rule: string, severity: Severity) => void;

export type Context = {
  graph: Graph;
  config: SiteConfig;
  entries: Entry[];
  // Contenus affichés dans le mode vérifié (production ou aperçu).
  shown: Set<Entry>;
  add: Add;
  root: string;
  mode: CheckMode;
};
