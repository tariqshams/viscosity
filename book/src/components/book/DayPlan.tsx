import { useEffect, useState } from 'react';
import { dueIds, loadDeck } from '../../lib/srs';
import { loadProgress, type Progress } from '../../lib/progress';
import { href } from '../../lib/url';

type Ch = { n: number; title: string; href: string | null };
type Day = { section: string; day: number; part: string; chapters: Ch[] };

const HEADINGS: Record<string, string> = {
  core: 'The core path: 30 days for experienced engineers',
  prelude: 'Prelude: new to programming? Start here',
  deep: 'Deep dives: after the core',
};
const LABEL: Record<string, string> = { core: 'Core day', prelude: 'Prelude day', deep: 'Deep-dive day' };

/** The day plan (core first, then the Prelude and the deep dives), with your progress and today's reviews. */
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
            {due > 0 ? <><a className="text-brand underline" href={href('/review/')}>review {due} {due === 1 ? 'card' : 'cards'}</a>, then </> : null}
            {current ? <>continue with <b>{LABEL[current.section]} {current.day}</b>.</> : <>you are all caught up on the written chapters.</>}
          </>
        )}
      </div>
      <ol className="m-0 grid list-none gap-3 p-0">
        {days.map((d, i) => {
          const doneCount = p ? d.chapters.filter((c) => p.done[c.n]).length : 0;
          const heading = i === 0 || days[i - 1].section !== d.section ? HEADINGS[d.section] : null;
          return (
            <li key={`${d.section}-${d.day}`} className="contents">
            {heading && <h2 className="mt-6 font-display text-xl font-semibold first:mt-0">{heading}</h2>}
            <div className={`border bg-panel px-4 py-3 ${current === d ? 'border-brand' : 'border-line'}`} data-day={d.day} data-section={d.section}>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-semibold">{LABEL[d.section]} {d.day}</span>
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
            </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
