import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { md } from '../../lib/md.js';
import { describeDue, loadDeck, review, saveDeck, type StoredCard } from '../../lib/srs';

/**
 * Review prompts embedded in the text, as in Quantum Country's mnemonic
 * medium. Recall the answer, reveal it, then say honestly whether you
 * remembered. Answering collects the card into your review deck, and FSRS
 * schedules when you'll see it again.
 */

export interface PromptItem { id: string; q: string; a: string }

export default function Prompts({ ch, items }: { ch: number; items: PromptItem[] }) {
  const [cards, setCards] = useState<Record<string, StoredCard>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const sync = () => setCards({ ...loadDeck().cards });
    sync();
    setLoaded(true);
    window.addEventListener('srs-change', sync);
    return () => window.removeEventListener('srs-change', sync);
  }, []);

  const collected = items.filter((p) => cards[p.id]).length;
  return (
    <aside className="prompt-card not-prose my-8 border border-line bg-panel" aria-label="Review prompts">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="text-brand"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm1.7-6.6-.9.9c-.7.7-1.3 1.3-1.3 2.7h-1.9v-.5c0-1.1.4-2 1.1-2.7l1.2-1.2c.4-.4.6-.8.6-1.4a2 2 0 0 0-4 0H7.6a4 4 0 0 1 8 0c0 .8-.3 1.6-.9 2.2Z"/></svg>
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand">Quick recall</span>
        <span className="ml-auto text-xs text-muted">{loaded ? `${collected}/${items.length} in your deck` : ''}</span>
      </div>
      <ol className="m-0 list-none p-0">
        {items.map((p, i) => (
          <PromptCard key={p.id} item={p} ch={ch} card={cards[p.id]} last={i === items.length - 1} />
        ))}
      </ol>
    </aside>
  );
}

export function PromptCard({ item, ch, card, last, onDone }: {
  item: PromptItem; ch: number; card?: StoredCard; last?: boolean; onDone?: (remembered: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const answer = (remembered: boolean) => {
    const deck = loadDeck();
    review(deck, item.id, ch, remembered);
    saveDeck(deck);
    setAnswered(remembered);
    onDone?.(remembered);
  };
  return (
    <li className={clsx('px-3 py-3', !last && 'border-b border-line')} data-prompt={item.id}>
      <div className="md text-[1rem] font-semibold leading-snug [&_p]:m-0" dangerouslySetInnerHTML={{ __html: md(item.q) }} />
      {!revealed && !card && (
        <button type="button" className="btn-3d btn-3d-sm mt-2.5 px-3 py-1 text-sm" onClick={() => setRevealed(true)} data-reveal>
          Show answer
        </button>
      )}
      {!revealed && card && answered === null && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>In your deck · next review {describeDue(card)}</span>
          <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => setRevealed(true)}>show answer</button>
        </div>
      )}
      {revealed && (
        <div className="fade-up mt-2 border-l-2 border-brand pl-3">
          <div className="md text-[0.98rem] leading-relaxed [&_p]:my-1" dangerouslySetInnerHTML={{ __html: md(item.a) }} />
          {answered === null && !card && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" className="btn-3d btn-3d-sm px-3 py-1 text-sm" onClick={() => answer(false)} data-forgot>Forgot</button>
              <button type="button" className="btn-3d btn-3d-sm btn-3d-primary px-3 py-1 text-sm" onClick={() => answer(true)} data-remembered>Remembered</button>
            </div>
          )}
          {answered !== null && (
            <div className="mt-2 text-sm text-muted" aria-live="polite">
              {answered ? 'Saved. It will come back in a few days.' : 'Saved. It will come back soon.'}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
