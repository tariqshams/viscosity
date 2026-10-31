import { useEffect, useState } from 'react';
import { dueIds, loadDeck } from '../../lib/srs';
import { loadProgress, type Progress } from '../../lib/progress';

type Ch = { n: number; title: string; href: string | null };
type Day = { day: number; part: string; chapters: Ch[] };

/** The 30 + 20 day plan, with your progress and today's reviews. */
export default function DayPlan({ days }: { days: Day[] }) {
  const [p, setP] = useState<Progress | null>(null);
  const [due, setDue] = useState(0);
  useEffect(() => {
    setP(loadProgress());
    setDue(dueIds(loadDeck()).length);
  }, []);
  const current = p ? days.find((d) => d.chapters.some((c) => c.href && !p.done[c.n])) : undefined;
  return (
    <div className="font-sans">
      <div className="mb-6 border border-line bg-panel px-4 py-3 text-[0.98rem]" data-today>
        {p === null ? 'Loading your progress…' : (
          <>
            <b>Today:</b>{' '}
            {due > 0 ? <><a className="text-brand underline" href="/review/">review {due} {due === 1 ? 'card' : 'cards'}</a>, then </> : null}
            {current ? <>continue with <b>Day {current.day}</b>.</> : <>you are all caught up on the written chapters.</>}
          </>
        )}
      </div>
      <ol className="m-0 grid list-none gap-3 p-0">
        {days.map((d) => {
          const doneCount = p ? d.chapters.filter((c) => p.done[c.n]).length : 0;
          return (
            <li key={d.day} className={`border bg-panel px-4 py-3 ${current?.day === d.day ? 'border-brand' : 'border-line'}`} data-day={d.day}>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-semibold">Day {d.day}</span>
                <span className="text-xs text-muted">Part {d.part}</span>
                <span className="ml-auto text-xs tabular-nums text-muted">{doneCount}/{d.chapters.length}</span>
              </div>
              <ul className="m-0 mt-1 list-none p-0 text-[0.95rem]">
                {d.chapters.map((c) => (
                  <li key={c.n} className="flex gap-2 py-0.5">
                    <span className="w-7 shrink-0 text-right tabular-nums text-muted">{c.n}</span>
                    {c.href ? <a href={c.href} className="hover:text-brand">{c.title}</a> : <span className="text-muted">{c.title} <span className="text-xs">(coming)</span></span>}
                    {p?.done[c.n] && <span className="text-safe" aria-label="done">✓</span>}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
