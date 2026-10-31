// The book's identity. The curriculum lives in ./outline/.
import { PARTS as OUTLINE_PARTS } from './outline/index.js';

export const BOOK = {
  title: 'Viscosity',
  subtitle: 'From a Little JavaScript to Engines and Compilers',
  author: 'Tariq Shams',
  edition: 'First edition',
  description:
    'An interactive book by Tariq Shams. It takes you from knowing if and for loops to building interpreters, virtual machines and Viscosity, a compiler that changes how data is laid out in memory. Everything runs in your browser.',
};

export const PARTS = OUTLINE_PARTS.map((p) => ({
  id: p.id, track: p.track, days: p.days, title: p.title, blurb: p.blurb,
  planned: p.chapters.map((c) => c.title),
}));

export const CHAPTERS_PER_DAY = 4;
