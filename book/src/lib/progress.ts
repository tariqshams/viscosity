// Chapter progress and quiz scores, kept in localStorage next to the deck.
import { RENUMBER_COUNT, currentNumber, currentSlug } from './renumber';

export const PROGRESS_KEY = 'viscosity:progress:v1';

export interface Progress {
  version: 1;
  /** chapter number -> ISO date it was marked done */
  done: Record<string, string>;
  /** chapter number -> best quiz score (0..1) */
  quiz: Record<string, number>;
  /** the last chapter slug opened, for "continue where you left off" */
  last?: string;
  /** How many chapter renumberings (src/data/renumbering.js) this has been migrated through. */
  renumbered?: number;
}

/** Progress is keyed by chapter number: move it to the current numbers. */
export function migrateProgress(p: Progress): Progress {
  const from = p.renumbered ?? 0;
  if (from >= RENUMBER_COUNT) return p;
  const re = (r: Record<string, any>) => Object.fromEntries(Object.entries(r).map(([n, v]) => [String(currentNumber(Number(n), from)), v]));
  return { ...p, done: re(p.done), quiz: re(p.quiz), last: p.last && currentSlug(p.last, from), renumbered: RENUMBER_COUNT };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 1) {
        const m = migrateProgress(p);
        if (m !== p) localStorage.setItem(PROGRESS_KEY, JSON.stringify(m));
        return m;
      }
    }
  } catch {
    /* ignore */
  }
  return { version: 1, done: {}, quiz: {}, renumbered: RENUMBER_COUNT };
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent('progress-change'));
  } catch {
    /* private mode etc. */
  }
}
