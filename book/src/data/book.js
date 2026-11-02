// The book's identity. The curriculum lives in ./outline/.
import { PARTS as OUTLINE_PARTS } from './outline/index.js';

export const BOOK = {
  title: 'Viscosity',
  subtitle: 'Viscosity’s internals, and compiler engineering from scratch',
  author: 'Tariq Shams',
  edition: 'First edition',
  description:
    'Tariq Shams’s book on how Viscosity, an automatic ahead-of-time Array of Structures to Structures of Arrays compiler, works, and how anyone, beginner or expert, can learn to build a language, a compiler and Viscosity itself, first in TypeScript and then in Rust.',
};

export const PARTS = OUTLINE_PARTS.map((p) => ({
  id: p.id, section: p.section, track: p.section, days: p.days, title: p.title, blurb: p.blurb,
  planned: p.chapters.map((c) => c.title),
}));

export const CHAPTERS_PER_DAY = 4;

/**
 * The book has three sections, read in this order: the Prelude (for readers
 * new to programming), the Core (the 30-day path for experienced engineers)
 * and the Deep dives. Days count within a section.
 */
export const SECTIONS = [
  { id: 'prelude', label: 'Prelude', long: 'Prelude: new to programming? Start here' },
  { id: 'core', label: 'Core', long: 'The core path: build it all in 30 days' },
  { id: 'deep', label: 'Deep dives', long: 'Deep dives: the theory, and everything else' },
];
const chaptersIn = (section) => OUTLINE_PARTS.filter((p) => p.section === section).reduce((n, p) => n + p.chapters.length, 0);
export const SECTION_DAYS = Object.fromEntries(SECTIONS.map((s) => [s.id, Math.ceil(chaptersIn(s.id) / CHAPTERS_PER_DAY)]));

/** Chapters in the whole book, and the days of the core path. */
export const TOTAL_CHAPTERS = OUTLINE_PARTS.reduce((n, p) => n + p.chapters.length, 0);
export const CORE_DAYS = SECTION_DAYS.core;
export const TOTAL_DAYS = CORE_DAYS;
