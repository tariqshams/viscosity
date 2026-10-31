import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/**
 * The real Viscosity compiler, running in your browser. Edit the program,
 * see what Viscosity decides and why, and run both versions to check they
 * print the same thing.
 *
 * Two engines, with identical output: the TypeScript reference (bundled from
 * engine/ts, the default) and the Rust port compiled to WebAssembly
 * (engine/rust/crates/wasm). The Rust engine runs in a worker and its .wasm
 * (about 1.1 MB) is fetched only when it is chosen, with `engine="rust"` or
 * the TS / Rust toggle.
 */
type Engine = 'ts' | 'rust';
type Result = { code: string; explain: string };
type Run = { out: string[]; error: string | null; ms: number };

const runIn = (code: string) =>
  new Promise<Run>((resolve) => {
    const w = new Worker(new URL('./play.worker.ts', import.meta.url), { type: 'module' });
    const t = setTimeout(() => { w.terminate(); resolve({ out: [], error: 'Stopped after 10 seconds.', ms: 10000 }); }, 10000);
    w.onmessage = (e) => { clearTimeout(t); w.terminate(); resolve(e.data); };
    w.postMessage({ code });
  });

// One long-lived worker per playground compiles with the Rust engine.
type Reply = { id: number; res?: Result; error?: string; fatal?: boolean; ms?: number };
function rustCompiler() {
  let w: Worker | null = null;
  let next = 0;
  const waiting = new Map<number, (r: Reply) => void>();
  const start = () => {
    w = new Worker(new URL('./play.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<Reply>) => { waiting.get(e.data.id)?.(e.data); waiting.delete(e.data.id); };
    w.onerror = (e) => { for (const [id, done] of waiting) done({ id, error: e.message || 'The Rust engine failed to load.', fatal: true }); waiting.clear(); };
    return w;
  };
  return (compile: string) => new Promise<Reply>((resolve) => {
    const id = ++next;
    waiting.set(id, (r) => { if (r.fatal) { w?.terminate(); w = null; } resolve(r); });
    (w ?? start()).postMessage({ compile, id });
  });
}

export default function Playground({ initial, title = 'Viscosity playground', engine: initialEngine = 'ts', engineToggle = true }: {
  initial: string;
  title?: string;
  /** Which compiler: the TypeScript reference (default) or the Rust engine as WebAssembly. */
  engine?: Engine;
  /** Show the TS / Rust switch (default true). */
  engineToggle?: boolean;
}) {
  const [src, setSrc] = useState(initial);
  const [eng, setEng] = useState<Engine>(initialEngine);
  const [status, setStatus] = useState<string>('');
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'explain' | 'code'>('explain');
  const [runs, setRuns] = useState<{ a: Run; b: Run } | null>(null);
  const [busy, setBusy] = useState(false);
  const tsEngine = useRef<null | ((s: string) => Result)>(null);
  const rust = useRef<null | ReturnType<typeof rustCompiler>>(null);
  const latest = useRef(0);
  const rustReady = useRef(false);

  const compileNow = async (s: string, e: Engine = eng) => {
    const ticket = ++latest.current;
    const show = (r: Result | null, error: string | null, note: string) => {
      if (ticket !== latest.current) return; // a newer edit or engine switch won
      setRes(r); setErr(error); setStatus(note);
    };
    if (e === 'rust') {
      rust.current ??= rustCompiler();
      if (!rustReady.current) setStatus('Loading the Rust engine (WebAssembly, about 1.1 MB)…');
      const r = await rust.current(s);
      rustReady.current = !!r.res || !r.fatal;
      if (r.res) show(r.res, null, `Rust engine (WebAssembly), compiled in ${r.ms!.toFixed(1)} ms`);
      else show(null, r.error ?? 'Rust engine error', 'Rust engine (WebAssembly)');
      return;
    }
    try {
      if (!tsEngine.current) {
        const m = await import('../../vendor/viscosity.js');
        tsEngine.current = (x: string) => m.viscosity(x);
      }
      const t0 = performance.now();
      const r = tsEngine.current(s);
      show(r, null, `TypeScript engine, compiled in ${(performance.now() - t0).toFixed(1)} ms`);
    } catch (x) {
      show(null, (x as Error).message, 'TypeScript engine');
    }
  };
  useEffect(() => { compileNow(src); /* eslint-disable-next-line */ }, []);
  const switchTo = (e: Engine) => { if (e === eng) return; setEng(e); setRuns(null); compileNow(src, e); };

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
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
        {engineToggle && (
          <div role="group" aria-label="Compiler engine" className="flex shrink-0 gap-1" data-engine-toggle>
            {(['ts', 'rust'] as const).map((e) => (
              <button key={e} type="button" aria-pressed={eng === e} data-engine={e}
                title={e === 'ts' ? 'TypeScript engine (the reference)' : 'Rust engine, compiled to WebAssembly (about 1.1 MB, loaded on first use)'}
                className={clsx('btn-3d btn-3d-sm px-2 py-0.5 text-xs', eng === e && 'is-pressed')} onClick={() => switchTo(e)}>
                {e === 'ts' ? 'TS' : 'Rust'}
              </button>
            ))}
          </div>
        )}
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
        {res && tab === 'code' && <pre className="m-0 whitespace-pre" data-code>{res.code}</pre>}
      </div>
      {status && <div className="border-t border-line px-3 py-1 font-sans text-xs text-muted" data-engine-status={eng}>{status}</div>}
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
