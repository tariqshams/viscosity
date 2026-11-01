// Every internal URL goes through href(), so the book works under its base
// path (astro.config.mjs `base`, served at https://viscosity.dev/book/).
// href('/days/') -> '/book/days/'. External links and #anchors pass through.
export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function href(path: string): string {
  if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(path)) return path;
  return BASE + path.replace(/^\/+/, '');
}
