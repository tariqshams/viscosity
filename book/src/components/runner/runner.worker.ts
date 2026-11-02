// Runs reader code off the main thread. The page kills this worker if it
// takes too long (an accidental infinite loop can't freeze the book).
import { formatArgs } from '../../lib/format.js';
import { runWithTestsAsync } from '../../lib/minitest.js';

// A rejected promise nobody handles: report it the way a browser console
// does, rather than letting it vanish.
self.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  e.preventDefault();
  const r = e.reason;
  (self as unknown as Worker).postMessage({ type: 'log', level: 'error', text: `Uncaught (in promise) ${r instanceof Error ? `${r.name}: ${r.message}` : String(r)}` });
});

type Msg = { code: string; tests?: string; lang: 'js' | 'ts' | 'drip' | 'drip-vm' | 'rust' };

self.onmessage = async (e: MessageEvent<Msg>) => {
  const { tests, lang } = e.data;
  let code = e.data.code;
  const post = (m: unknown) => (self as unknown as Worker).postMessage(m);
  const log = (level: string) => (...args: unknown[]) => post({ type: 'log', level, text: formatArgs(args) });
  const logger = { log: log('log'), info: log('log'), warn: log('warn'), error: log('error'), table: log('log') };

  // Drip programs run on the book's own interpreter (or VM). An exercise's
  // "tests" for Drip is the exact expected output.
  if (lang === 'drip' || lang === 'drip-vm') {
    const { runDrip, checkDripOutput } = await import('../../lib/drip.js');
    const t0 = performance.now();
    const r = await runDrip(code, lang);
    for (const l of r.stdout) post({ type: 'log', level: 'log', text: l });
    const error = r.stderr.length ? r.stderr.join('\n') : null;
    post({ type: 'done', results: tests === undefined ? [] : checkDripOutput(r, tests), error, ms: performance.now() - t0 });
    return;
  }
  // Rust is compiled and run by the official Rust Playground.
  if (lang === 'rust') {
    const r = await import('../../lib/rust.js');
    const t0 = performance.now();
    try {
      const out = await r.runRustInPlayground(code, tests);
      for (const l of out.stdout.split('\n').filter(Boolean)) post({ type: 'log', level: 'log', text: l });
      const results = tests ? r.parseTestOutput(out.stdout) : [];
      const compileError = !out.success && results.length === 0 ? out.stderr.split('\n').filter((l: string) => !/^\s*(Compiling|Finished|Running)/.test(l)).join('\n').trim() : null;
      post({ type: 'done', results, error: compileError, ms: performance.now() - t0 });
    } catch (err) {
      post({ type: 'done', results: [], error: `Couldn't reach the Rust Playground (${(err as Error).message}). Use “Open in Rust Playground” below.`, ms: 0, offline: true });
    }
    return;
  }
  if (lang === 'ts') {
    try {
      const { transform } = await import('sucrase');
      code = transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
    } catch (err) {
      post({ type: 'done', results: [], error: `TypeScript error: ${(err as Error).message}` });
      return;
    }
  }
  const t0 = performance.now();
  // Waits for the program's timers and promises (up to 2.5 s; the page stops
  // the worker at 3 s), so async output is shown, not lost.
  const { results, error, pending } = await runWithTestsAsync(code, tests, logger);
  if (pending) logger.warn(`(${pending} timer${pending === 1 ? '' : 's'} still running were stopped)`);
  post({ type: 'done', results, error, ms: performance.now() - t0 });
};
