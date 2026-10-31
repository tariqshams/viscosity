// Runs one program (original or compiled) and reports its console output
// and how long it took.
import { formatArgs } from '../../lib/format.js';

self.onmessage = (e: MessageEvent<{ code: string }>) => {
  const out: string[] = [];
  const logger = { log: (...a: unknown[]) => out.push(formatArgs(a)) };
  const t0 = performance.now();
  let error: string | null = null;
  try {
    new Function('console', e.data.code.replace(/^export (default )?/gm, ''))(logger);
  } catch (err) {
    error = `${(err as Error).name}: ${(err as Error).message}`;
  }
  (self as unknown as Worker).postMessage({ out, error, ms: performance.now() - t0 });
};
