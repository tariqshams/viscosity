import { describe, expect, it } from 'vitest';
import { describeDue, dueIds, exportDeck, importDeck, loadDeck, review, saveDeck, type Deck } from './srs';

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('srs deck', () => {
  const t0 = new Date('2026-01-01T09:00:00Z');

  it('collects a card when first answered and schedules it in the future', () => {
    const deck: Deck = { version: 1, cards: {} };
    const c = review(deck, '1.fn-what', 1, true, t0);
    expect(new Date(c.due).getTime()).toBeGreaterThan(t0.getTime());
    expect(c.reps).toBe(1);
    expect(dueIds(deck, t0)).toEqual([]);
  });

  it('remembering repeatedly spaces reviews further apart', () => {
    const deck: Deck = { version: 1, cards: {} };
    let now = t0;
    const gaps: number[] = [];
    for (let k = 0; k < 4; k++) {
      const c = review(deck, 'a', 1, true, now);
      const due = new Date(c.due);
      gaps.push(due.getTime() - now.getTime());
      now = due;
    }
    for (let k = 1; k < gaps.length; k++) expect(gaps[k]).toBeGreaterThan(gaps[k - 1]);
  });

  it('forgetting brings a card back sooner than remembering would', () => {
    const a: Deck = { version: 1, cards: {} };
    const b: Deck = { version: 1, cards: {} };
    review(a, 'x', 1, true, t0);
    review(b, 'x', 1, true, t0);
    const later = new Date(a.cards.x.due);
    const good = review(a, 'x', 1, true, later);
    const again = review(b, 'x', 1, false, later);
    expect(new Date(again.due).getTime()).toBeLessThan(new Date(good.due).getTime());
    expect(again.lapses).toBe(1);
  });

  it('reports due cards once their time comes', () => {
    const deck: Deck = { version: 1, cards: {} };
    const c = review(deck, 'x', 2, true, t0);
    expect(dueIds(deck, new Date(new Date(c.due).getTime() + 1000))).toEqual(['x']);
  });

  it('round-trips through storage and export/import', () => {
    const s = memStorage();
    const deck = loadDeck(s);
    review(deck, 'x', 3, true, t0);
    saveDeck(deck, s);
    const back = loadDeck(s);
    expect(back.cards.x.ch).toBe(3);
    expect(importDeck(exportDeck(back))).toEqual(back);
    expect(() => importDeck('{"nope":1}')).toThrow();
  });

  it('ignores corrupted storage', () => {
    const s = memStorage();
    s.setItem('viscosity:srs:v1', '{not json');
    expect(loadDeck(s).cards).toEqual({});
  });

  it('describes due dates in plain words', () => {
    const deck: Deck = { version: 1, cards: {} };
    const c = review(deck, 'x', 1, true, t0);
    expect(describeDue(c, t0)).toMatch(/tomorrow|in \d+ days|later today/);
    expect(describeDue({ ...c, due: t0.toISOString() }, t0)).toBe('now');
  });
});
