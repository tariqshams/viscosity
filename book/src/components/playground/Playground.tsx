import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/**
 * The real Viscosity compiler, running in your browser (bundled from
 * engine/ts). Edit the program, see what Viscosity decides and why, and run
 * both versions to check they print the same thing.
 */
type Result = { code: string; explain: string; collections: { name: string; layout: string }[] };
type Run = { out: string[]; error: string | null; ms: number };

const runIn = (code: string) =>
  new Promise<Run>((resolve) => {
    const w = new Worker(new URL('./play.worker.ts', import.meta.url), { type: 'module' });
    const t = setTimeout(() => { w.terminate(); resolve({ out: [], error: 'Stopped after 10 seconds.', ms: 10000 }); }, 10000);
    w.onmessage = (e) => { clearTimeout(t); w.terminate(); resolve(e.data); };
    w.postMessage({ code });
  });

export default function Playground({ initial, title = 'Viscosity playground' }: { initial: string; title?: string }) {
  const [src, setSrc] = useState(initial);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'explain' | 'code'>('explain');
  const [runs, setRuns] = useState<{ a: Run; b: Run } | null>(null);
  const [busy, setBusy] = useState(false);
  const engine = useRef<null | ((s: string) => Result)>(null);

  const compileNow = async (s: string) => {
    try {
      if (!engine.current) {
        const m = await import('../../vendor/viscosity.js');
        engine.current = (x: string) => m.viscosity(x);
      }
      setRes(engine.current(s));
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
      setRes(null);
    }
  };
  useEffect(() => { compileNow(src); /* eslint-disable-next-line */ }, []);

  const runBoth = async () => {
    if (!res) return;
    setBusy(true);
    setRuns(null);
    const a = await runIn(src);
    const b = await runIn(res.code);
    setRuns({ a, b });
    setBusy(false);
  };
  const same = runs && runs.a.error === runs.b.error && runs.a.out.join('\n') === runs.b.out.join('\n');

  return (
    <section className="not-prose my-8 border border-line bg-panel font-sans" data-playground>
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand">Playground</span>
        <span className="truncate text-sm font-semibold">{title}</span>
      </div>
      <textarea
        className="block h-64 w-full resize-y border-0 border-b border-line bg-paper p-3 font-mono text-[16px] leading-[1.5] outline-none focus:ring-2 focus:ring-brand/50"
        value={src}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Program to compile"
        onChange={(e) => { setSrc(e.target.value); compileNow(e.target.value); }}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <button type="button" className={clsx('btn-3d btn-3d-sm px-3 py-1 text-sm', tab === 'explain' && 'is-pressed')} onClick={() => setTab('explain')}>Decisions</button>
        <button type="button" className={clsx('btn-3d btn-3d-sm px-3 py-1 text-sm', tab === 'code' && 'is-pressed')} onClick={() => setTab('code')}>Compiled code</button>
        <button type="button" className="btn-3d btn-3d-primary ml-auto px-3 py-1 text-sm font-semibold" onClick={runBoth} disabled={!res || busy} data-run-both>
          {busy ? 'Running…' : '▶ Run both'}
        </button>
      </div>
      <div className="max-h-80 overflow-auto bg-paper px-3 py-2 font-mono text-[13px] leading-[1.5]" aria-live="polite">
        {err && <div className="text-danger">{err}</div>}
        {res && tab === 'explain' && <pre className="m-0 whitespace-pre-wrap" data-explain>{res.explain || 'No arrays of objects found.'}</pre>}
        {res && tab === 'code' && <pre className="m-0 whitespace-pre">{res.code}</pre>}
      </div>
      {runs && (
        <div className="border-t border-line px-3 py-2 text-sm" data-runs>
          <div className={same ? 'font-semibold text-safe' : 'font-semibold text-danger'}>
            {same ? '✓ Same output' : '✗ Outputs differ'}: original {runs.a.ms.toFixed(1)} ms, Viscosity {runs.b.ms.toFixed(1)} ms
          </div>
          <pre className="m-0 mt-1 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[13px] text-muted">{[...runs.b.out, runs.b.error ?? ''].join('\n').trim() || '(no output)'}</pre>
        </div>
      )}
    </section>
  );
}
