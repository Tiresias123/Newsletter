// Interface de recherche dans le navigateur (fenêtre et page /recherche/) : saisie et filtres, résultats groupés
// par type, « Voir plus » (fenêtre) ou « Afficher plus » (page), flèches pour parcourir les résultats.
// Ne connaît que le contrat SearchProvider.
import { formatDate } from '../format.ts';
import type { FilterKey, FilterLabels, SearchFilters, SearchGroup, SearchHit, SearchProvider } from './types.ts';

type Messages = Record<'none' | 'prompt' | 'loading' | 'unavailable' | 'error' | 'seeMore' | 'showMore' | 'group', string> & { results: { one: string; other: string } };
type Config = { labels: Partial<FilterLabels>; messages: Messages };

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

export function mountSearch(root: HTMLElement, provider: SearchProvider & { preload?(term: string): void }) {
  const mode = root.dataset.mode === 'page' ? 'page' : 'modal';
  const perGroup = mode === 'page' ? 10 : 5;
  const config = JSON.parse(root.querySelector('script[data-search-config]')?.textContent ?? '{}') as Config;
  const form = root.querySelector<HTMLFormElement>('form[data-search-form]');
  const input = root.querySelector<HTMLInputElement>('input[name="q"]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  const output = root.querySelector<HTMLElement>('[data-search-results]');
  const selects = [...root.querySelectorAll<HTMLSelectElement>('select[data-filter]')];
  if (!form || !input || !status || !output) return { run: () => undefined };
  const { labels, messages } = config;
  let token = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const filters = (): SearchFilters => Object.fromEntries(selects.map((s) => [s.name, s.value]).filter(([, v]) => v));
  // Filtres fixés par l'adresse (catégorie venue d'un hub) sans liste déroulante dans cette interface.
  const fixed: SearchFilters = {};

  const hitElement = (hit: SearchHit) => {
    const item = document.createElement('li');
    item.className = 'search-hit';
    const link = document.createElement('a');
    link.href = hit.url;
    link.className = 'search-hit-link';
    link.textContent = hit.title;
    item.append(link);
    const meta = [hit.date && hit.date !== '0000-00-00' ? formatDate(hit.date) : '', hit.category ?? ''].filter(Boolean).join(' · ');
    if (meta) item.append(Object.assign(document.createElement('p'), { className: 'search-hit-meta', textContent: meta }));
    const excerpt = document.createElement('p');
    excerpt.className = 'search-hit-excerpt';
    // Extrait fourni par Pagefind : entités déjà échappées, seules des balises <mark> sont ajoutées.
    excerpt.innerHTML = hit.excerpt;
    item.append(excerpt);
    return item;
  };

  const groupElement = (group: SearchGroup, query: string, current: SearchFilters) => {
    const section = document.createElement('section');
    section.className = 'search-group';
    const heading = document.createElement(mode === 'page' ? 'h2' : 'h3');
    heading.className = 'search-group-title';
    heading.textContent = fill(messages.group, { type: labels.type?.[group.type] ?? group.type, count: group.total });
    const list = document.createElement('ol');
    list.className = 'search-hits';
    list.append(...group.hits.map(hitElement));
    section.append(heading, list);
    if (group.total > group.hits.length) {
      if (mode === 'modal') {
        const params = new URLSearchParams({ ...current, q: query, type: group.type });
        const more = Object.assign(document.createElement('a'), { className: 'btn btn-pill', href: `/recherche/?${params}`, textContent: messages.seeMore });
        section.append(more);
      } else {
        const more = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-pill', textContent: messages.showMore });
        more.addEventListener('click', async () => {
          const shown = list.children.length;
          const next = await provider.more(query, { filters: current, type: group.type, offset: shown, count: perGroup });
          list.append(...next.map(hitElement));
          (list.children[shown]?.querySelector('a') as HTMLElement | null)?.focus();
          if (list.children.length >= group.total) more.remove();
        });
        section.append(more);
      }
    }
    return section;
  };

  const syncUrl = (query: string, current: SearchFilters) => {
    if (mode !== 'page') return;
    const params = new URLSearchParams(Object.entries({ q: query, ...current }).filter(([, v]) => v) as Array<[string, string]>);
    history.replaceState(null, '', params.size > 0 ? `?${params}` : location.pathname);
  };

  const run = async () => {
    const query = input.value.trim();
    const current = { ...fixed, ...filters() };
    const id = ++token;
    syncUrl(query, current);
    if (!query && Object.keys(current).length === 0) {
      output.replaceChildren();
      status.textContent = messages.prompt;
      return;
    }
    status.textContent = messages.loading;
    try {
      const response = await provider.search(query, { filters: current, perGroup });
      if (id !== token) return;
      output.replaceChildren(...response.groups.map((g) => groupElement(g, query, current)));
      status.textContent = response.total === 0 ? messages.none : fill(response.total === 1 ? messages.results.one : messages.results.other, { count: response.total });
    } catch (error) {
      if (id !== token) return;
      output.replaceChildren();
      status.textContent = error instanceof TypeError ? messages.unavailable : messages.error;
    }
  };

  input.addEventListener('input', () => {
    provider.preload?.(input.value);
    clearTimeout(timer);
    timer = setTimeout(run, 250);
  });
  for (const select of selects) select.addEventListener('change', run);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void run();
  });

  // Flèches : du champ vers le premier résultat, puis d'un résultat à l'autre.
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const links = [...output.querySelectorAll<HTMLAnchorElement>('.search-hit-link')];
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.target === input && event.key === 'ArrowDown' && links[0]) {
      event.preventDefault();
      links[0].focus();
    } else if (index >= 0) {
      event.preventDefault();
      const next = event.key === 'ArrowDown' ? links[index + 1] : (links[index - 1] ?? input);
      next?.focus();
    }
  });

  // Page /recherche/ : critères repris de l'adresse (formulaire d'un hub, lien « Voir plus »).
  if (mode === 'page') {
    const params = new URLSearchParams(location.search);
    input.value = params.get('q') ?? '';
    for (const key of Object.keys(labels) as FilterKey[]) {
      const value = params.get(key);
      if (!value || !(value in (labels[key] ?? {}))) continue;
      const select = selects.find((s) => s.name === key);
      if (select) select.value = value;
      else fixed[key] = value;
    }
    void run();
  }
  return { run };
}
