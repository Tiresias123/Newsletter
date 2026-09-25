// Pagination des listes (hubs, thèmes, étiquettes) : 12 contenus par page (DA, maquette 12.6).
// La page 1 est à l'adresse de la liste ; les suivantes à « …/page/2/ ».
export const PAGE_SIZE = 12;

export type Page<T> = { items: T[]; current: number; total: number; urls: { previous?: string; next?: string }; pageUrl: (n: number) => string };

export function pageUrl(base: string, n: number): string {
  return n <= 1 ? base : `${base}page/${n}/`;
}

export function paginate<T>(items: readonly T[], base: string, current = 1, size = PAGE_SIZE): Page<T> {
  const total = Math.max(1, Math.ceil(items.length / size));
  return {
    items: items.slice((current - 1) * size, current * size),
    current,
    total,
    urls: { previous: current > 1 ? pageUrl(base, current - 1) : undefined, next: current < total ? pageUrl(base, current + 1) : undefined },
    pageUrl: (n) => pageUrl(base, n),
  };
}

// Numéros de pages suivantes pour getStaticPaths (la page 1 est générée par la route de la liste).
export function extraPageNumbers(count: number, size = PAGE_SIZE): number[] {
  const total = Math.max(1, Math.ceil(count / size));
  return Array.from({ length: total - 1 }, (_, i) => i + 2);
}
