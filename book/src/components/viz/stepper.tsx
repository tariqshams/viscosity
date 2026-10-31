import { useCallback, useState, type KeyboardEvent, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Step through a list of states at your own pace (no autoplay: pacing
 * belongs to the reader). Adapted from the stepper in the interview-bootcamp
 * site, simplified for touch: big Back / Next buttons and arrow keys.
 */
export function useSteps<S>(states: S[]) {
  const [i, setI] = useState(0);
  const n = states.length;
  const go = useCallback((j: number) => setI(Math.max(0, Math.min(n - 1, j))), [n]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  };
  return { i, n, state: states[i], back: () => go(i - 1), next: () => go(i + 1), reset: () => go(0), atStart: i === 0, atEnd: i === n - 1, onKeyDown };
}

/** The frame for every interactive diagram: title, picture, a caption that
 *  says what to notice right now, and the step controls. */
export function StepFrame({ title, steps, children, note, label }: {
  title: string;
  steps: ReturnType<typeof useSteps<any>>;
  children: ReactNode;
  note: ReactNode;
  label?: string;
}) {
  return (
    <figure className="figure not-prose" data-stepper>
      <div
        className="border border-line bg-panel outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        tabIndex={0}
        role="group"
        aria-label={label ?? `${title}. Use the left and right arrow keys to step.`}
        onKeyDown={steps.onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand">Step through</span>
          <span className="min-w-0 truncate text-sm font-semibold">{title}</span>
        </div>
        <div className="px-3 pb-2 pt-3">{children}</div>
        <div className="min-h-[4.2em] border-t border-line px-3 py-2.5 text-[0.98rem] leading-relaxed" aria-live="polite">{note}</div>
        <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
          <button type="button" className="btn-3d px-4 py-1.5 text-sm" onClick={steps.back} disabled={steps.atStart} aria-label="Previous step">← Back</button>
          <button type="button" className={clsx('btn-3d btn-3d-primary px-4 py-1.5 text-sm font-semibold')} onClick={steps.atEnd ? steps.reset : steps.next} data-next>
            {steps.atEnd ? 'Start again' : 'Next →'}
          </button>
          <span className="ml-auto font-mono text-xs tabular-nums text-muted">{steps.i + 1}/{steps.n}</span>
        </div>
      </div>
    </figure>
  );
}

/** A code listing with one line highlighted (the line being explained). */
export function CodeTrace({ code, line }: { code: string; line: number | null }) {
  return (
    <pre className="code-surface !my-0 !border-line font-mono">
      {code.split('\n').map((l, k) => (
        <div key={k} className={clsx('-mx-[0.85rem] px-[0.85rem]', k === line ? 'bg-brand/15 shadow-[inset_3px_0_0_rgb(var(--brand))]' : '')}>
          {l || ' '}
        </div>
      ))}
    </pre>
  );
}
