import { useState } from 'react';

/**
 * Measure AoS vs SoA on YOUR device. Each layout runs in its own fresh Web
 * Worker (so the engine's type feedback from one can't affect the other),
 * warms up, then reports the median of 25 samples.
 */
type Result = { aos?: number; soa?: number };

export default function LiveBench() {
  const [n, setN] = useState(100_000);
  const [kernel, setKernel] = useState<'update' | 'sum'>('update');
  const [res, setRes] = useState<Result>({});
  const [running, setRunning] = useState(false);

  const measure = (layout: 'aos' | 'soa') =>
    new Promise<number>((resolve, reject) => {
      const w = new Worker(new URL('./livebench.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e) => { w.terminate(); resolve(e.data.median); };
      w.onerror = (e) => { w.terminate(); reject(e); };
      w.postMessage({ layout, kernel, n });
    });

  const go = async () => {
    setRunning(true);
    setRes({});
    const aos = await measure('aos');
    setRes({ aos });
    const soa = await measure('soa');
    setRes({ aos, soa });
    setRunning(false);
  };

  const max = Math.max(res.aos ?? 0, res.soa ?? 0) || 1;
  const bar = (label: string, v: number | undefined, hot: boolean) => (
    <div className="flex items-center gap-2 py-1">
      <span className={`w-32 shrink-0 text-right text-sm ${hot ? 'font-semibold' : ''}`}>{label}</span>
      <div className="h-5 min-w-0 flex-1">
        {v !== undefined && <div className="h-5 rounded-[4px]" style={{ width: `${(v / max) * 100}%`, background: hot ? 'rgb(var(--brand))' : 'rgb(var(--muted) / 0.45)' }} />}
      </div>
      <span className="w-16 shrink-0 font-mono text-xs">{v !== undefined ? `${v.toFixed(2)} ns` : running ? '…' : ''}</span>
    </div>
  );

  return (
    <section className="not-prose my-8 border border-line bg-panel font-sans" data-livebench>
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand">Measure it yourself</span>
        <span className="text-sm font-semibold">AoS vs SoA on this device</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-3 py-3 text-sm">
        <label className="flex items-center gap-2">loop
          <select className="border border-line bg-paper px-2 py-1" value={kernel} onChange={(e) => setKernel(e.target.value as 'update' | 'sum')} disabled={running}>
            <option value="update">x += vx, y += vy</option>
            <option value="sum">sum every mass</option>
          </select>
        </label>
        <label className="flex items-center gap-2">elements
          <select className="border border-line bg-paper px-2 py-1" value={n} onChange={(e) => setN(Number(e.target.value))} disabled={running}>
            {[1_000, 100_000, 1_000_000].map((v) => <option key={v} value={v}>{v.toLocaleString('en-US')}</option>)}
          </select>
        </label>
        <button type="button" className="btn-3d btn-3d-primary px-4 py-1.5 font-semibold" onClick={go} disabled={running} data-run-bench>
          {running ? 'Measuring…' : '▶ Run'}
        </button>
      </div>
      <div className="px-3 pb-3">
        {bar('array of objects', res.aos, false)}
        {bar('struct of arrays', res.soa, true)}
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          {res.aos && res.soa
            ? `On this device, SoA was ${res.aos / res.soa >= 1 ? (res.aos / res.soa).toFixed(1) + '× faster' : (res.soa / res.aos).toFixed(1) + '× slower'} (median ns per element; shorter is faster). Run it a few times: timings in a browser are noisy.`
            : 'Each layout runs in its own fresh worker: warm-up, then the median of 25 samples.'}
        </p>
      </div>
    </section>
  );
}
