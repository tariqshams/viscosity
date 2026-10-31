import { useState } from 'react';
import { Svg } from '../../viz/svg';
import FormChips from './FormChips';
import { RULES, apply, chipW, leftmost, ruleText } from './grammar';

const MAX_W = 384;
const width = (form: string[]) => form.reduce((w, s) => w + chipW(s) + 4, 0);

/** Turn a finished sentence into Drip source, numbering the NUMBERs. */
function asDrip(form: string[]) {
  let n = 0;
  return form
    .map((s) => (s === 'NUMBER' ? String(++n) : s))
    .join(' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')')
    .replace(/ ;/g, ';');
}

/** Derive your own sentence: pick a rule for the leftmost nonterminal. */
export default function DerivePlay() {
  const [history, setHistory] = useState<string[][]>([['stmt']]);
  const form = history[history.length - 1];
  const lm = leftmost(form);
  const done = lm === -1;
  const choices = done ? [] : RULES.map((r, k) => ({ r, k })).filter(({ r }) => r.lhs === form[lm]);
  return (
    <figure className="figure not-prose">
      <div className="border border-line bg-panel">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand">Try it</span>
          <span className="min-w-0 truncate text-sm font-semibold">Derive your own sentence</span>
        </div>
        <div className="px-3 pb-2 pt-3">
          <Svg w={400} h={56} title="The current string of symbols. The leftmost nonterminal is underlined.">
            <FormChips form={form} y={8} />
          </Svg>
        </div>
        <div className="min-h-[4.2em] border-t border-line px-3 py-2.5 text-[0.98rem] leading-relaxed" aria-live="polite">
          {done ? (
            <>No nonterminals left: this is a sentence. As Drip source it could be <code>{asDrip(form)}</code> ({history.length - 1} steps).</>
          ) : (
            <>Replace the underlined <code>{form[lm]}</code>. Pick one of its rules:</>
          )}
        </div>
        {!done && (
          <div className="flex flex-wrap gap-2 border-t border-line px-3 py-2.5">
            {choices.map(({ r, k }) => {
              const next = apply(form, r);
              const tooBig = width(next) > MAX_W;
              return (
                <button key={k} type="button" className="btn-3d px-3 py-1.5 font-mono text-sm" disabled={tooBig} title={tooBig ? 'That would no longer fit on the screen' : undefined} onClick={() => setHistory([...history, next])}>
                  {ruleText(r)}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
          <button type="button" className="btn-3d px-4 py-1.5 text-sm" disabled={history.length === 1} onClick={() => setHistory(history.slice(0, -1))}>← Undo</button>
          <button type="button" className="btn-3d px-4 py-1.5 text-sm" disabled={history.length === 1} onClick={() => setHistory([['stmt']])}>Start again</button>
          <span className="ml-auto font-mono text-xs tabular-nums text-muted">{history.length - 1} steps</span>
        </div>
      </div>
    </figure>
  );
}
