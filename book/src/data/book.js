// The book's identity. The curriculum lives in ./outline/.
import { PARTS as OUTLINE_PARTS } from './outline/index.js';

export const BOOK = {
  title: 'Viscosity',
  subtitle: 'Viscosity’s internals, and how to learn compiler engineering from scratch',
  author: 'Tariq Shams',
  edition: 'First edition',
  description:
    'Tariq Shams’s book on how Viscosity, an automatic ahead-of-time Array of Structures to Structures of Arrays compiler, works, and how anyone, beginner or expert, can learn to build a language, a compiler and Viscosity itself, first in TypeScript and then in Rust.',
};

export const PARTS = OUTLINE_PARTS.map((p) => ({
  id: p.id, track: p.track, days: p.days, title: p.title, blurb: p.blurb,
  planned: p.chapters.map((c) => c.title),
}));

export const CHAPTERS_PER_DAY = 4;

/** Chapters in the whole curriculum (written and planned), and the days they take. */
export const TOTAL_CHAPTERS = OUTLINE_PARTS.reduce((n, p) => n + p.chapters.length, 0);
export const TOTAL_DAYS = Math.ceil(TOTAL_CHAPTERS / CHAPTERS_PER_DAY);
