// Two jobs, by message:
//  - { code }: runs one program (original or compiled) and reports its
//    console output and how long it took. A fresh worker per run.
//  - { compile, id }: compiles with the Rust engine (WebAssembly). The
//    playground keeps one such worker; the .wasm (about 1.4 MB) is fetched
//    the first time, only when a reader picks the Rust engine.
import { formatArgs } from '../../lib/format.js';

type Wasm = typeof import('../../vendor/viscosity_wasm.js');
let rust: Promise<Wasm> | null = null;
const loadRust = () => (rust ??= import('../../vendor/viscosity_wasm.js').then(async (m) => {
  await m.default({ module_or_path: `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}wasm/viscosity_wasm_bg.wasm` });
  return m;
}).catch((err) => { rust = null; throw err; }));

const post = (msg: unknown) => (self as unknown as Worker).postMessage(msg);

self.onmessage = async (e: MessageEvent<{ code: string } | { compile: string; id: number }>) => {
  if ('compile' in e.data) {
    const { compile, id } = e.data;
    try {
      const m = await loadRust();
      const t0 = performance.now();
      const r = m.compile(compile);
      const res = { code: r.code, explain: r.explain };
      r.free();
      post({ id, res, ms: performance.now() - t0 });
    } catch (err) {
      // A Rust panic traps (RuntimeError) and leaves the instance unusable;
      // `fatal` asks the playground for a fresh worker.
      post({ id, error: (err as Error).message ?? String(err), fatal: err instanceof WebAssembly.RuntimeError });
    }
    return;
  }
  const out: string[] = [];
  const logger = { log: (...a: unknown[]) => out.push(formatArgs(a)) };
  const t0 = performance.now();
  let error: string | null = null;
  try {
    new Function('console', e.data.code.replace(/^export (default )?/gm, ''))(logger);
  } catch (err) {
    error = `${(err as Error).name}: ${(err as Error).message}`;
  }
  post({ out, error, ms: performance.now() - t0 });
};
