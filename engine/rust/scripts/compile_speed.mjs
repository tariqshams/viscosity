#!/usr/bin/env node
// In-process compile time of the TypeScript engine on the end-to-end
// benchmark programs: warm up, then time each compile() call and report the
// median and minimum in microseconds. The Rust counterpart is
// `cargo run --release -p viscosity-cli --example compile_speed`.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ts = join(here, '..', '..', 'ts', 'packages');
const { compile } = await import(join(ts, 'core', 'src', 'index.ts'));
const { jsPlugin } = await import(join(ts, 'frontend-js', 'src', 'index.ts'));
const dir = join(ts, 'bench', 'e2e');
const runs = Number(process.env.RUNS ?? 500);
const warmup = Number(process.env.WARMUP ?? 100);
for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  const src = readFileSync(join(dir, f), 'utf8');
  const plugin = jsPlugin();
  for (let i = 0; i < warmup; i++) compile(src, plugin);
  const us = [];
  for (let i = 0; i < runs; i++) {
    const t0 = process.hrtime.bigint();
    compile(src, plugin);
    us.push(Number(process.hrtime.bigint() - t0) / 1000);
  }
  us.sort((a, b) => a - b);
  console.log(`${f.padEnd(14)} median ${us[us.length >> 1].toFixed(1).padStart(8)} us   min ${us[0].toFixed(1).padStart(8)} us`);
}
