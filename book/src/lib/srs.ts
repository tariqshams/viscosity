// The spaced-repetition store behind the book's review prompts.
//
// How it works (the "mnemonic medium" idea from Andy Matuschak and Michael
// Nielsen's Quantum Country):
//  - Prompts are embedded in the chapters. Answering one in the text
//    "collects" it: it becomes a card in your personal review deck.
//  - Each card is scheduled with FSRS (Free Spaced Repetition Scheduler,
//    Jarrett Ye et al.; implementation: ts-fsrs). Remembering pushes the
//    next review further out. Forgetting brings it back soon.
//  - Everything lives in this browser's localStorage. Nothing is sent
//    anywhere. Export/import gives you a backup.

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';

export const STORAGE_KEY = 'viscosity:srs:v1';

export interface StoredCard {
  /** FSRS state, with dates as ISO strings. */
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
  /** Chapter number the prompt came from. */
  ch: number;
  collected: string;
}

export interface Deck {
  version: 1;
  cards: Record<string, StoredCard>;
}

// Long-term scheduling only (no same-day "learning steps"). This matches the
// mnemonic-medium rhythm: answer in the text today, review in a few days.
const scheduler = fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: true }));

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

function storage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadDeck(s: StorageLike | null = storage()): Deck {
  if (!s) return { version: 1, cards: {} };
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, cards: {} };
    const d = JSON.parse(raw);
    if (d && d.version === 1 && typeof d.cards === 'object') return d as Deck;
  } catch {
    /* corrupted: start fresh rather than break the page */
  }
  return { version: 1, cards: {} };
}

export function saveDeck(deck: Deck, s: StorageLike | null = storage()): void {
  s?.setItem(STORAGE_KEY, JSON.stringify(deck));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('srs-change'));
}

function toCard(c: StoredCard): Card {
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  } as Card;
}

function fromCard(card: Card, ch: number, collected: string): StoredCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps ?? 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
    ch,
    collected,
  };
}

/** Record one answer. `remembered` maps to FSRS Good, otherwise Again. */
export function review(
  deck: Deck,
  id: string,
  ch: number,
  remembered: boolean,
  now: Date = new Date(),
): StoredCard {
  const existing = deck.cards[id];
  const card = existing ? toCard(existing) : createEmptyCard(now);
  const grade: Grade = remembered ? Rating.Good : Rating.Again;
  const next = scheduler.next(card, now, grade).card;
  const stored = fromCard(next, ch, existing?.collected ?? now.toISOString());
  deck.cards[id] = stored;
  return stored;
}

export function isDue(c: StoredCard, now: Date = new Date()): boolean {
  return new Date(c.due).getTime() <= now.getTime();
}

export function dueIds(deck: Deck, now: Date = new Date()): string[] {
  return Object.entries(deck.cards)
    .filter(([, c]) => isDue(c, now))
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

/** "in 3 days", "tomorrow", "later today". */
export function describeDue(c: StoredCard, now: Date = new Date()): string {
  const ms = new Date(c.due).getTime() - now.getTime();
  const days = Math.round(ms / 86_400_000);
  if (ms <= 0) return 'now';
  if (days <= 0) return 'later today';
  if (days === 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? 'in about a month' : `in about ${months} months`;
}

export function exportDeck(deck: Deck): string {
  return JSON.stringify(deck, null, 2);
}

export function importDeck(json: string): Deck {
  const d = JSON.parse(json);
  if (!d || d.version !== 1 || typeof d.cards !== 'object') throw new Error('Not a Viscosity review deck');
  return d as Deck;
}
