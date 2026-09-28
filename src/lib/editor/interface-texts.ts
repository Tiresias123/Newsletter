// Formulaire des textes de l'interface (config/i18n/fr.json), déduit de la structure du fichier : un champ par
// texte, un groupe par section. Les sections techniques (libellés de l'éditeur et du rapport) sont conservées
// telles quelles sans être proposées. Les mots entre accolades ({site}, {n}) sont remplacés par le site.
import { fields } from '@keystatic/core';
import messages from '../../../config/i18n/fr.json' with { type: 'json' };

type Tree = { [key: string]: string | Tree };
type Schema = Parameters<typeof fields.object>[0];

// Sections lues seulement par les formulaires, le rapport « À vérifier » ou les pages de développement.
export const TECHNICAL_SECTIONS = ['champs', 'editeur', 'report', 'collections', 'devExample'] as const;

function schemaOf(tree: Tree): Schema {
  return Object.fromEntries(
    Object.entries(tree).map(([key, value]) => [
      key,
      typeof value === 'string' ? fields.text({ label: key, multiline: value.length > 80 }) : fields.object(schemaOf(value), { label: key }),
    ]),
  );
}

export function interfaceTextsSchema(): Schema {
  const tree = messages as unknown as Tree;
  return Object.fromEntries(
    Object.entries(tree).map(([key, value]) => [
      key,
      (TECHNICAL_SECTIONS as readonly string[]).includes(key) || typeof value === 'string'
        ? fields.ignored()
        : fields.object(schemaOf(value), { label: key }),
    ]),
  );
}
