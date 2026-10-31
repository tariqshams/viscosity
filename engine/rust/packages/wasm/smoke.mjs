// Smoke test for @viscosity/wasm as a user would get it: `npm pack`, install
// the tarball into an empty directory, then compile every corpus program
// (JavaScript, and Python with --python-auto) from Node through the package,
// with the nodejs target (require and import) and the web target (init with
// the bytes), and compare the code and explain text with the TypeScript CLI's
// output. Also type-checks a small consumer against the shipped .d.ts files.
//
//   node smoke.mjs            (after node build.mjs)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ts = join(here, '..', '..', '..', 'ts');
const cli = join(ts, 'packages', 'cli', 'bin', 'viscosity.mjs');
const tsc = join(here, '..', '..', '..', '..', 'book', 'node_modules', 'typescript', 'bin', 'tsc');
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20, timeout: 120000, ...opts });
if (!existsSync(join(here, 'dist', 'web', 'viscosity_wasm_bg.wasm'))) throw new Error('run node build.mjs first');

// 1. Pack (without prepack: the build is already there) and install.
const tmp = mkdtempSync(join(tmpdir(), 'vsc-wasm-smoke-'));
const packed = JSON.parse(sh('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', tmp], { cwd: here }))[0];
console.log(`packed ${packed.filename}: ${packed.files.length} files, ${(packed.size / 1024).toFixed(0)} KiB (${(packed.unpackedSize / 1024).toFixed(0)} KiB unpacked)`);
for (const f of packed.files) console.log(`  ${f.path} ${f.size}`);
const app = join(tmp, 'app');
sh('mkdir', ['-p', app]);
writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke-app', private: true, type: 'module' }));
sh('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', join(tmp, packed.filename)], { cwd: app });

// 2. The programs, and what the TS CLI prints for them.
const progs = [];
const jsDir = join(ts, 'packages', 'frontend-js', 'test', 'corpus');
const pyDir = join(ts, 'packages', 'frontend-python', 'test', 'corpus');
for (const f of readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort()) progs.push({ file: join(jsDir, f), language: 'javascript', flags: [] });
for (const f of readdirSync(pyDir).filter((f) => f.endsWith('.py')).sort()) progs.push({ file: join(pyDir, f), language: 'python', flags: ['--python-auto'] });
for (const p of progs) {
  p.code = sh(process.execPath, [cli, 'build', p.file, ...p.flags]);
  p.explain = sh(process.execPath, [cli, 'explain', p.file, ...p.flags]);
}
writeFileSync(join(app, 'progs.json'), JSON.stringify(progs));

// 3. Compile them through the installed package. The CLI prints the code as
// is and the explain text plus a newline ("No arrays of objects found." when
// there is nothing to say).
const compare = `
  const progs = JSON.parse(fs.readFileSync('progs.json', 'utf8'));
  let bad = 0;
  for (const p of progs) {
    const src = fs.readFileSync(p.file, 'utf8');
    const r = p.language === 'python'
      ? m.compileLanguage('python', src, 'auto', 'check', 64, true)
      : m.compile(src);
    const explain = (r.explain || 'No arrays of objects found.') + '\\n';
    if (r.code !== p.code || explain !== p.explain) { bad++; console.error('MISMATCH ' + p.file); }
  }
  console.log(JSON.stringify({ programs: progs.length, mismatches: bad }));
`;
const variants = {
  'nodejs target, require()': `const fs = require('fs'); const m = require('@viscosity/wasm');\n${compare}`,
  'nodejs target, import': `import fs from 'node:fs'; import * as m from '@viscosity/wasm';\n${compare}`,
  'web target, init(bytes)': `import fs from 'node:fs'; import { createRequire } from 'node:module';
    import init, * as m from '@viscosity/wasm/web';
    const wasm = createRequire(import.meta.url).resolve('@viscosity/wasm/viscosity_wasm_bg.wasm');
    await init({ module_or_path: fs.readFileSync(wasm) });\n${compare}`,
};
let failed = 0;
for (const [name, code] of Object.entries(variants)) {
  const f = join(app, name.startsWith('nodejs target, require') ? 't.cjs' : 't.mjs');
  writeFileSync(f, code);
  let res;
  try { res = JSON.parse(sh(process.execPath, [f], { cwd: app }).trim()); } catch (e) { res = { error: String(e.stderr || e) }; }
  const ok = res.mismatches === 0 && res.programs === progs.length;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}: ${JSON.stringify(res)}`);
}

// 4. The types, as a TypeScript user sees them (node and browser conditions).
if (existsSync(tsc)) {
  writeFileSync(join(app, 'node.mts'), `import { compile, compileWith, compileLanguage, type Output } from '@viscosity/wasm';\nconst a: Output = compile('const xs = [];');\nconst b: string = compileWith('', 'auto', 'check', 64).code + compileLanguage('python', '', 'auto', 'check', 64, true).explain;\nexport const out = a.code + b;\n`);
  writeFileSync(join(app, 'web.ts'), `import init, { compile } from '@viscosity/wasm';\nawait init({ module_or_path: new URL('x.wasm', 'https://example.com/') });\nconst s: string = compile('').explain;\nexport { s };\n`);
  const checks = {
    'types (node, nodenext)': ['--noEmit', '--strict', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', '--lib', 'es2022,esnext.disposable', 'node.mts'],
    'types (browser, bundler)': ['--noEmit', '--strict', '--module', 'esnext', '--moduleResolution', 'bundler', '--customConditions', 'browser', '--target', 'es2022', '--lib', 'es2022,esnext.disposable,dom', 'web.ts'],
  };
  for (const [name, args] of Object.entries(checks)) {
    try { sh(process.execPath, [tsc, ...args], { cwd: app }); console.log(`✓ ${name}`); } catch (e) { failed++; console.log(`✗ ${name}\n${e.stdout}`); }
  }
} else console.log(`(types not checked: ${tsc} not found)`);

rmSync(tmp, { recursive: true, force: true });
if (failed) { console.error(`\n${failed} smoke check(s) failed`); process.exit(1); }
console.log(`\nsmoke: ${progs.length} programs identical to the TS CLI through the installed package`);
