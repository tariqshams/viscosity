#!/usr/bin/env bash
# Benchmarks drip-rs on the corpus benchmark programs, the same programs
# as ../ts/scripts/bench.mjs: one fresh process per run, best of RUNS
# (default 3) wall-clock times, compile time included.
#
# Writes results/drip-rs-bench-<date>.json and .md, with a three-way
# table that adds the TypeScript tree-walker and VM numbers recorded in
# $TS_RESULTS (by default ../ts/results/drip-bench-2026-10-31.json).
#
# Usage: scripts/bench.sh [name-filter]
# Needs: cargo, and node to write the JSON (it is the book's other
# toolchain). For a single run by hand:
#   cargo run --release --bin drip-rs ../corpus/benchmark/fib.drip
set -euo pipefail

cd "$(dirname "$0")/.."
runs=${RUNS:-3}
filter=${1:-}
ts_results=${TS_RESULTS:-../ts/results/drip-bench-2026-10-31.json}
bin=target/release/drip-rs
cargo build --release --quiet

rows=$(mktemp)
out=$(mktemp)
err=$(mktemp)
trap 'rm -f "$rows" "$out" "$err"' EXIT

for file in ../corpus/benchmark/*.drip; do
  program=$(basename "$file" .drip)
  [[ -n "$filter" && "$program" != *"$filter"* ]] && continue
  best=""
  code=0
  for ((i = 0; i < runs; i++)); do
    start=$(date +%s%N)
    code=0
    "$bin" "$file" >"$out" 2>"$err" || code=$?
    end=$(date +%s%N)
    # A program that fails (string_equality hits the 256-constant limit
    # in both VMs) is reported, not timed.
    [[ $code -ne 0 ]] && break
    ms=$(((end - start) / 1000000))
    [[ -z "$best" || $ms -lt $best ]] && best=$ms
  done
  # One tab-separated row: program, ms, exit code, error, stdout.
  printf '%s\t%s\t%s\t%s\t%s\n' "$program" "${best:-}" "$code" \
    "$(head -n 1 "$err")" "$(tr '\n' ' ' <"$out")" >>"$rows"
  if [[ $code -eq 0 ]]; then
    printf '%-16s %8s ms\n' "$program" "$best"
  else
    printf '%-16s   error: %s\n' "$program" "$(head -n 1 "$err")"
  fi
done

node - "$rows" "$ts_results" "$runs" "$(rustc --version)" <<'EOF'
const fs = require('node:fs');
const [rowsFile, tsFile, runs, rustc] = process.argv.slice(2);
const ts = JSON.parse(fs.readFileSync(tsFile, 'utf8'));
const tsRows = new Map(ts.rows.map((r) => [r.program, r]));
const cpu = (fs.readFileSync('/proc/cpuinfo', 'utf8').match(/model name\s*:\s*(.*)/) ?? [])[1];
const date = new Date().toISOString();
const ratio = (a, b) => (a && b ? +(a / b).toFixed(2) : null);

const rows = fs.readFileSync(rowsFile, 'utf8').trim().split('\n').map((line) => {
  const [program, ms, exit, error, stdout] = line.split('\t');
  const t = tsRows.get(program) ?? {};
  const rust = exit === '0' ? Number(ms) : null;
  return {
    program,
    rust,
    ...(rust === null ? { rustError: error } : {}),
    stdout: stdout.trim(),
    tsTree: t.tree ?? null,
    tsVm: t.vm ?? null,
    ...(t.vmError ? { tsVmError: t.vmError } : {}),
    speedupVsTsVm: ratio(t.vm, rust),
    speedupVsTsTree: ratio(t.tree, rust),
  };
});

const env = {
  rustc,
  cpu,
  date,
  runs: Number(runs),
  tsResults: tsFile.split('/').pop(),
  tsEnv: ts.env,
  note:
    'drip-rs: best of N wall-clock runs, each a fresh process, compile time ' +
    'included. TypeScript numbers are copied from tsResults (measured in-process, ' +
    `best of ${ts.env.runs}). Same shared cloud VM for both, so expect noise.`,
};
const stamp = date.slice(0, 10);
fs.mkdirSync('results', { recursive: true });
fs.writeFileSync(`results/drip-rs-bench-${stamp}.json`, JSON.stringify({ env, rows }, null, 2) + '\n');

const cell = (v) => (v === null || v === undefined ? '—' : String(v));
const x = (v) => (v === null ? '—' : `${v}×`);
let md = `# Drip: Rust VM vs TypeScript VM vs TypeScript tree-walker\n\n`;
md += `${cpu}, ${date}. ${rustc}; TypeScript on Node ${ts.env.node}.\n\n${env.note}\n\n`;
md += '| program | TS tree-walker (ms) | TS VM (ms) | drip-rs (ms) | drip-rs vs TS VM | drip-rs vs tree-walker |\n';
md += '|---|---:|---:|---:|---:|---:|\n';
for (const r of rows) {
  const rust = r.rust === null ? `error: ${r.rustError}` : r.rust;
  const tsVm = r.tsVm === null && r.tsVmError ? 'error (same)' : cell(r.tsVm);
  md += `| ${r.program} | ${cell(r.tsTree)} | ${tsVm} | ${rust} | ${x(r.speedupVsTsVm)} | ${x(r.speedupVsTsTree)} |\n`;
}
const zoo = rows.find((r) => r.program === 'zoo_batch');
if (zoo) {
  const batches = zoo.stdout.split(' ')[1];
  md += `\nzoo_batch runs for a fixed 10 seconds, so its time says little: what `;
  md += `differs is how many batches it finishes. drip-rs finished ${batches}.\n`;
}
fs.writeFileSync(`results/drip-rs-bench-${stamp}.md`, md);
console.log(`wrote results/drip-rs-bench-${stamp}.json and .md`);
EOF
