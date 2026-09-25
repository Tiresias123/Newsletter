// Sommaire d'une page à sections structurées (dossier, fiches) : sections placées avant et après le corps MDX,
// dont les ancres restent uniques face aux titres du corps (un « ## Sources » dans le corps, par exemple).
export type Heading = { depth: number; slug: string; text: string };
export type TocSection = { id: string; title: string; show?: boolean };

export function pageToc(headings: readonly Heading[], before: readonly TocSection[], after: readonly TocSection[]) {
  const taken = new Set(headings.map((h) => h.slug));
  const ids = new Map<string, string>();
  const place = (section: TocSection): Heading => {
    let id = section.id;
    for (let n = 2; taken.has(id); n++) id = `${section.id}-${n}`;
    taken.add(id);
    ids.set(section.id, id);
    return { depth: 2, slug: id, text: section.title };
  };
  const shown = (sections: readonly TocSection[]) => sections.filter((s) => s.show !== false);
  const toc = [...shown(before).map(place), ...headings.filter((h) => h.depth === 2 || h.depth === 3), ...shown(after).map(place)];
  // Ancre finale d'une section, à passer à son composant.
  return { toc, id: (key: string) => ids.get(key) ?? key };
}
