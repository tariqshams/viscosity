// Loads the chapters and their companion cards.js modules.
import { getCollection, type CollectionEntry } from 'astro:content';
import { PARTS, CHAPTERS_PER_DAY } from '../data/book.js';

export type Chapter = CollectionEntry<'chapters'>;

export interface Cards {
  prompts: Record<string, { q: string; a: string }>;
  quiz: { q: string; options: { t: string; correct?: boolean; why: string }[] }[];
  exercises?: Record<string, {
    title: string; prompt: string; starter: string; solution: string; tests: string;
    hints?: string[]; walkthrough?: string; optional?: boolean; wrong?: { code?: string; why: string }[]; lang?: 'js' | 'ts' | 'drip' | 'drip-vm' | 'rust';
  }>;
  examples?: Record<string, { title?: string; code: string; lang?: 'js' | 'ts' | 'drip' | 'drip-vm' | 'rust' }>;
}

const cardModules = import.meta.glob<Cards>('../content/chapters/*/cards.js', { eager: true });

export function cardsFor(id: string): Cards {
  const m = cardModules[`../content/chapters/${id}/cards.js`];
  if (!m) throw new Error(`chapter ${id} has no cards.js`);
  return m;
}

/** Which chapter is being rendered, from the page URL /chapters/NNN-slug/. */
export function chapterFromUrl(url: URL): { chapterId: string; n: number } {
  const m = url.pathname.match(/\/chapters\/((\d{3})-[^/]+)/);
  if (!m) throw new Error(`not a chapter page: ${url.pathname}`);
  return { chapterId: m[1], n: Number(m[2]) };
}

/** Global, stable id of a prompt: "<chapter number>.<key>", e.g. "1.fn-what". */
export const promptId = (n: number, key: string) => `${n}.${key}`;

export async function allChapters(): Promise<Chapter[]> {
  return (await getCollection('chapters')).sort((a, b) => a.data.n - b.data.n);
}

export const chapterHref = (c: Chapter) => `/chapters/${c.id}/`;

/** The whole curriculum, written or planned, grouped into days. */
export async function curriculum() {
  const written = await allChapters();
  const byN = new Map(written.map((c) => [c.data.n, c]));
  const entries: { n: number; title: string; part: string; href: string | null }[] = [];
  let n = 1;
  for (const part of PARTS) {
    const [d0, d1] = part.days.split('–').map(Number);
    const count = ((d1 ?? d0) - d0 + 1) * CHAPTERS_PER_DAY;
    for (let k = 0; k < count; k++, n++) {
      const w = byN.get(n);
      const planned = part.planned?.[k];
      entries.push({
        n,
        part: part.id,
        title: w ? w.data.title : planned ?? `Part ${part.id}, chapter ${k + 1}`,
        href: w ? chapterHref(w) : null,
      });
    }
  }
  const days: { day: number; part: string; chapters: typeof entries }[] = [];
  for (let i = 0; i < entries.length; i += CHAPTERS_PER_DAY) {
    const chunk = entries.slice(i, i + CHAPTERS_PER_DAY);
    days.push({ day: i / CHAPTERS_PER_DAY + 1, part: chunk[0].part, chapters: chunk });
  }
  return { entries, days };
}
