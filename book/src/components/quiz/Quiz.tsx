import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { md } from '../../lib/md.js';
import { loadProgress, saveProgress } from '../../lib/progress';

/**
 * The end-of-chapter multiple-choice check. Every option carries an
 * explanation, so a wrong pick teaches as much as a right one.
 */
export interface QuizOption { t: string; correct?: boolean; why: string }
export interface QuizQuestion { q: string; options: QuizOption[] }

export default function Quiz({ ch, questions }: { ch: number; questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    const p = loadProgress();
    if (p.quiz[ch] !== undefined) setBest(p.quiz[ch]);
  }, [ch]);

  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p !== null && questions[i].options[p].correct).length;
  const finished = answered === questions.length;

  useEffect(() => {
    if (!finished) return;
    const score = correct / questions.length;
    const p = loadProgress();
    if (p.quiz[ch] === undefined || score > p.quiz[ch]) {
      p.quiz[ch] = score;
      saveProgress(p);
      setBest(score);
    }
  }, [finished, correct, ch, questions.length]);

  return (
    <section className="prompt-card not-prose my-10 font-sans" aria-label="Chapter quiz" data-quiz>
      <div className="flex items-baseline gap-3 border-b-2 border-ink pb-2">
        <h2 className="m-0 font-display text-2xl font-semibold">Check your understanding</h2>
        <span className="ml-auto text-sm text-muted">{answered}/{questions.length}</span>
      </div>
      <ol className="m-0 list-none p-0">
        {questions.map((qq, qi) => {
          const p = picked[qi];
          return (
            <li key={qi} className="border-b border-line py-5" data-question={qi}>
              <div className="flex gap-2">
                <span className="font-semibold text-muted">{qi + 1}.</span>
                <div className="md min-w-0 flex-1 text-[1.02rem] font-semibold leading-snug [&_p]:m-0" dangerouslySetInnerHTML={{ __html: md(qq.q) }} />
              </div>
              <div className="mt-3 grid gap-2" role="radiogroup">
                {qq.options.map((o, oi) => {
                  const chosen = p === oi;
                  const show = p !== null && (chosen || o.correct);
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      disabled={p !== null}
                      onClick={() => setPicked((arr) => arr.map((x, i) => (i === qi ? oi : x)))}
                      className={clsx(
                        'w-full border px-3 py-2.5 text-left text-[0.98rem] transition-colors disabled:cursor-default',
                        p === null && 'border-line bg-panel hover:border-brand',
                        show && o.correct && 'border-safe bg-safe/10',
                        show && chosen && !o.correct && 'border-danger bg-danger/10',
                        p !== null && !show && 'border-line bg-panel opacity-60',
                      )}
                      data-option={oi}
                    >
                      <span className="flex gap-2">
                        <span className="w-4 shrink-0 font-semibold">
                          {show ? (o.correct ? '✓' : '✗') : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="md min-w-0 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: md(o.t) }} />
                      </span>
                      {show && (
                        <span className="md mt-1.5 block pl-6 text-[0.92rem] leading-relaxed text-ink/85 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: md(o.why) }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
      {finished && (
        <div className="fade-up mt-5 flex flex-wrap items-center gap-3" aria-live="polite" data-quiz-score>
          <span className="font-display text-xl font-semibold">{correct}/{questions.length} correct</span>
          {best !== null && <span className="text-sm text-muted">Best: {Math.round(best * questions.length)}/{questions.length}</span>}
          <button type="button" className="btn-3d btn-3d-sm ml-auto px-3 py-1 text-sm" onClick={() => setPicked(questions.map(() => null))}>Try again</button>
        </div>
      )}
    </section>
  );
}
