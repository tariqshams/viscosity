// Runs reader code off the main thread. The page kills this worker if it
// takes too long (an accidental infinite loop can't freeze the book).
import { formatArgs } from '../../lib/format.js';
import { runWithTests } from '../../lib/minitest.js';

type Msg = { code: string; tests?: string; lang: 'js' | 'ts' };

self.onmessage = async (e: MessageEvent<Msg>) => {
  const { tests, lang } = e.data;
  let code = e.data.code;
  const post = (m: unknown) => (self as unknown as Worker).postMessage(m);
  const log = (level: string) => (...args: unknown[]) => post({ type: 'log', level, text: formatArgs(args) });
  const logger = { log: log('log'), info: log('log'), warn: log('warn'), error: log('error'), table: log('log') };

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
