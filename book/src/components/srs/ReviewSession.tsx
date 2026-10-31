import { useEffect, useMemo, useRef, useState } from 'react';
import { md } from '../../lib/md.js';
import { describeDue, dueIds, exportDeck, importDeck, loadDeck, review, saveDeck, type Deck } from '../../lib/srs';
import type { PromptItem } from './Prompts';

type Catalog = Record<string, PromptItem & { ch: number; chTitle: string; href: string }>;

/** The /review page: work through every card that is due today. */
export default function ReviewSession({ catalog }: { catalog: Catalog }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = loadDeck();
    setDeck(d);
    setQueue(dueIds(d).filter((id) => catalog[id]));
  }, [catalog]);

  const stats = useMemo(() => {
    if (!deck) return null;
    const ids = Object.keys(deck.cards).filter((id) => catalog[id]);
    const next = ids
      .map((id) => deck.cards[id])
      .filter((c) => new Date(c.due) > new Date())
      .sort((a, b) => a.due.localeCompare(b.due))[0];
    return { collected: ids.length, next };
  }, [deck, queue]);

  if (!deck) return <p className="text-muted">Loading your deck…</p>;

  const id = queue[0];
  const item = id ? catalog[id] : null;

  const answer = (remembered: boolean) => {
    const d = loadDeck();
    review(d, id, item!.ch, remembered);
    saveDeck(d);
    setDeck(d);
    setRevealed(false);
    setDoneCount((n) => n + 1);
    // FSRS has already rescheduled it (sooner if forgotten), so move on.
    setQueue((q) => q.slice(1));
  };

  const doExport = () => {
    const blob = new Blob([exportDeck(loadDeck())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `viscosity-review-deck-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doImport = async (f: File) => {
    try {
      const d = importDeck(await f.text());
      saveDeck(d);
      setDeck(d);
      setQueue(dueIds(d).filter((x) => catalog[x]));
      setMsg(`Imported ${Object.keys(d.cards).length} cards.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="prompt-card font-sans">
      {item ? (
        <div className="border border-line bg-panel" data-review-card>
          <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-muted">
            <span>{queue.length} due</span>
            <span aria-hidden>·</span>
            <a className="truncate underline underline-offset-2" href={item.href}>Ch. {item.ch}: {item.chTitle}</a>
          </div>
          <div className="px-4 py-5">
            <div className="md text-[1.1rem] font-semibold leading-snug [&_p]:m-0" dangerouslySetInnerHTML={{ __html: md(item.q) }} />
            {!revealed ? (
              <button type="button" className="btn-3d btn-3d-primary mt-5 w-full px-4 py-2 text-base font-semibold sm:w-auto" onClick={() => setRevealed(true)} data-reveal>
                Show answer
              </button>
            ) : (
              <>
                <div className="fade-up mt-4 border-l-2 border-brand pl-3 text-[1.02rem] leading-relaxed">
                  <div className="md [&_p]:my-1" dangerouslySetInnerHTML={{ __html: md(item.a) }} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:flex">
                  <button type="button" className="btn-3d px-4 py-2 text-base" onClick={() => answer(false)} data-forgot>Forgot</button>
                  <button type="button" className="btn-3d btn-3d-primary px-4 py-2 text-base font-semibold" onClick={() => answer(true)} data-remembered>Remembered</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-line bg-panel px-4 py-6 text-center" data-review-empty>
          <div className="font-display text-2xl font-semibold">{doneCount > 0 ? 'Done for now' : 'Nothing due'}</div>
          <p className="mt-2 text-muted">
            {stats && stats.collected === 0
              ? 'Cards join your deck when you answer the “Quick recall” prompts inside the chapters.'
              : stats?.next
                ? `${stats.collected} cards in your deck. The next one is due ${describeDue(stats.next)}.`
                : `${stats?.collected ?? 0} cards in your deck.`}
          </p>
          {doneCount > 0 && <p className="mt-1 text-sm text-muted">You reviewed {doneCount} {doneCount === 1 ? 'card' : 'cards'}.</p>}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Your deck lives only in this browser.</span>
        <button type="button" className="btn-3d btn-3d-sm px-3 py-1" onClick={doExport}>Export backup</button>
        <button type="button" className="btn-3d btn-3d-sm px-3 py-1" onClick={() => fileRef.current?.click()}>Import</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        {msg && <span className="text-muted" aria-live="polite">{msg}</span>}
      </div>
    </div>
  );
}
