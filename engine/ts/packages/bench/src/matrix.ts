// The final benchmark matrix (the book's chapter “The final benchmark matrix”). Three parts, written to
// results/matrix-<date>.json, and rendered from that JSON into
// results/matrix-<date>.md (no number in the MD is typed by hand):
//
//  (a) end-to-end programs (e2e/*.js), original vs compiled, on Node (V8)
//      and Bun (JavaScriptCore). Each run is a fresh process; the programs
//      time their own hot section; original and compiled runs alternate;
//      checksums must match.
//  (b) compile speed over the JavaScript corpus: the TS CLI vs the Rust CLI
//      (release), one fresh process per compile, with the outputs compared
//      byte for byte; plus warm in-process compile() for the TS engine and
//      the Rust engine as WebAssembly (engine/rust/packages/wasm) on Node.
//  (c) Drip: tree-walker vs bytecode VM (TS) vs drip-rs, from the committed
//      results in book/companion/{ts,rust}/results (not re-run: 10 s+).
//
//   node packages/bench/src/matrix.ts            (from engine/ts)
//   RUNS=9 CLI_RUNS=5 node packages/bench/src/matrix.ts
//   node packages/bench/src/matrix.ts --md packages/bench/results/matrix-2026-10-31.json [--drip]
//     (re-render the MD; --drip also refreshes part (c) from the Drip results)
//
// Needs: engine/rust/target/release/viscosity (cargo build --release -p
// viscosity-cli), packages/cli/dist (node packages/cli/build.mjs), Bun at
// $BUN or /root/.bun/bin/bun or on the PATH, and optionally the wasm package
// build (node engine/rust/packages/wasm/build.mjs).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import os, { tmpdir } from 'node:os';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../core/src/index.ts';
import { jsPlugin } from '../../frontend-js/src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const bench = join(here, '..');
const tsRoot = join(bench, '..', '..');
const repo = join(tsRoot, '..', '..');
const results = join(bench, 'results');

type Json = Record<string, any>;
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const min = (xs: number[]) => Math.min(...xs);
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const sh = (cmd: string, args: string[], env?: NodeJS.ProcessEnv) => execFileSync(cmd, args, { encoding: 'utf8', env, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });

const geo = (xs: number[]) => r2(Math.exp(xs.reduce((s, x) => s + Math.log(x), 0) / xs.length));
// (c) Drip, from the committed results.
function dripSection(): Json {
  const latest = (dir: string, prefix: string) => {
    const fs = readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.json')).sort();
    if (!fs.length) throw new Error(`no ${prefix}*.json in ${dir}`);
    return join(dir, fs[fs.length - 1]);
  };
  const dripTsFile = latest(join(repo, 'book', 'companion', 'ts', 'results'), 'drip-bench-');
  const dripRsFile = latest(join(repo, 'book', 'companion', 'rust', 'results'), 'drip-rs-bench-');
  const dripTs = JSON.parse(readFileSync(dripTsFile, 'utf8'));
  const dripRs = JSON.parse(readFileSync(dripRsFile, 'utf8'));
  const rsBy = new Map<string, Json>(dripRs.rows.map((r: Json) => [r.program, r]));
  const dripRows = dripTs.rows.map((t: Json) => {
    const rs = rsBy.get(t.program);
    // zoo_batch runs for a fixed time and counts batches, so its time is not
    // a speed: keep the times, but no ratios.
    const fixedTime = t.program === 'zoo_batch';
    const ok = (a: unknown, b: unknown) => !fixedTime && typeof a === 'number' && typeof b === 'number';
    return {
      program: t.program, treeMs: t.tree ?? null, vmMs: t.vm ?? null, vmError: t.vmError ?? null, rustMs: rs?.rust ?? null, rustError: rs?.rustError ?? null, fixedTime,
      vmVsTree: ok(t.vm, t.tree) ? r2(t.tree / t.vm) : null,
      rustVsVm: ok(rs?.rust, t.vm) ? r2(t.vm / rs!.rust) : null,
      rustVsTree: ok(rs?.rust, t.tree) ? r2(t.tree / rs!.rust) : null,
    };
  });
  return {
    sources: [dripTsFile, dripRsFile].map((f) => f.slice(repo.length + 1)),
    tsEnv: dripTs.env, rustEnv: { ...dripRs.env, tsEnv: undefined },
    method: 'Copied from the committed results (not re-run here). Wall-clock milliseconds, compile time included, each a fresh process; see each file\'s own note for its run count.',
    rows: dripRows,
    geomean: {
      vmVsTree: geo(dripRows.filter((r: Json) => r.vmVsTree).map((r: Json) => r.vmVsTree)),
      rustVsVm: geo(dripRows.filter((r: Json) => r.rustVsVm).map((r: Json) => r.rustVsVm)),
      rustVsTree: geo(dripRows.filter((r: Json) => r.rustVsTree).map((r: Json) => r.rustVsTree)),
    },
  };
}

// --md <json>: re-render the MD from the JSON (with --drip, refresh part (c)
// from the committed Drip results first; the timings are untouched).
const mdArg = process.argv.indexOf('--md');
if (mdArg >= 0) {
  const file = process.argv[mdArg + 1];
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (process.argv.includes('--drip')) { data.drip = dripSection(); writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); }
  writeFileSync(file.replace(/\.json$/, '.md'), render(data));
  console.log(`wrote ${file.replace(/\.json$/, '.md')}`);
  process.exit(0);
}

const RUNS = Number(process.env.RUNS ?? 9);
const CLI_RUNS = Number(process.env.CLI_RUNS ?? 5);
const IN_WARMUP = Number(process.env.IN_WARMUP ?? 50);
const IN_RUNS = Number(process.env.IN_RUNS ?? 200);
const bun = [process.env.BUN, '/root/.bun/bin/bun', 'bun'].find((b) => { try { return b && sh(b, ['--version']); } catch { return false; } });
if (!bun) throw new Error('Bun not found (set $BUN)');
const rustCli = join(repo, 'engine', 'rust', 'target', 'release', 'viscosity');
const tsCli = join(tsRoot, 'packages', 'cli', 'bin', 'viscosity.mjs');
for (const f of [rustCli, join(tsRoot, 'packages', 'cli', 'dist', 'viscosity.mjs')]) if (!existsSync(f)) throw new Error(`${f} not found (see the header of this file)`);

// Bun reads extra flags from $BUN_OPTIONS (this VM's shell sets --smol, a
// smaller heap that trades speed for memory). Run Bun with its defaults.
const bunEnv = { ...process.env };
const bunOptionsRemoved = bunEnv.BUN_OPTIONS ?? null;
delete bunEnv.BUN_OPTIONS;
const nodeEnv = { ...process.env };
delete nodeEnv.NODE_OPTIONS;

const date = new Date();
const meta: Json = {
  date: date.toISOString(),
  machine: {
    cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryGiB: Math.round(os.totalmem() / 2 ** 30),
    os: `${os.type()} ${os.release()} ${os.arch()}`, loadAverageAtStart: os.loadavg().map(r2),
  },
  versions: {
    node: process.version, v8: process.versions.v8,
    bun: sh(bun, ['--version']).trim(), bunRevision: sh(bun, ['--revision']).trim(),
    rustc: (() => { try { return sh('rustc', ['--version']).trim(); } catch { return null; } })(),
  },
  settings: { e2eRuns: RUNS, cliRuns: CLI_RUNS, inProcessWarmup: IN_WARMUP, inProcessRuns: IN_RUNS, bunOptionsRemoved },
  noise: 'A shared 4-vCPU cloud VM: other tenants share the CPUs, so individual timings vary (up to about 2x between runs on this VM). Each e2e figure is from fresh processes, original and compiled interleaved; best (min) is the most stable figure, median shows the spread. Treat differences under about 10% as noise.',
};
console.log(`matrix: Node ${meta.versions.node}, Bun ${meta.versions.bun}; ${meta.machine.cpu} x${meta.machine.logicalCpus}`);

// (a) End-to-end programs on Node and Bun.
const tmp = mkdtempSync(join(tmpdir(), 'vsc-matrix-'));
const e2eDir = join(bench, 'e2e');
const runtimes = [
  { name: 'node', engine: `V8 ${process.versions.v8}`, cmd: process.execPath, env: nodeEnv },
  { name: 'bun', engine: 'JavaScriptCore', cmd: bun, env: bunEnv },
];
const e2e: Json[] = [];
for (const f of readdirSync(e2eDir).filter((f) => f.endsWith('.js')).sort()) {
  const src = readFileSync(join(e2eDir, f), 'utf8');
  const r = compile(src, jsPlugin());
  const orig = join(tmp, f);
  const comp = join(tmp, f.replace('.js', '.vsc.js'));
  writeFileSync(orig, src);
  writeFileSync(comp, r.code);
  const rustSame = sh(rustCli, ['build', join(e2eDir, f)]) === r.code;
  const row: Json = { program: f.replace('.js', ''), layouts: r.plan.collections.map((c) => `${c.collection.name}=${c.layout}`).join(' '), rustCompilerIdentical: rustSame };
  for (const rt of runtimes) {
    const runOnce = (file: string) => {
      const t0 = process.hrtime.bigint();
      const out = sh(rt.cmd, [file], rt.env);
      const wall = Number(process.hrtime.bigint() - t0) / 1e6;
      const last = JSON.parse(out.trim().split('\n').pop()!);
      return { ms: last.ms as number, check: String(last.check), wall };
    };
    const a: { ms: number; check: string; wall: number }[] = [];
    const b: typeof a = [];
    runOnce(orig); runOnce(comp); // discarded: warms the file cache and the runtime's on-disk caches
    for (let i = 0; i < RUNS; i++) { a.push(runOnce(orig)); b.push(runOnce(comp)); }
    const checks = new Set([...a, ...b].map((x) => x.check));
    if (checks.size !== 1) throw new Error(`${f} on ${rt.name}: checksums differ: ${[...checks].join(' / ')}`);
    const am = a.map((x) => x.ms), bm = b.map((x) => x.ms);
    row[rt.name] = {
      check: [...checks][0],
      originalMs: { best: r1(min(am)), median: r1(median(am)), all: am.map(r1) },
      viscosityMs: { best: r1(min(bm)), median: r1(median(bm)), all: bm.map(r1) },
      speedupBest: r2(min(am) / min(bm)), speedupMedian: r2(median(am) / median(bm)),
      processWallMs: { original: r1(median(a.map((x) => x.wall))), viscosity: r1(median(b.map((x) => x.wall))) },
    };
    console.log(`  ${row.program.padEnd(10)} ${rt.name.padEnd(4)} ${String(row[rt.name].originalMs.best).padStart(7)} → ${String(row[rt.name].viscosityMs.best).padStart(7)} ms best  ${row[rt.name].speedupBest}×`);
  }
  row.sameChecksumOnBothRuntimes = row.node.check === row.bun.check;
  e2e.push(row);
}
const e2eSummary: Json = {};
for (const rt of runtimes) {
  e2eSummary[rt.name] = { geomeanSpeedupBest: geo(e2e.map((r) => r[rt.name].speedupBest)), geomeanSpeedupMedian: geo(e2e.map((r) => r[rt.name].speedupMedian)) };
}
// How fast each runtime runs each version, Bun relative to Node (best times).
e2eSummary.bunVsNode = {
  originalGeomean: geo(e2e.map((r) => r.node.originalMs.best / r.bun.originalMs.best)),
  viscosityGeomean: geo(e2e.map((r) => r.node.viscosityMs.best / r.bun.viscosityMs.best)),
  note: 'Node best ms / Bun best ms: above 1 means Bun is faster.',
};

// (b) Compile speed over the JavaScript corpus.
const corpusDir = join(tsRoot, 'packages', 'frontend-js', 'test', 'corpus');
const corpus = readdirSync(corpusDir).filter((f) => f.endsWith('.js')).sort();
const req = createRequire(import.meta.url);
const wasmPkg = join(repo, 'engine', 'rust', 'packages', 'wasm', 'dist', 'node', 'viscosity_wasm.js');
const wasm = existsSync(wasmPkg) ? req(wasmPkg) : null;
const cliRows: Json[] = [];
const inRows: Json[] = [];
const time = (fn: () => void) => { const t0 = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t0); };
for (const f of corpus) {
  const file = join(corpusDir, f);
  const src = readFileSync(file, 'utf8');
  let tsOut = '', rsOut = '';
  const tsMs: number[] = [], rsMs: number[] = [];
  for (let i = 0; i < CLI_RUNS; i++) {
    tsMs.push(time(() => { tsOut = sh(process.execPath, [tsCli, 'build', file], nodeEnv); }) / 1e6);
    rsMs.push(time(() => { rsOut = sh(rustCli, ['build', file]); }) / 1e6);
  }
  cliRows.push({ program: f.replace('.js', ''), lines: src.split('\n').length, tsMs: { best: r1(min(tsMs)), median: r1(median(tsMs)) }, rustMs: { best: r2(min(rsMs)), median: r2(median(rsMs)) }, speedupMedian: r1(median(tsMs) / median(rsMs)), identical: tsOut === rsOut });

  const plugin = jsPlugin();
  const measure = (fn: () => unknown) => { for (let i = 0; i < IN_WARMUP; i++) fn(); const us: number[] = []; for (let i = 0; i < IN_RUNS; i++) us.push(time(fn) / 1e3); return us; };
  // Both sides end with the code and explain text as JavaScript strings.
  // The TS result already holds them; the wasm result's getters copy them
  // out of linear memory, so they are read inside the timed region.
  let ts = { code: '', explain: '' };
  const tUs = measure(() => { const r = compile(src, plugin); ts = { code: r.code, explain: r.explain }; });
  const row: Json = { program: f.replace('.js', ''), tsUs: { best: r1(min(tUs)), median: r1(median(tUs)) } };
  if (wasm) {
    let ws = { code: '', explain: '' };
    const wUs = measure(() => { const o = wasm.compile(src); ws = { code: o.code, explain: o.explain }; o.free(); });
    row.wasmUs = { best: r1(min(wUs)), median: r1(median(wUs)) };
    row.speedupMedian = r2(median(tUs) / median(wUs));
    row.identical = ws.code === ts.code && ws.explain === ts.explain;
  }
  inRows.push(row);
}
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const compileSpeed: Json = {
  corpus: 'engine/ts/packages/frontend-js/test/corpus/*.js',
  programs: corpus.length,
  cli: {
    method: `viscosity build <file> (stdout), one fresh process per compile, ${CLI_RUNS} runs each, alternating TS and Rust. Wall time of the whole process, from Node's child_process.`,
    tsCli: 'node packages/cli/bin/viscosity.mjs (esbuild bundle)',
    rustCli: 'engine/rust/target/release/viscosity',
    rows: cliRows,
    totalMedianMs: { ts: r1(sum(cliRows.map((r) => r.tsMs.median))), rust: r1(sum(cliRows.map((r) => r.rustMs.median))) },
    allIdentical: cliRows.every((r) => r.identical),
  },
  inProcess: {
    method: `compile() in one Node process: ${IN_WARMUP} warm-up calls, then ${IN_RUNS} timed calls per program. TS: the reference engine from source; Rust: @viscosity/wasm (nodejs target) on the same Node.`,
    wasmAvailable: !!wasm,
    rows: inRows,
    totalMedianUs: { ts: r1(sum(inRows.map((r) => r.tsUs.median))), wasm: wasm ? r1(sum(inRows.map((r) => r.wasmUs.median))) : null },
    allIdentical: wasm ? inRows.every((r) => r.identical) : null,
  },
};
compileSpeed.cli.totalSpeedup = r1(compileSpeed.cli.totalMedianMs.ts / compileSpeed.cli.totalMedianMs.rust);
if (wasm) compileSpeed.inProcess.totalSpeedup = r2(compileSpeed.inProcess.totalMedianUs.ts / compileSpeed.inProcess.totalMedianUs.wasm);
console.log(`  compile: CLI total ${compileSpeed.cli.totalMedianMs.ts} ms (TS) vs ${compileSpeed.cli.totalMedianMs.rust} ms (Rust); in-process ${compileSpeed.inProcess.totalMedianUs.ts} µs (TS) vs ${compileSpeed.inProcess.totalMedianUs.wasm} µs (wasm)`);


const drip = dripSection();
meta.loadAverageAtEnd = os.loadavg().map(r2);
const data = { meta, e2e: { method: `Each program's own timed section (performance.now()), ${RUNS} fresh processes per version per runtime, original and compiled interleaved, after one discarded run of each. Compiled with the TS engine (default options); the Rust CLI's output is compared too.`, rows: e2e, summary: e2eSummary }, compileSpeed, drip };
rmSync(tmp, { recursive: true, force: true });
mkdirSync(results, { recursive: true });
const stamp = meta.date.slice(0, 10);
const out = join(results, `matrix-${stamp}.json`);
writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
writeFileSync(out.replace(/\.json$/, '.md'), render(data));
console.log(`wrote ${out} and ${basename(out, '.json')}.md`);

// --- Markdown, generated from the JSON only. ---
function render(d: Json): string {
  const m = d.meta, v = m.versions;
  const x = (n: number | null | undefined, unit = '×') => (n == null ? '—' : `${n}${unit}`);
  const lines: string[] = [];
  const p = (s = '') => lines.push(s);
  p(`# Benchmark matrix (${m.date.slice(0, 10)})`);
  p();
  p(`Generated by \`engine/ts/packages/bench/src/matrix.ts\` from \`matrix-${m.date.slice(0, 10)}.json\`. Do not edit by hand.`);
  p();
  p(`**Machine.** ${m.machine.cpu}, ${m.machine.logicalCpus} logical CPUs, ${m.machine.memoryGiB} GiB, ${m.machine.os}. Load average ${m.machine.loadAverageAtStart.join(' / ')} at the start, ${m.loadAverageAtEnd.join(' / ')} at the end.`);
  p();
  p(`**Versions.** Node ${v.node} (V8 ${v.v8}); Bun ${v.bun} (revision ${v.bunRevision}, JavaScriptCore); ${v.rustc ?? 'rustc unknown'}.${m.settings.bunOptionsRemoved ? ` The shell set \`BUN_OPTIONS=${m.settings.bunOptionsRemoved}\`; it was removed, so Bun ran with its defaults.` : ''}`);
  p();
  p(`**Noise.** ${m.noise}`);
  p();
  p('## (a) End-to-end programs: original vs Viscosity, Node and Bun');
  p();
  p(d.e2e.method);
  p();
  p('Best of N (median in brackets), milliseconds of each program\'s timed section; speed-up = original / Viscosity.');
  p();
  p('| program | layout | Node original | Node Viscosity | Node speed-up | Bun original | Bun Viscosity | Bun speed-up |');
  p('|---|---|---:|---:|---:|---:|---:|---:|');
  for (const r of d.e2e.rows) {
    const c = (o: Json) => `${o.originalMs.best} (${o.originalMs.median}) | ${o.viscosityMs.best} (${o.viscosityMs.median}) | **${o.speedupBest}×** (${o.speedupMedian}×)`;
    p(`| ${r.program} | ${r.layouts} | ${c(r.node)} | ${c(r.bun)} |`);
  }
  const s = d.e2e.summary;
  p(`| **geomean** | | | | **${s.node.geomeanSpeedupBest}×** (${s.node.geomeanSpeedupMedian}×) | | | **${s.bun.geomeanSpeedupBest}×** (${s.bun.geomeanSpeedupMedian}×) |`);
  p();
  p(`Bun relative to Node (Node best / Bun best, geomean; above 1 means Bun is faster): original programs ${s.bunVsNode.originalGeomean}×, compiled programs ${s.bunVsNode.viscosityGeomean}×.`);
  p();
  const allRust = d.e2e.rows.every((r: Json) => r.rustCompilerIdentical);
  const sameCk = d.e2e.rows.filter((r: Json) => r.sameChecksumOnBothRuntimes).map((r: Json) => r.program);
  p(`Checksums: original and compiled matched on every run, on both runtimes. The same checksum on Node and on Bun: ${sameCk.length === d.e2e.rows.length ? 'all programs' : `${sameCk.join(', ') || 'none'} (the others differ between runtimes, for original and compiled alike)`}. The Rust CLI's compiled code is ${allRust ? 'byte-identical to the TS engine\'s for all programs' : 'NOT identical for: ' + d.e2e.rows.filter((r: Json) => !r.rustCompilerIdentical).map((r: Json) => r.program).join(', ')}.`);
  p();
  p('Whole-process wall time (median, ms; includes start-up and building the data):');
  p();
  p('| program | Node original | Node Viscosity | Bun original | Bun Viscosity |');
  p('|---|---:|---:|---:|---:|');
  for (const r of d.e2e.rows) p(`| ${r.program} | ${r.node.processWallMs.original} | ${r.node.processWallMs.viscosity} | ${r.bun.processWallMs.original} | ${r.bun.processWallMs.viscosity} |`);
  p();
  const cs = d.compileSpeed;
  p(`## (b) Compile speed: TS CLI vs Rust CLI over the corpus (${cs.programs} programs)`);
  p();
  p(`${cs.cli.method} TS: \`${cs.cli.tsCli}\`. Rust: \`${cs.cli.rustCli}\`.`);
  p();
  p(`**Total over the corpus (sum of medians): TS ${cs.cli.totalMedianMs.ts} ms, Rust ${cs.cli.totalMedianMs.rust} ms, ${cs.cli.totalSpeedup}× faster.** Outputs ${cs.cli.allIdentical ? 'byte-identical for every program' : 'DIFFER for: ' + cs.cli.rows.filter((r: Json) => !r.identical).map((r: Json) => r.program).join(', ')}.`);
  p();
  if (cs.inProcess.wasmAvailable) {
    p(`In-process (${cs.inProcess.method}): total of medians TS ${cs.inProcess.totalMedianUs.ts} µs, Rust as WebAssembly ${cs.inProcess.totalMedianUs.wasm} µs, ${cs.inProcess.totalSpeedup}× faster. Outputs (code and explain text) ${cs.inProcess.allIdentical ? 'identical' : 'DIFFER'}.`);
    p();
  }
  p(`| program | lines | TS CLI ms best (median) | Rust CLI ms best (median) | CLI speed-up (median) | TS in-process µs (median) | wasm in-process µs (median) | in-process speed-up |`);
  p('|---|---:|---:|---:|---:|---:|---:|---:|');
  cs.cli.rows.forEach((r: Json, i: number) => {
    const q = cs.inProcess.rows[i];
    p(`| ${r.program} | ${r.lines} | ${r.tsMs.best} (${r.tsMs.median}) | ${r.rustMs.best} (${r.rustMs.median}) | ${r.speedupMedian}× | ${q.tsUs.best} (${q.tsUs.median}) | ${q.wasmUs ? `${q.wasmUs.best} (${q.wasmUs.median})` : '—'} | ${x(q.speedupMedian)} |`);
  });
  p();
  p('## (c) Drip: tree-walker vs bytecode VM (TypeScript) vs drip-rs');
  p();
  p(`${d.drip.method} Sources: ${d.drip.sources.map((f: string) => `\`${f}\``).join(', ')}. TS: Node ${d.drip.tsEnv.node}, ${d.drip.tsEnv.date.slice(0, 10)}, ${d.drip.tsEnv.runs} run(s). Rust: ${d.drip.rustEnv.rustc}, ${d.drip.rustEnv.date.slice(0, 10)}, best of ${d.drip.rustEnv.runs}.`);
  p();
  p('| program | tree-walker ms | VM ms | drip-rs ms | VM vs tree | drip-rs vs VM | drip-rs vs tree |');
  p('|---|---:|---:|---:|---:|---:|---:|');
  for (const r of d.drip.rows) {
    const f = r.fixedTime ? '²' : '';
    p(`| ${r.program} | ${r.treeMs ?? '—'}${f} | ${r.vmMs ?? (r.vmError ? 'error¹' : '—')}${r.vmMs != null ? f : ''} | ${r.rustMs ?? (r.rustError ? 'error¹' : '—')}${r.rustMs != null ? f : ''} | ${x(r.vmVsTree)} | ${x(r.rustVsVm)} | ${x(r.rustVsTree)} |`);
  }
  p(`| **geomean** | | | | **${d.drip.geomean.vmVsTree}×** | **${d.drip.geomean.rustVsVm}×** | **${d.drip.geomean.rustVsTree}×** |`);
  const errs = d.drip.rows.filter((r: Json) => r.vmError);
  if (errs.length) { p(); p(`¹ ${errs.map((r: Json) => `${r.program}: the TS VM${r.rustError ? ' and drip-rs both stop' : ' stops'} with "${r.vmError}"`).join('; ')}. Geomeans skip missing cells.`); }
  const fixed = d.drip.rows.filter((r: Json) => r.fixedTime);
  if (fixed.length) { p(); p(`² ${fixed.map((r: Json) => r.program).join(', ')} runs for a fixed time and counts the batches it finishes, so its time is not a speed and it has no ratios here; its throughput is compared in the notes of \`${d.drip.sources[1].replace(/\.json$/, '.md')}\`.`); }
  p();
  return lines.join('\n');
}
