// When chapters are inserted, later chapters get new numbers
// (scripts/renumber.mjs). The review deck and progress are keyed by chapter
// number, so a reader's saved state is moved along with them: each store
// remembers how many renumberings it has seen and applies the rest.
import { RENUMBERINGS } from '../data/renumbering.js';

export const RENUMBER_COUNT = RENUMBERINGS.length;

// A renumbering is either a shift ({ after, by }: chapters after `after`
// move up by `by`) or an explicit map ({ map: { old: new } }), used when the
// book was reordered and some chapters were merged into one. An explicit
// map may also rename card keys ({ keys: { 'old.key': 'newKey' } }) where two
// merged chapters had cards with the same key.
type Shift = { after: number; by: number };
type Remap = { map: Record<string, number>; keys?: Record<string, string> };
const STEPS = RENUMBERINGS as unknown as (Shift | Remap)[];

/** A chapter number from before renumbering `from`, as it is now. */
export function currentNumber(n: number, from: number): number {
  for (const s of STEPS.slice(from)) {
    if ('map' in s) n = s.map[String(n)] ?? n;
    else if (n > s.after) n += s.by;
  }
  return n;
}

/** A card id ("<chapter>.<key>") from before renumbering `from`, as it is now. */
export function currentCardId(id: string, from: number): string {
  let ch = Number(id.slice(0, id.indexOf('.')));
  let key = id.slice(id.indexOf('.') + 1);
  for (const s of STEPS.slice(from)) {
    if ('map' in s) {
      key = s.keys?.[`${ch}.${key}`] ?? key;
      ch = s.map[String(ch)] ?? ch;
    } else if (ch > s.after) ch += s.by;
  }
  return `${ch}.${key}`;
}

/** A chapter slug (NNN-name) from before renumbering `from`, as it is now. */
export function currentSlug(slug: string, from: number): string {
  const m = slug.match(/^(\d{3})(-.*)$/);
  return m ? `${String(currentNumber(Number(m[1]), from)).padStart(3, '0')}${m[2]}` : slug;
}
