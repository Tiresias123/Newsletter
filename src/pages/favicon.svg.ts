// Favicon dérivé du thème : pictogramme « la règle dans la grille » dans la couleur primaire.
import type { APIRoute } from 'astro';
import { getConfig } from '../lib/config/index.ts';

export const GET: APIRoute = () => {
  const color = getConfig().theme.colors.brand['600'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="0.5" y="0.5" width="15" height="15" rx="2" fill="#fff" stroke="${color}"/><path d="M4.5 .5v15M8 .5v15M11.5 .5v15M.5 4.5h15M.5 8h15M.5 11.5h15" stroke="${color}" stroke-opacity=".45" stroke-width=".75"/><rect x="8" y="4.5" width="3.5" height="3.5" fill="${color}"/></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
