// Marqueurs laissés à l'auteur (brief, point 14) : bloquants dans tout contenu visible en production.
// Variante tolérée : un détail après le marqueur, « [À VÉRIFIER : date exacte] ».

const MARKER = /\[(?:À COMPLÉTER PAR L['’]AUTEUR|À VÉRIFIER|À VALIDER PAR L['’]AUTEUR|EXEMPLE|NOM-DU-SITE)(?:\s*:[^\]]*)?\]/gu;

// Marqueurs distincts présents dans un texte, dans leur ordre d'apparition.
export function findMarkers(text: string): string[] {
  return [...new Set(text.match(MARKER) ?? [])];
}

// Parcourt une valeur (objet, liste, texte) et renvoie chaque champ contenant un marqueur.
// Les clés de `skip` (notes internes jamais affichées) sont ignorées.
export function markersIn(value: unknown, skip: readonly string[] = [], path: PropertyKey[] = []): Array<{ path: PropertyKey[]; markers: string[] }> {
  if (typeof value === 'string') {
    const markers = findMarkers(value);
    return markers.length > 0 ? [{ path, markers }] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item, i) => markersIn(item, skip, [...path, i]));
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => (skip.includes(key) ? [] : markersIn(item, skip, [...path, key])));
  }
  return [];
}
