// When chapters are inserted, later chapters get new numbers
// (scripts/renumber.mjs). The review deck and progress are keyed by chapter
// number, so a reader's saved state is moved along with them: each store
// remembers how many renumberings it has seen and applies the rest.
import { RENUMBERINGS } from '../data/renumbering.js';

export const RENUMBER_COUNT = RENUMBERINGS.length;

/** A chapter number from before renumbering `from`, as it is now. */
export function currentNumber(n: number, from: number): number {
  for (const s of RENUMBERINGS.slice(from)) if (n > s.after) n += s.by;
  return n;
}

/** A chapter slug (NNN-name) from before renumbering `from`, as it is now. */
export function currentSlug(slug: string, from: number): string {
  const m = slug.match(/^(\d{3})(-.*)$/);
  return m ? `${String(currentNumber(Number(m[1]), from)).padStart(3, '0')}${m[2]}` : slug;
}
