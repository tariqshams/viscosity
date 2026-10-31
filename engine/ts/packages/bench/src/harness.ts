// A small, honest micro-benchmark harness.
//
// Design rules (each one guards against a classic benchmarking mistake):
//  1. Warm up before measuring, so we time optimized (JIT-compiled) code,
//     not the interpreter or the compiler itself.
//  2. Take many samples and report the median and p95, not one run or the
//     mean (a single GC pause can wreck a mean).
//  3. Every kernel returns a number that we fold into a "sink", so the JIT
//     can't prove the work is unused and delete it (dead-code elimination).
//  4. Each (suite, layout, size) case runs in its own fresh process (see
//     run.ts), so type feedback from one layout can't make another layout's
//     code polymorphic and slow.

export interface Kernel {
  /** Runs the measured work once over the whole collection. */
  run(): number;
  /** Elements touched per run(), used to report ns per element. */
  elements: number;
}

export interface Stats {
  samples: number;
  runsPerSample: number;
  medianNsPerElement: number;
  p95NsPerElement: number;
  minNsPerElement: number;
  meanNsPerElement: number;
  stdevNsPerElement: number;
}

export interface MeasureOptions {
  warmupMs: number;
  samples: number;
  /** Each sample keeps running the kernel until at least this long. */
  minSampleMs: number;
}

export const DEFAULT_OPTIONS: MeasureOptions = {
  warmupMs: 300,
  samples: 30,
  minSampleMs: 10,
};

let sink = 0;
/** Read the sink so the work is observably used. */
export function consumeSink(): number {
  return sink;
}

function now(): number {
  return performance.now();
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function measure(kernel: Kernel, opts: MeasureOptions = DEFAULT_OPTIONS): Stats {
  // 1. Warm-up: also calibrates how many runs make one sample.
  let runs = 0;
  const warmStart = now();
  while (now() - warmStart < opts.warmupMs || runs < 5) {
    sink += kernel.run();
    runs++;
  }
  const msPerRun = (now() - warmStart) / runs;
  const runsPerSample = Math.max(1, Math.ceil(opts.minSampleMs / msPerRun));

  // 2. Samples.
  const perElement: number[] = [];
  for (let s = 0; s < opts.samples; s++) {
    const t0 = now();
    for (let r = 0; r < runsPerSample; r++) sink += kernel.run();
    const ms = now() - t0;
    perElement.push((ms * 1e6) / (runsPerSample * kernel.elements));
  }

  const sorted = [...perElement].sort((a, b) => a - b);
  const mean = perElement.reduce((a, b) => a + b, 0) / perElement.length;
  const variance = perElement.reduce((a, b) => a + (b - mean) ** 2, 0) / perElement.length;
  return {
    samples: opts.samples,
    runsPerSample,
    medianNsPerElement: quantile(sorted, 0.5),
    p95NsPerElement: quantile(sorted, 0.95),
    minNsPerElement: sorted[0],
    meanNsPerElement: mean,
    stdevNsPerElement: Math.sqrt(variance),
  };
}
