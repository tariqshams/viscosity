// Chapter progress and quiz scores, kept in localStorage next to the deck.
export const PROGRESS_KEY = 'viscosity:progress:v1';

export interface Progress {
  version: 1;
  /** chapter number -> ISO date it was marked done */
  done: Record<string, string>;
  /** chapter number -> best quiz score (0..1) */
  quiz: Record<string, number>;
  /** the last chapter slug opened, for "continue where you left off" */
  last?: string;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 1) return p;
    }
  } catch {
    /* ignore */
  }
  return { version: 1, done: {}, quiz: {} };
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent('progress-change'));
  } catch {
    /* private mode etc. */
  }
}
