import { describe, expect, it, vi } from 'vitest';

// A shift, then an explicit reorder that merges old 7 and 8 into new 3, moves
// 3 to 9, and renames the colliding key 8.dup.
vi.mock('../data/renumbering.js', () => ({
  RENUMBERINGS: [{ after: 4, by: 2 }, { map: { '3': 9, '9': 3, '10': 3 }, keys: { '10.dup': 'b-dup' } }],
}));

const { currentNumber, currentSlug, currentCardId } = await import('./renumber');
const { migrateDeck } = await import('./srs');
const { migrateProgress } = await import('./progress');

const card = { due: '', stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, state: 0, collected: '' };

describe('explicit remaps', () => {
  it('applies a shift and then a many-to-one map', () => {
    expect(currentNumber(7, 0)).toBe(3); // 7 -> 9 -> 3
    expect(currentNumber(8, 0)).toBe(3); // 8 -> 10 -> 3
    expect(currentNumber(3, 0)).toBe(9);
    expect(currentNumber(2, 0)).toBe(2); // not in the map: unchanged
    expect(currentNumber(9, 1)).toBe(3); // already shifted
    expect(currentSlug('007-tokens', 0)).toBe('003-tokens');
  });

  it('renames colliding card keys while merging', () => {
    expect(currentCardId('7.dup', 0)).toBe('3.dup');
    expect(currentCardId('8.dup', 0)).toBe('3.b-dup');
    expect(currentCardId('3.x', 0)).toBe('9.x');
  });

  it('moves a deck through the merge without losing either card', () => {
    const d = migrateDeck({ version: 1, cards: { '7.dup': { ...card, ch: 7 }, '8.dup': { ...card, ch: 8 } } });
    expect(Object.keys(d.cards).sort()).toEqual(['3.b-dup', '3.dup']);
    expect(d.cards['3.b-dup'].ch).toBe(3);
  });

  it('moves progress through the merge', () => {
    const p = migrateProgress({ version: 1, done: { '7': 'a', '2': 'b' }, quiz: {}, last: '008-x', renumbered: 0 });
    expect(p.done).toEqual({ '3': 'a', '2': 'b' });
    expect(p.last).toBe('003-x');
  });
});
