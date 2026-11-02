// Loads the chapters and their companion cards.js modules.
import { getCollection, type CollectionEntry } from 'astro:content';
import { PARTS, CHAPTERS_PER_DAY } from '../data/book.js';
import { OUTLINE } from '../data/outline/index.js';
import { href } from './url';

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

export const chapterHref = (c: Chapter) => href(`/chapters/${c.id}/`);

export type Front = CollectionEntry<'front'>;
export const frontHref = (f: Front) => href(`/front/${f.id}/`);

/** The front matter in reading order: Preface, How to use this book, About the author. */
export async function frontMatter(): Promise<Front[]> {
  return (await getCollection('front')).sort((a, b) => a.data.order - b.data.order);
}

/** Where reading starts: the first front-matter page (the preface). */
export const START_HREF = href('/front/preface/');

/** One link in the reading order (front matter, then chapters). */
export interface ReadingLink { href: string; label: string }

/**
 * The whole book in reading order: every front-matter page, then every
 * chapter. Previous / Next links on every page follow this list, so the
 * preface always comes first and chapter 1's Previous is the last front page.
 */
export async function readingOrder(): Promise<(ReadingLink & { key: string })[]> {
  const front = (await frontMatter()).map((f) => ({ key: `front:${f.id}`, href: frontHref(f), label: f.data.title }));
  const chs = (await allChapters()).map((c) => ({ key: `chapter:${c.id}`, href: chapterHref(c), label: `${c.data.n}. ${c.data.title}` }));
  return [...front, ...chs];
}

/** Previous and next pages around one entry of readingOrder(). */
export async function neighbours(key: string): Promise<{ prev: ReadingLink | null; next: ReadingLink | null }> {
  const all = await readingOrder();
  const i = all.findIndex((e) => e.key === key);
  if (i < 0) throw new Error(`not in the reading order: ${key}`);
  return { prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}

/** The whole curriculum, written or planned, grouped into days. */
export async function curriculum() {
  // Every chapter, written or planned, in outline order. Parts no longer
  // start on day boundaries (chapters are inserted and split), so the part
  // of each chapter comes from the outline itself, not from day ranges.
  const written = await allChapters();
  const byN = new Map(written.map((c) => [c.data.n, c]));
  const entries: { n: number; title: string; part: string; href: string | null }[] = OUTLINE.map((c) => {
    const w = byN.get(c.n);
    return { n: c.n, part: c.part, title: w ? w.data.title : c.title, href: w ? chapterHref(w) : null };
  });
  const days: { day: number; part: string; chapters: typeof entries }[] = [];
  for (let i = 0; i < entries.length; i += CHAPTERS_PER_DAY) {
    const chunk = entries.slice(i, i + CHAPTERS_PER_DAY);
    days.push({ day: i / CHAPTERS_PER_DAY + 1, part: chunk[0].part, chapters: chunk });
  }
  return { entries, days };
}
