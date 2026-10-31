// Runs ONE (suite, layout, size) case in this process and prints JSON.
// run.ts starts a fresh process per case, so JIT type feedback never leaks
// between layouts.
import { consumeSink, measure, DEFAULT_OPTIONS } from './harness.ts';
import { makeKernel, type Layout, type Suite } from './suites.ts';

const [suite, layout, nStr, quick] = process.argv.slice(2);
const n = Number(nStr);
const kernel = makeKernel(suite as Suite, layout as Layout, n);
const opts = quick === 'quick'
  ? { warmupMs: 100, samples: 10, minSampleMs: 5 }
  : DEFAULT_OPTIONS;
const stats = measure(kernel, opts);
process.stdout.write(
  JSON.stringify({ suite, layout, n, ...stats, sink: consumeSink() }) + '\n',
);
