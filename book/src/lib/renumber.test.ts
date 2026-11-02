import { describe, expect, it, vi } from 'vitest';

// Pretend two renumberings happened: after 29 by 3, then after 10 by 2.
vi.mock('../data/renumbering.js', () => ({ RENUMBERINGS: [{ after: 29, by: 3 }, { after: 10, by: 2 }] }));

const { currentNumber, currentSlug, RENUMBER_COUNT } = await import('./renumber');
const { migrateDeck } = await import('./srs');
const { migrateProgress } = await import('./progress');

describe('renumbering', () => {
  it('applies every step not yet seen, in order', () => {
    expect(RENUMBER_COUNT).toBe(2);
    expect(currentNumber(5, 0)).toBe(5);
    expect(currentNumber(12, 0)).toBe(14);
    expect(currentNumber(30, 0)).toBe(35);
    expect(currentNumber(30, 1)).toBe(32);
    expect(currentNumber(30, 2)).toBe(30);
    expect(currentSlug('030-grammars', 0)).toBe('035-grammars');
  });

  it('moves review cards to their new chapter numbers', () => {
    const card = { due: '', stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, state: 0, collected: '' };
    const d = migrateDeck({ version: 1, cards: { '30.bnf': { ...card, ch: 30 }, '1.fn': { ...card, ch: 1 } } });
    expect(Object.keys(d.cards).sort()).toEqual(['1.fn', '35.bnf']);
    expect(d.cards['35.bnf'].ch).toBe(35);
    expect(d.renumbered).toBe(2);
    expect(migrateDeck(d)).toBe(d);
  });

  it('moves progress, quiz scores and the last chapter', () => {
    const p = migrateProgress({ version: 1, done: { '30': 'x' }, quiz: { '12': 0.5 }, last: '030-grammars', renumbered: 1 });
    expect(p).toEqual({ version: 1, done: { '32': 'x' }, quiz: { '14': 0.5 }, last: '032-grammars', renumbered: 2 });
  });
});
