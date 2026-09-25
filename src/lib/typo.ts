// Typographie française (Québec, point 8.10 du brief) appliquée aux textes affichés.
// L'auteur tape des espaces ordinaires ; le site les rend insécables là où il le faut.

export const NBSP = ' ';

export function frenchTypography(text: string): string {
  return (
    text
      // Aucune espace avant le point-virgule, le point d'exclamation et le point d'interrogation.
      .replace(/[   ]+([;!?])/g, '$1')
      // Espace insécable avant le deux-points (sauf dans les adresses et les heures « 08:00 »).
      .replace(/ +:(?=\s|$)/g, `${NBSP}:`)
      // Espaces insécables à l'intérieur des guillemets français.
      .replace(/« +/g, `«${NBSP}`)
      .replace(/ +»/g, `${NBSP}»`)
      // Espace insécable comme séparateur de milliers (« 84 146 »).
      .replace(/(?<=\d) (?=\d{3}(?!\d))/g, NBSP)
      // Espace insécable entre un nombre et « $ » ou « % », et dans « $ CA ».
      .replace(/(\d) +(?=[$%])/g, `$1${NBSP}`)
      .replace(/\$ +(?=CA\b|US\b)/g, `$${NBSP}`)
  );
}
