// Runs reader code off the main thread. The page kills this worker if it
// takes too long (an accidental infinite loop can't freeze the book).
import { formatArgs } from '../../lib/format.js';
import { runWithTests } from '../../lib/minitest.js';

type Msg = { code: string; tests?: string; lang: 'js' | 'ts' | 'drip' | 'drip-vm' };

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
  const { results, error } = runWithTests(code, tests, logger);
  post({ type: 'done', results, error, ms: performance.now() - t0 });
};
