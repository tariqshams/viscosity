import { useEffect, useState } from 'react';
import { dueIds, loadDeck } from '../../lib/srs';

/** The "Review" link in the header, with how many cards are due now. */
export default function DueBadge() {
  const [due, setDue] = useState<number | null>(null);
  useEffect(() => {
    const sync = () => setDue(dueIds(loadDeck()).length);
    sync();
    const t = window.setInterval(sync, 60_000);
    window.addEventListener('srs-change', sync);
    return () => { window.clearInterval(t); window.removeEventListener('srs-change', sync); };
  }, []);
  return (
    <a href="/review/" className="btn-3d btn-3d-sm flex items-center gap-1.5 px-3 py-1 text-sm" aria-label={due ? `Review: ${due} due` : 'Review'}>
      Review
      {due ? <span className="min-w-[1.3rem] rounded-full bg-brand px-1.5 text-center text-xs font-bold text-[rgb(var(--brand-ink))]">{due}</span> : null}
    </a>
  );
}
