import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { md } from '../../lib/md.js';

/**
 * An editable, runnable code block that works on a phone.
 *  - CodeMirror 6 with touch-friendly settings (16px text so iOS doesn't zoom,
 *    no autocorrect / autocapitalise, wrapping instead of sideways scrolling)
 *  - a key bar with the symbols that are painful on a phone keyboard
 *  - code runs in a Web Worker with a time limit and a Stop button
 *  - exercise mode: hidden tests, progressive hints, and a worked solution
 */

export interface WrongAttempt { code?: string; why: string }
export interface RunnerProps {
  id: string;
  code: string;
  lang?: 'js' | 'ts';
  title?: string;
  /** exercise mode when tests are given */
  tests?: string;
  prompt?: string;
  hints?: string[];
  solution?: string;
  walkthrough?: string;
  wrong?: WrongAttempt[];
  /** "Extra practice": not counted in the chapter's 15 minutes */
  optional?: boolean;
  /** show console output immediately when the island loads */
  autorun?: boolean;
}

type Line = { level: string; text: string };
type TestResult = { name: string; ok: boolean; message?: string };

const KEYS: [string, string][] = [
  ['{', '{'], ['}', '}'], ['(', '('], [')', ')'], ['[', '['], [']', ']'],
  [';', ';'], ['=', '='], ['=>', ' => '], ['.', '.'], [',', ', '], ["'", "'"],
  ['`', '`'], ['+', '+'], ['<', '<'], ['>', '>'], ['!', '!'], ['&&', ' && '],
  ['||', ' || '], ['tab', '  '],
];

const TIME_LIMIT_MS = 3000;

export default function Runner(props: RunnerProps) {
  const { id, lang = 'js', tests } = props;
  const isExercise = typeof tests === 'string';
  const storeKey = `viscosity:code:${id}`;
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<any>(null);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [full, setFull] = useState(false);
  const [solved, setSolved] = useState(false);

  // Create the editor in the browser only (the server renders a <pre>).
  useEffect(() => {
    let destroyed = false;
    (async () => {
      const [{ EditorView, keymap, drawSelection }, { EditorState }, cmds, lang_, { syntaxHighlighting, indentUnit, bracketMatching }, { classHighlighter }] =
        await Promise.all([
          import('@codemirror/view'),
          import('@codemirror/state'),
          import('@codemirror/commands'),
          import('@codemirror/lang-javascript'),
          import('@codemirror/language'),
          import('@lezer/highlight'),
        ]);
      if (destroyed || !host.current) return;
      let saved: string | null = null;
      try { saved = localStorage.getItem(storeKey); } catch { /* ignore */ }
      const state = EditorState.create({
        doc: saved ?? props.code,
        extensions: [
          cmds.history(),
          drawSelection(),
          bracketMatching(),
          indentUnit.of('  '),
          EditorState.tabSize.of(2),
          keymap.of([
            { key: 'Mod-Enter', run: () => { run(); return true; } },
            cmds.indentWithTab,
            ...cmds.defaultKeymap,
            ...cmds.historyKeymap,
          ]),
          lang_.javascript({ typescript: lang === 'ts' }),
          syntaxHighlighting(classHighlighter),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false',
            'aria-label': props.title ?? 'Code editor',
          }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              try { localStorage.setItem(storeKey, u.state.doc.toString()); } catch { /* ignore */ }
            }
            if (u.focusChanged) setFocused(u.view.hasFocus);
          }),
        ],
      });
      view.current = new EditorView({ state, parent: host.current });
      setReady(true);
      if (props.autorun) run();
    })();
    return () => {
      destroyed = true;
      view.current?.destroy();
      worker.current?.terminate();
      window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback((why?: string) => {
    worker.current?.terminate();
    worker.current = null;
    window.clearTimeout(timer.current);
    setRunning(false);
    if (why) setError(why);
  }, []);

  const run = useCallback(() => {
    const code: string = view.current ? view.current.state.doc.toString() : props.code;
    stop();
    setLines([]);
    setResults(null);
    setError(null);
    setRunning(true);
    const w = new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    const out: Line[] = [];
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'log') {
        out.push({ level: m.level, text: m.text });
        if (out.length <= 500) setLines([...out]);
      } else if (m.type === 'done') {
        setLines([...out]);
        setResults(isExercise ? m.results : null);
        setError(m.error);
        if (isExercise && !m.error && m.results.length > 0 && m.results.every((r: TestResult) => r.ok)) setSolved(true);
        stop();
      }
    };
    w.onerror = (e) => { setError(e.message || 'The worker crashed.'); stop(); };
    w.postMessage({ code, tests: isExercise ? tests : undefined, lang });
    timer.current = window.setTimeout(
      () => stop(`Stopped after ${TIME_LIMIT_MS / 1000} seconds. Is there a loop that never ends?`),
      TIME_LIMIT_MS,
    );
  }, [isExercise, lang, props.code, stop, tests]);

  const reset = () => {
    const v = view.current;
    if (!v) return;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: props.code } });
    setLines(null); setResults(null); setError(null);
  };

  const insert = (text: string) => {
    const v = view.current;
    if (!v) return;
    v.dispatch(v.state.replaceSelection(text));
    v.focus();
  };

  const undo = async () => {
    const v = view.current;
    if (!v) return;
    const { undo } = await import('@codemirror/commands');
    undo(v);
    v.focus();
  };

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [full]);

  const passed = results?.filter((r) => r.ok).length ?? 0;

  return (
    <section
      className={clsx('runner not-prose my-7 border border-line bg-panel font-sans', full && 'is-fullscreen')}
      data-runner={id}
      aria-label={props.title ?? (isExercise ? 'Exercise' : 'Runnable example')}
    >
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className={clsx('text-[0.7rem] font-bold uppercase tracking-[0.08em]', isExercise ? 'text-brand' : 'text-muted')}>
          {isExercise ? (props.optional ? 'Extra practice' : 'Exercise') : 'Try it'}
        </span>
        {props.title && <span className="min-w-0 truncate text-sm font-semibold">{props.title}</span>}
        {solved && <span className="ml-1 text-sm font-semibold text-safe" aria-live="polite">✓ solved</span>}
        <button type="button" onClick={() => setFull((f) => !f)} className="ml-auto grid h-9 w-9 place-items-center text-muted hover:text-ink" aria-label={full ? 'Exit full screen' : 'Edit full screen'}>
          {full ? '✕' : '⤢'}
        </button>
      </header>

      {isExercise && props.prompt && (
        <div className="prompt-card border-b border-line px-3 py-3 text-[0.98rem] leading-relaxed [&_p]:my-1.5 [&_.md_p]:my-1.5">
          <div className="md" dangerouslySetInnerHTML={{ __html: md(props.prompt) }} />
        </div>
      )}

      <div className="runner-editor">
        <div ref={host} />
        {!ready && (
          <pre className="m-0 whitespace-pre-wrap border-0 bg-panel px-[0.6rem] py-[0.6rem] font-mono text-[16px] leading-[1.55]">{props.code}</pre>
        )}
      </div>

      {focused && (
        <div className="keybar" role="toolbar" aria-label="Insert symbols">
          {KEYS.map(([label, text]) => (
            <button key={label} type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(text)} aria-label={`Insert ${label}`}>
              {label === 'tab' ? '⇥' : label}
            </button>
          ))}
          <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={undo} aria-label="Undo">↶</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5">
        {running ? (
          <button type="button" className="btn-3d btn-3d-primary px-4 py-1.5 text-sm font-semibold" onClick={() => stop('Stopped.')}>■ Stop</button>
        ) : (
          <button type="button" className="btn-3d btn-3d-primary px-4 py-1.5 text-sm font-semibold" onClick={run} data-run>
            ▶ {isExercise ? 'Run tests' : 'Run'}
          </button>
        )}
        <button type="button" className="btn-3d btn-3d-sm px-3 py-1 text-sm" onClick={reset} disabled={!ready}>Reset</button>
        {isExercise && props.hints && hintsShown < props.hints.length && (
          <button type="button" className="btn-3d btn-3d-sm px-3 py-1 text-sm" onClick={() => setHintsShown((h) => h + 1)}>
            Hint {hintsShown + 1}/{props.hints.length}
          </button>
        )}
        {isExercise && props.solution && (
          <button type="button" className="btn-3d btn-3d-sm px-3 py-1 text-sm" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
            {showSolution ? 'Hide solution' : 'Solution'}
          </button>
        )}
        <span className="ml-auto hidden text-xs text-muted sm:inline">⌘/Ctrl + Enter runs</span>
      </div>

      {isExercise && hintsShown > 0 && (
        <ol className="m-0 list-none border-t border-line px-3 py-2 text-[0.95rem]">
          {props.hints!.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="prompt-card my-1.5 flex gap-2">
              <span className="font-semibold text-brand">Hint {i + 1}.</span>
              <span className="md min-w-0 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: md(h) }} />
            </li>
          ))}
        </ol>
      )}

      {(lines !== null || error) && (
        <div className="border-t border-line bg-paper px-3 py-2.5 font-mono text-[14px] leading-[1.55]" aria-live="polite" data-output>
          {lines && lines.length === 0 && !error && !results && <div className="text-muted">(no output)</div>}
          {lines?.map((l, i) => (
            <div key={i} className={clsx('whitespace-pre-wrap break-words', l.level === 'error' && 'text-danger', l.level === 'warn' && 'text-warn')}>{l.text}</div>
          ))}
          {results && (
            <div className="mt-1 font-sans text-[0.95rem]">
              <div className={clsx('font-semibold', passed === results.length && results.length > 0 ? 'text-safe' : 'text-ink')}>
                {passed}/{results.length} tests passed
              </div>
              <ul className="m-0 mt-1 list-none p-0">
                {results.map((r, i) => (
                  <li key={i} className="py-0.5">
                    <span className={r.ok ? 'text-safe' : 'text-danger'}>{r.ok ? '✓' : '✗'}</span> {r.name}
                    {!r.ok && r.message && <div className="pl-5 font-mono text-[13px] text-muted">{r.message}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <div className="mt-1 whitespace-pre-wrap text-danger">{error}</div>}
        </div>
      )}

      {isExercise && showSolution && (
        <div className="prompt-card border-t border-line px-3 py-3 text-[0.98rem] leading-relaxed" data-solution>
          <div className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand">Worked solution</div>
          <pre className="code-surface my-2 whitespace-pre font-mono">{props.solution}</pre>
          {props.walkthrough && <div className="md [&_p]:my-2" dangerouslySetInnerHTML={{ __html: md(props.walkthrough) }} />}
          {props.wrong && props.wrong.length > 0 && (
            <div className="mt-3">
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-danger">Common wrong turns</div>
              {props.wrong.map((w, i) => (
                <div key={i} className="mt-2">
                  {w.code && <pre className="code-surface my-1 whitespace-pre font-mono">{w.code}</pre>}
                  <div className="md [&_p]:my-1" dangerouslySetInnerHTML={{ __html: md(w.why) }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
