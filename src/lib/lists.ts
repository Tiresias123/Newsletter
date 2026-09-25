// Outils des pages de liste : pastilles de lien d'un hub (tirées du menu), routes paginées et titres de page.
import { getConfig } from './config/index.ts';
import { t } from './i18n.ts';
import { extraPageNumbers, PAGE_SIZE } from './pagination.ts';

// Pastilles d'un hub : les sous-entrées actives de l'entrée du menu qui pointe vers ce hub (DA, maquette 12.5).
export function hubLinks(url: string): Array<{ label: string; url: string }> {
  const item = getConfig().navigation.header.find((entry) => entry.enabled && entry.url === url);
  return (item?.children ?? []).filter((child) => child.enabled).map((child) => ({ label: child.label, url: child.url }));
}

// Chemins d'une liste paginée pour une route à paramètre de reste ([...page]) : la page 1 à l'adresse de la
// liste, les suivantes à « page/2 », « page/3 »…
export function pagedPaths<P extends Record<string, string>>(params: P, count: number, size = PAGE_SIZE) {
  return [
    { params: { ...params, page: undefined }, props: { current: 1 } },
    ...extraPageNumbers(count, size).map((n) => ({ params: { ...params, page: `page/${n}` }, props: { current: n } })),
  ];
}

// Titre et description d'une page de liste : « Réglementation, page 2 » à partir de la deuxième page.
export function pagedTitle(title: string, current: number): string {
  return current > 1 ? t('lists.pageTitle', { title, n: current }) : title;
}

// Sous ce nombre de contenus, une liste de thème, d'étiquette ou de format reste hors des moteurs (ARCHITECTURE 8.2).
export const THIN_LIST = 3;

// Cartes « à la une » en tête de la première page d'un hub de catégorie (DA, maquette 12.5).
export const HUB_FEATURED = 3;
