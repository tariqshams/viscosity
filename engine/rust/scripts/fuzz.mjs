#!/usr/bin/env node
// Differential fuzzer for the two Viscosity engines.
//
// It generates random programs in the JavaScript subset Viscosity cares
// about: arrays of record literals pushed in loops (or written as literals),
// field reads and writes in loops, compound updates, conditionals, functions
// that take arrays or elements, escapes (closures, returns, ===, method
// calls, storing elements elsewhere), out-of-bounds accesses inside
// try/catch, annotations, and number, string and mixed fields. For every
// program it checks
//
//   (a) behaviour: the original and the compiled program, run with node in a
//       fresh VM context, print the same output and throw the same error.
//       Both bounds modes are checked; with `--bounds assume` the program is
//       trusted to stay in bounds, so programs that may index out of bounds
//       are only run with `--bounds check`.
//   (b) parity: the TypeScript engine and the Rust engine produce the same
//       compiled code (both bounds modes), the same explain text (both
//       modes) and the same `explain --frames` text, byte for byte.
//
// Each batch also has a random profile (as `viscosity profile` writes it),
// and the explain text with that profile (`explain --profile`) must match.
//
// About one program in 20 gets an ECMAScript early error inserted (a
// redeclaration, `break` outside a loop, a duplicate label, an undeclared
// export, a strict-mode error, ...). Both engines must reject it.
//
// It lives here, next to gen_expected.mjs, because two of its three oracles
// are JavaScript: the TypeScript engine runs in-process, and so does the
// node VM that executes the programs. The Rust engine is reached through
// its CLI, a batch of files per call (`viscosity build a.js b.js -o dir/`),
// so it costs a few process starts per batch rather than per program.
//
// Usage (Node >= 22.18, which strips TypeScript types natively):
//   node scripts/fuzz.mjs                        # 300 programs, seed 1 (CI runs 200: tests/fuzz.rs)
//   node scripts/fuzz.mjs --count 20000 --seed 7 # a long campaign
//   node scripts/fuzz.mjs --seed 7 --only 1234 --print   # show one program
//
// Options:
//   --count N     programs to generate (default 300)
//   --seed S      campaign seed (default 1); program k uses a seed derived
//                 from (S, k), so any program can be regenerated alone
//   --only K      generate and check only program K
//   --print       print the program(s) instead of checking them
//   --rust PATH   the viscosity binary (default: target/debug/viscosity, or
//                 target/release/viscosity if there is no debug build)
//   --no-rust     skip the TS-vs-Rust checks
//   --batch N     programs per Rust CLI call (default 250)
//   --keep DIR    where failing programs are written (default: a temp dir)
//   --reduce      shrink each failing program (line-based delta debugging)
//   --max-fail N  stop after N failing programs (default 20)
//   --quiet       print only the summary
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { inspect } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const rustRoot = join(here, '..');
const ts = join(rustRoot, '..', 'ts', 'packages');
const { compile, explain } = await import(join(ts, 'core', 'src', 'index.ts'));
const { jsPlugin } = await import(join(ts, 'frontend-js', 'src', 'index.ts'));
const acorn = createRequire(join(ts, 'frontend-js', 'package.json'))('acorn');

// ---- options ----------------------------------------------------------------

function parseArgs(argv) {
  const o = { count: 300, seed: 1, only: null, print: false, rust: '', noRust: false, batch: 250, keep: '', reduce: false, maxFail: 20, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const num = () => {
      const v = Number(argv[++i]);
      if (!Number.isInteger(v) || v < 0) throw new Error(`${a} needs a whole number`);
      return v;
    };
    if (a === '--count') o.count = num();
    else if (a === '--seed') o.seed = num();
    else if (a === '--only') o.only = num();
    else if (a === '--print') o.print = true;
    else if (a === '--rust') o.rust = argv[++i];
    else if (a === '--no-rust') o.noRust = true;
    else if (a === '--batch') o.batch = Math.max(1, num());
    else if (a === '--keep') o.keep = argv[++i];
    else if (a === '--reduce') o.reduce = true;
    else if (a === '--max-fail') o.maxFail = num();
    else if (a === '--quiet') o.quiet = true;
    else throw new Error(`unknown option ${a} (see the comment at the top of fuzz.mjs)`);
  }
  return o;
}

// ---- random numbers ------------------------------------------------------------

/** mulberry32: small, fast and good enough to drive a generator. */
function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    /** pick from [weight, value] pairs */
    weighted: (pairs) => {
      let t = next() * pairs.reduce((s, [w]) => s + w, 0);
      for (const [w, v] of pairs) if ((t -= w) < 0) return v;
      return pairs[pairs.length - 1][1];
    },
  };
  return r;
}

/** The seed of program k in campaign s (splitmix-style mixing). */
function programSeed(s, k) {
  let x = (Math.imul(s, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca77)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

// ---- the program generator ---------------------------------------------------------

const FIELD_NAMES = ['x', 'y', 'z', 'vx', 'vy', 'm', 'w', 'id', 'name', 'tag', 'a', 'b'];
const RARE_FIELD_NAMES = ['length', 'push', 'constructor', 'cap', 'data', 'of', 'grow', '__proto__x', '$v', '_k'];
const COLL_NAMES = ['ps', 'qs', 'items', 'pts', 'rows', 'cells'];

/**
 * Generates one program. Returns { code, oob }: oob means the program may
 * index out of bounds, so it is not run with `--bounds assume`.
 */
export function generate(seed) {
  const R = rng(seed);
  const out = [];
  let oob = false;
  let uid = 0;
  const fresh = (p) => `${p}${uid++}`;
  const emit = (s) => out.push(s);

  // -- collections
  const nColl = R.weighted([[5, 1], [4, 2], [1, 3]]);
  const colls = [];
  const usedNames = new Set();
  for (let c = 0; c < nColl; c++) {
    let name = R.pick(COLL_NAMES);
    while (usedNames.has(name)) name = R.pick(COLL_NAMES) + c;
    usedNames.add(name);
    const nf = R.weighted([[2, 1], [4, 2], [3, 3], [1, 4]]);
    const fields = [];
    const kinds = {};
    while (fields.length < nf) {
      const f = R.chance(0.06) ? R.pick(RARE_FIELD_NAMES) : R.pick(FIELD_NAMES);
      if (fields.includes(f)) continue;
      fields.push(f);
      kinds[f] = R.weighted([[7, 'num'], [2, 'str'], [1, 'mixed']]);
    }
    const size = R.weighted([[1, 0], [1, 1], [2, 5], [5, 64], [6, 100], [3, 150], [1, 70]]);
    colls.push({ name, fields, kinds, size, decl: R.chance(0.8) ? 'const' : 'let', func: null });
  }

  const numInit = (i) => R.pick([i, `${i} * 0.5`, `${i} % 7 - 3`, `-${i}`, '0', '1', `${i} * ${i}`, `1 / (${i} + 1)`, `Math.sin(${i})`, `${i} | 0`, '-0', `${i} / 3`, `(${i} * 37) % 11`, '2.5']);
  const strInit = (i) => R.pick([`'p' + ${i}`, `String(${i})`, '`t${' + i + '}`', "'s'", "''", `'k' + (${i} % 3)`]);
  const mixedInit = (i) => R.pick([`${i} % 2 ? ${i} : 'odd'`, `${i} > 50 ? null : ${i}`, 'undefined', 'true', `${i} % 3 === 0`, `{ v: ${i} }`, `[${i}]`, `${i} > 2 ? ${i} : undefined`, 'NaN', `${i} % 4 ? ${i} : ${i} + ''`]);
  const init = (c, f, i) => (c.kinds[f] === 'num' ? numInit(i) : c.kinds[f] === 'str' ? strInit(i) : mixedInit(i));
  const quote = (f) => (/^[A-Za-z_$][\w$]*$/.test(f) && f !== '__proto__' ? f : `'${f}'`);
  const record = (c, i, fields = c.fields) => `{ ${fields.map((f) => `${quote(f)}: ${init(c, f, i)}`).join(', ')} }`;

  emit(`// fuzz program, seed ${seed}`);
  emit(`let k = ${R.int(1, 4)};`);
  emit(`const show = (v) => (Object.is(v, -0) ? '-0' : String(v));`);
  for (const c of colls) {
    const ann = R.weighted([[12, ''], [1, 'soa'], [1, 'aos'], [1, 'aosoa(4)'], [1, 'aosoa(8)'], [0.3, 'aosoa(2)'], [0.3, 'aosoa(3)']]);
    if (ann) emit(`// @viscosity ${ann}`);
    if (R.chance(0.15) && c.size <= 5) {
      const elems = [];
      for (let k = 0; k < c.size; k++) elems.push(record(c, String(k)));
      emit(`${c.decl} ${c.name} = [${elems.join(', ')}];`);
      continue;
    }
    emit(`${c.decl} ${c.name} = [];`);
    const form = R.weighted([[6, 'for'], [1, 'cond'], [1, 'while'], [1, 'func'], [1, 'two']]);
    if (form === 'for') emit(`for (let i = 0; i < ${c.size}; i++) ${c.name}.push(${record(c, 'i')});`);
    else if (form === 'cond') emit(`for (let i = 0; i < ${c.size * 2}; i++) if (i % 2 === 0) ${c.name}.push(${record(c, 'i')});`);
    else if (form === 'while') emit(`{ let i = 0; while (i < ${c.size}) { ${c.name}.push(${record(c, 'i')}); i++; } }`);
    else if (form === 'func') {
      const fn = fresh('add');
      emit(`function ${fn}(n) { for (let i = 0; i < n; i++) ${c.name}.push(${record(c, 'i')}); }`);
      emit(`${fn}(${c.size});`);
    } else {
      emit(`for (let i = 0; i < ${Math.ceil(c.size / 2)}; i++) ${c.name}.push(${record(c, 'i')});`);
      emit(`for (let j = 0; j < ${Math.floor(c.size / 2)}; j++) ${c.name}.push(${record(c, '(j + 1000)')});`);
    }
  }

  // -- helpers for statements
  const coll = () => R.pick(colls);
  const field = (c, kind) => {
    const fs = kind ? c.fields.filter((f) => c.kinds[f] === kind) : c.fields;
    return fs.length ? R.pick(fs) : R.pick(c.fields);
  };
  const acc = (c, f, ix) => (quote(f) === f ? `${c.name}[${ix}].${f}` : `${c.name}[${ix}][${quote(f)}]`);
  const accOn = (base, f) => (quote(f) === f ? `${base}.${f}` : `${base}[${quote(f)}]`);
  const numExpr = (c, ix) => R.pick([
    () => acc(c, field(c, 'num'), ix), () => String(R.int(-3, 9)), () => ix, () => `${acc(c, field(c, 'num'), ix)} * ${R.pick(['2', '0.5', '-1', '3'])}`,
    () => `Math.abs(${acc(c, field(c, 'num'), ix)})`, () => `(${acc(c, field(c, 'num'), ix)} + ${ix}) % 5`, () => `${acc(c, field(c), ix)} | 0`,
    () => `${acc(c, field(c, 'num'), ix)} > ${R.int(0, 50)} ? 1 : -1`, () => `Math.max(${acc(c, field(c, 'num'), ix)}, 0)`, () => 'k',
  ])();
  const sums = [];
  const newSum = () => {
    const s = fresh('s');
    emit(`let ${s} = 0;`);
    sums.push(s);
    return s;
  };
  // An in-bounds-looking index expression for "some element".
  const someIndex = (c) => {
    if (c.size === 0) { oob = true; return R.pick(['0', `${c.name}.length - 1`]); }
    return R.pick(['0', String(R.int(0, c.size - 1)), `${c.name}.length - 1`, `${c.name}.length >> 1`]);
  };
  const badIndex = (c) => R.pick([`${c.name}.length`, '-1', String(c.size + R.int(0, 5)), '1.5', `${c.name}.length + 1`, 'NaN', "'0'", '2 ** 32']);

  /** The body of an element loop over index `ix`. */
  const loopBody = (c, ix) => {
    const n = R.int(1, 3);
    const parts = [];
    for (let k = 0; k < n; k++) {
      const f = field(c);
      const kind = c.kinds[f];
      parts.push(R.weighted([
        [4, () => `${acc(c, f, ix)} ${R.pick(['+=', '-=', '*=', '/=', '%=', '**=', '|=', '&=', '^=', '<<=', '>>=', '>>>='])} ${kind === 'str' ? R.pick(["'!'", '1']) : numExpr(c, ix)};`],
        [3, () => `${acc(c, f, ix)} = ${kind === 'str' ? R.pick([`${acc(c, f, ix)} + 'a'`, `'v' + ${ix}`, `String(${acc(c, f, ix)}).toUpperCase()`]) : numExpr(c, ix)};`],
        [3, () => `${S} += ${kind === 'num' ? acc(c, f, ix) : `${acc(c, f, ix)} === undefined ? 0 : 1`};`],
        [2, () => `${R.pick(['++', '--'])}${acc(c, f, ix)};`],
        [1, () => `${acc(c, f, ix)}${R.pick(['++', '--'])};`],
        [2, () => `if (${acc(c, field(c), ix)} > ${R.int(-2, 60)}) ${acc(c, f, ix)} = ${numExpr(c, ix)}; else ${S} -= 1;`],
        [1, () => `${acc(c, f, ix)} ${R.pick(['&&=', '||=', '??='])} ${numExpr(c, ix)};`],
        [1, () => `{ const t = ${acc(c, field(c), ix)}; ${acc(c, f, ix)} = t; }`],
        [1, () => `${S} += ${acc(c, field(c), ix)} ${R.pick(['<', '>', '===', '!==', '=='])} ${R.pick(['0', "'s'", 'null', acc(c, field(c), ix)])} ? 1 : 0;`],
        [1, () => `${S} += typeof ${acc(c, f, ix)} === 'number' ? 1 : 2;`],
        [1, () => c.size > 0 ? `${acc(c, f, `(${ix} + 1) % ${c.name}.length`)} += 1;` : `${S} += 1;`],
        [0.5, () => `${S} += ${acc(c, f, ix)}${R.pick(['', '.length', '?.toString().length'])} ? 1 : 0;`],
        [0.4, () => `${acc(c, f, ix)} = (${S}++, ${numExpr(c, ix)});`],
        [0.3, () => `${acc(c, f, ix)} = ${acc(c, field(c), ix)} = ${numExpr(c, ix)};`],
      ])());
    }
    return parts.join(' ');
  };
  let S = 's';

  const statements = [
    // element loops in every shape
    [10, () => {
      const c = coll();
      S = newSum();
      const shape = R.weighted([[6, 'up'], [1, 'down'], [1, 'step'], [1, 'const'], [1, 'le'], [2, 'forof'], [1, 'while'], [1, 'nested'], [0.5, 'alias']]);
      if (shape === 'up') emit(`for (let i = 0; i < ${c.name}.length; i++) { ${loopBody(c, 'i')} }`);
      else if (shape === 'down') emit(`for (let i = ${c.name}.length - 1; i >= 0; i--) { ${loopBody(c, 'i')} }`);
      else if (shape === 'step') emit(`for (let i = 0; i < ${c.name}.length; i += 2) { ${loopBody(c, 'i')} }`);
      else if (shape === 'const') {
        const n = R.pick([c.size, c.size, Math.max(0, c.size - 3), c.size + 1]);
        if (n > c.size) oob = true;
        const body = loopBody(c, 'i');
        if (n > c.size) emit(`try { for (let i = 0; i < ${n}; i++) { ${body} } } catch (e) { console.log('caught', e.message); }`);
        else emit(`for (let i = 0; i < ${n}; i++) { ${body} }`);
      } else if (shape === 'le') {
        oob = true;
        emit(`try { for (let i = 0; i <= ${c.name}.length; i++) { ${loopBody(c, 'i')} } } catch (e) { console.log('caught', e.constructor.name, e.message); }`);
      } else if (shape === 'forof') {
        const f = field(c);
        emit(`for (const p of ${c.name}) { ${R.pick([`${S} += ${accOn('p', f)} ? 1 : 0;`, `${accOn('p', f)} = ${R.int(0, 9)};`, `${accOn('p', f)} += 1; ${S} += 1;`])} }`);
      } else if (shape === 'while') emit(`{ let i = 0; while (i < ${c.name}.length) { ${loopBody(c, 'i')} i++; } }`);
      else if (shape === 'nested') emit(`for (let r = 0; r < 2; r++) for (let i = 0; i < ${c.name}.length; i++) { ${loopBody(c, 'i')} }`);
      else emit(`for (let i = 0; i < ${c.name}.length; i++) { const p = ${c.name}[i]; ${accOn('p', field(c))} = i; ${S} += ${accOn('p', field(c))} ? 1 : 0; }`);
    }],
    // a function that takes the collection (interprocedural)
    [4, () => {
      const c = coll();
      const fn = fresh('step');
      const f = field(c);
      emit(`function ${fn}(arr, k) { let t = 0; for (let i = 0; i < arr.length; i++) { ${accOn('arr[i]', f)} ${R.pick(['+=', '-=', '='])} k; t += 1; } return t; }`);
      const other = R.weighted([[6, null], [1, 'literal'], [1, 'otherColl'], [1, 'twice']]);
      emit(`console.log(${fn}(${c.name}, ${R.int(1, 5)}));`);
      if (other === 'literal') emit(`console.log(${fn}([${record(c, '7')}], 2));`);
      else if (other === 'otherColl') emit(`console.log(${fn}(${coll().name}, 3));`);
      else if (other === 'twice') emit(`console.log(${fn}(${c.name}, -1));`);
    }],
    // a function that takes an element
    [2, () => {
      const c = coll();
      const fn = fresh('get');
      const f = field(c);
      emit(`function ${fn}(p) { return ${R.pick([accOn('p', f), `${accOn('p', f)} + 1`, 'p'])}; }`);
      S = newSum();
      emit(`for (let i = 0; i < ${c.name}.length; i++) ${S} += ${fn}(${c.name}[i]) ? 1 : 0;`);
    }],
    // a function that pushes into the collection, called while a field is updated
    [1, () => {
      const c = coll();
      const fn = fresh('more');
      const n = R.pick([1, 1, 20, 40, 100]);
      emit(`function ${fn}() { for (let j = 0; j < ${n}; j++) ${c.name}.push(${record(c, 'j')}); return 1; }`);
      const f = field(c, 'num');
      const ix = c.size > 0 ? someIndex(c) : '0';
      if (c.size === 0) oob = true;
      const rhs = R.pick([`${fn}()`, `(${fn}(), ${R.int(1, 5)})`, `(${fn}(), ${acc(c, f, ix)})`, `${fn}() ? 2 : 3`]);
      const stmt = `${acc(c, f, ix)} ${R.pick(['+=', '=', '=', '*=', '||=', '-='])} ${rhs};`;
      emit(c.size === 0 ? `try { ${stmt} } catch (e) { console.log('caught', e.message); }` : stmt);
    }],
    // pushes after the fact, possibly of another shape
    [2, () => {
      const c = coll();
      const shape = R.weighted([[4, c.fields], [1, [...c.fields].reverse()], [1, [...c.fields, 'extra']], [1, c.fields.slice(1)]]);
      emit(`if (${c.name}.length > ${R.int(0, 3)}) ${c.name}.push(${record(c, '42', shape.length ? shape : c.fields)});`);
    }],
    // escapes
    [6, () => {
      const c = coll();
      const ix = someIndex(c);
      const e = R.weighted([
        [2, () => `console.log(${c.name}[${ix}]);`],
        [2, () => `console.log(${c.name}[${ix}] === ${c.name}[${someIndex(c)}]);`],
        [1, () => { const v = fresh('e'); return `const ${v} = ${c.name}[${ix}]; ${accOn(v, field(c))} = 7; console.log(${acc(c, field(c), ix)});`; }],
        [1, () => { const o = fresh('other'); return `const ${o} = []; ${o}.push(${c.name}[${ix}]); console.log(${o}.length);`; }],
        [1, () => { const h = fresh('h'); return `const ${h} = { p: ${c.name}[${ix}] }; console.log(typeof ${h}.p);`; }],
        [1, () => `console.log(JSON.stringify(${c.name}.slice(0, 2)));`],
        [1, () => `${c.name}.forEach((p) => { ${accOn('p', field(c))} = 1; });`],
        [1, () => { const g = fresh('g'); return `const ${g} = () => ${acc(c, field(c), ix)}; console.log(${g}());`; }],
        [1, () => { const g = fresh('g'); return `const ${g} = () => ${c.name}.length; console.log(${g}());`; }],
        [1, () => { const g = fresh('ret'); return `function ${g}() { return ${c.name}; } console.log(${g}().length);`; }],
        [1, () => `console.log(${c.name}.map((p) => ${accOn('p', field(c))}).slice(0, 3).join(','));`],
        [1, () => `console.log(typeof ${c.name}[${ix}]);`],
        [1, () => `console.log(Object.keys(${c.name}[${ix}] ?? {}).join(','));`],
        [1, () => `${c.name}[${ix}] = ${record(c, '5')};`],
        [0.5, () => `console.log('${field(c)}' in (${c.name}[${ix}] ?? {}));`],
        [0.5, () => `${c.name}.length = ${R.int(0, 3)};`],
        [0.5, () => `${c.name}.pop();`],
        [0.5, () => `${c.name}.reverse();`],
        [0.5, () => `console.log([...${c.name}].length);`],
        [0.5, () => `console.log(Array.isArray(${c.name}));`],
        [0.5, () => { const v = fresh('d'); return `const { ${field(c)}: ${v} } = ${c.name}[${ix}] ?? {}; console.log(${v});`; }],
        [0.5, () => `console.log(${c.name}[${ix}]?.${quote(field(c)) === field(c) ? field(c) : 'x'});`],
        [0.5, () => `delete ${acc(c, field(c), ix)};`],
        [0.5, () => { const k = fresh('key'); return `for (const ${k} in ${c.name}[${ix}] ?? {}) console.log(${k});`; }],
        [0.3, () => `${c.name}.foo = 1;`],
        [0.3, () => `if (${c.name}) console.log('truthy');`],
        [0.3, () => `console.log(${c.name} == null);`],
        [0.3, () => { const t = fresh('t'); return `const ${t} = ${c.name}; console.log(${t}.length);`; }],
        [0.3, () => `console.log(${c.name}.length && ${acc(c, field(c), '0')});`],
        [0.3, () => (c.decl === 'let' ? `${c.name} = [];` : `console.log(${c.name}.length);`)],
        [0.5, () => { const v = fresh('e'); return `const ${v} = ${c.name}.length > 1 ? ${c.name}[0] : ${c.name}[${ix}]; console.log(typeof ${v});`; }],
        [0.5, () => `console.log(${c.name}[${ix}] && ${acc(c, field(c), ix)});`],
        [0.5, () => { const v = fresh('e'); const g = fresh('g'); return `const ${v} = ${c.name}[${ix}]; const ${g} = () => ${accOn(v, field(c))}; console.log(${g}());`; }],
        [0.3, () => `console.log(void ${c.name}[${ix}]);`],
        [0.3, () => `switch (${acc(c, field(c), ix)}) { case 0: console.log('zero'); break; default: console.log('other'); }`],
      ])();
      emit(e);
    }],
    // out-of-bounds accesses inside try/catch
    [2.5, () => {
      const c = coll();
      oob = true;
      const bad = badIndex(c);
      const f = field(c);
      const a = R.weighted([
        [3, () => `console.log(${acc(c, f, bad)});`],
        [2, () => `${acc(c, f, bad)} = 1;`],
        [2, () => `${acc(c, f, bad)} += 1;`],
        [1, () => `${acc(c, f, bad)}++;`],
        [1, () => `console.log(${acc(c, f, `${c.name}.length - ${R.int(0, 2)}`)});`],
      ])();
      emit(`try { ${a} } catch (e) { console.log('caught', e.constructor.name, e.message); }`);
    }],
    // values and indexes that themselves read collections, assign or run code
    [4, () => {
      const c = coll();
      const d = coll();
      const f = field(c, 'num');
      const g = field(d, 'num');
      const dIx = d.size > 0 ? `i % ${d.name}.length` : '0';
      if (d.size === 0) oob = true;
      S = newSum();
      const wrapTry = (st) => (d.size === 0 || c.size === 0 ? `try { ${st} } catch (e) { console.log('caught', e.message); }` : st);
      const st = R.weighted([
        [2, () => `for (let i = 0; i < ${R.int(1, 6)}; i++) ${c.name}.push(${record(c, R.pick([`${acc(d, g, dIx)}`, `(k++, i)`, `(${acc(d, g, dIx)} | 0)`, 'i']))});`],
        [2, () => `for (let i = 0; i < ${c.name}.length; i++) ${acc(c, f, 'i')} ${R.pick(['=', '+=', '-='])} ${acc(d, g, dIx)};`],
        // (x | 0) % n may be negative: out of bounds.
        [2, () => { oob = true; return `for (let i = 0; i < ${c.name}.length; i++) ${acc(c, f, `(${acc(d, g, dIx)} | 0) % ${c.name}.length`)} += 1;`; }],
        [1, () => { oob = true; return `for (let i = 0; i < ${c.name}.length; i++) { const p = ${c.name}[(k++, i)]; ${R.pick([`${S} += ${accOn('p', f)};`, `${accOn('p', f)} = ${acc(c, f, `(${acc(c, f, 'i')} | 0) % ${c.name}.length`)};`])} }`; }],
        [1, () => `for (let i = 0; i < ${c.name}.length; i++) ${S} += ${acc(c, f, '(k++, i)')};`],
        [1, () => `for (let i = 0; i < ${c.name}.length; i++) ${acc(c, f, 'i')} = ${R.pick(['(k = i)', 'k++', '(k += 2, i)', '--k'])};`],
        [1, () => `${R.pick([`(${acc(c, f, someIndex(c))})`, `${acc(c, f, someIndex(c))} /* = */`, `${acc(c, f, someIndex(c))} // c
 `])} ${R.pick(['=', '+=', '||='])} ${R.int(1, 9)};`],
        [1, () => `{ const p = ${c.name}[${someIndex(c)}]; p${quote(f) === f ? '.' + f : `[${quote(f)}]`} = (k = ${R.int(1, 9)}); }`],
        [1, () => `for (let i = 0; i < ${c.name}.length; i++) { if (i === 2) ${c.name}.push(${record(c, 'i')}); ${acc(c, f, 'i')} += 1; }`],
      ])();
      emit(wrapTry(st));
    }],
    // a function that pushes through a parameter, run inside a write
    [1, () => {
      const c = coll();
      const fn = fresh('addTo');
      emit(`function ${fn}(arr, n) { for (let j = 0; j < n; j++) arr.push(${record(c, 'j')}); return n; }`);
      const f = field(c, 'num');
      if (c.size === 0) oob = true;
      const ix = c.size > 0 ? someIndex(c) : '0';
      const st = `${acc(c, f, ix)} ${R.pick(['=', '+=', '='])} (${fn}(${c.name}, ${R.pick([1, 30, 70])}), ${R.int(1, 9)});`;
      emit(c.size === 0 ? `try { ${st} } catch (e) { console.log('caught', e.message); }` : st);
    }],
    // a throwing right-hand side
    [1, () => {
      const c = coll();
      const fn = fresh('boom');
      emit(`function ${fn}(n) { if (n > 0) throw new Error('boom ' + n); return n; }`);
      const f = field(c, 'num');
      const ix = R.chance(0.5) ? badIndex(c) : someIndex(c);
      oob = true;
      emit(`try { ${acc(c, f, ix)} ${R.pick(['=', '+=', '*='])} (${fn}(${R.int(0, 1)}), ${R.int(1, 9)}); } catch (e) { console.log('caught', e.message); }`);
    }],
    // a collection local to a function
    [1.5, () => {
      const fn = fresh('local');
      const n = R.pick([10, 64, 100]);
      const v = R.pick(['i', 'i * 0.5', "'s' + i"]);
      const tail = R.pick(['', 'console.log(ls[0]);', 'try { t += ls[ls.length].b; } catch (e) { t = -1; }', 'ls[1].a = (ls.push({ a: 0, b: 0 }), 7); t += ls[1].a;']);
      if (tail.startsWith('try')) oob = true;
      emit(`function ${fn}(m) { const ls = []; for (let i = 0; i < ${n}; i++) ls.push({ a: ${v}, b: i }); let t = 0; for (let i = 0; i < ls.length; i++) { ls[i].b += m; t += ls[i].b; } ${tail} return t; }`);
      emit(`console.log(${fn}(${R.int(0, 5)}), ${fn}(1));`);
    }],
    // reads and prints
    [4, () => {
      const c = coll();
      const ix = someIndex(c);
      emit(R.pick([
        `console.log(${acc(c, field(c), ix)});`,
        `console.log(${c.name}.length);`,
        `console.log(${acc(c, field(c), ix)}, ${acc(c, field(c), ix)});`,
        `if (${c.name}.length > 0) console.log(${acc(c, field(c), '0')});`,
        `${acc(c, field(c, 'num'), ix)} = ${R.pick(['3', '-0', '0.1 + 0.2', 'NaN', '1e300 * 10', `'${R.int(0, 9)}'`, 'null', 'true'])};`,
      ]));
    }],
    // control flow around accesses
    [2, () => {
      const c = coll();
      S = newSum();
      emit(R.pick([
        `for (let i = 0; i < ${c.name}.length; i++) { if (i === ${R.int(0, 20)}) break; ${loopBody(c, 'i')} }`,
        `for (let i = 0; i < ${c.name}.length; i++) { if (i % 3 === 0) continue; ${loopBody(c, 'i')} }`,
        `outer: for (let r = 0; r < 3; r++) { for (let i = 0; i < ${c.name}.length; i++) { if (i > 10) continue outer; ${loopBody(c, 'i')} } }`,
        `switch (${c.name}.length % 3) { case 0: ${S} += 1; break; default: for (let i = 0; i < ${c.name}.length; i++) { ${loopBody(c, 'i')} } }`,
        `function ${fresh('walk')}() { for (let i = 0; i < ${c.name}.length; i++) { ${loopBody(c, 'i')} } } `,
      ]));
      // a declared-but-uncalled function is fine; call it sometimes
      const last = out[out.length - 1];
      const m = /^function (walk\d+)/.exec(last);
      if (m && R.chance(0.7)) emit(`${m[1]}();`);
    }],
  ];

  const nStmts = R.int(2, 9);
  for (let k = 0; k < nStmts; k++) R.weighted(statements)();
  if (!sums.length) newSum();

  // Print the final state of every field, so that the layout is observable.
  for (const c of colls) {
    const parts = c.fields.map((f) => `t.push(show(${accOn(`${c.name}[i]`, f)}));`).join(' ');
    emit(`{ const t = []; for (let i = 0; i < ${c.name}.length; i += ${R.pick([1, 1, 7, 13])}) { ${parts} } console.log('${c.name}', ${c.name}.length, t.join(' ').length, t.slice(0, 12).join(' ')); }`);
  }
  emit(`console.log(${sums.join(', ')});`);
  // Sometimes end with an uncaught out-of-bounds access: the error itself must match.
  if (R.chance(0.08)) {
    const c = coll();
    oob = true;
    emit(`console.log(${acc(c, field(c), badIndex(c))});`);
  }
  return { code: out.join('\n') + '\n', oob };
}

// ---- early errors -----------------------------------------------------------------------

/**
 * Statements that are early errors anywhere at the top level of a module
 * (acorn rejects them while parsing; oxc partly in semantic analysis).
 * `name` is a collection the program declares; `n` a fresh number.
 */
const EARLY_ERRORS = [
  ({ name }) => `var ${name};`,
  ({ name }) => `let ${name} = [];`,
  () => 'let k = 0;',
  () => 'function k() {}',
  () => 'break;',
  () => 'continue;',
  () => 'return 1;',
  ({ n }) => `l${n}: l${n}: ;`,
  ({ n }) => `l${n}: { continue l${n}; }`,
  ({ name }) => `for (let i = 0; i < ${name}.length; i++) { break nope; }`,
  ({ name }) => `for (let i = 0; i < ${name}.length; i++) { (() => { continue; })(); }`,
  ({ name }) => `delete ${name};`,
  ({ n }) => `let o${n} = 0${n % 8}7;`,
  ({ n }) => `let s${n} = '\\0${n % 8}';`,
  ({ name }) => `with (${name}) {}`,
  ({ n }) => `export { undeclared${n} };`,
  ({ name }) => `export { ${name} as e, k as e };`,
  ({ n }) => `function f${n}(a, a) { return a; }`,
  ({ n }) => `const f${n} = (a, a) => a;`,
  ({ n }) => `class K${n} { constructor() {} constructor() {} }`,
  ({ n }) => `class K${n} { #p; #p; }`,
  ({ n }) => `class K${n} { m() { super(); } }`,
  ({ n }) => `class K${n} { m() { return this.#q; } }`,
  () => 'new.target;',
  ({ n }) => `const c${n};`,
  () => 'let eval = 1;',
  () => 'arguments = 1;',
  ({ n }) => `if (k) function g${n}() {}`,
  ({ n }) => `const r${n} = /(?<g>.)(?<g>.)/;`,
  ({ n }) => `const r${n} = /a{2,1}/;`,
  () => '({ __proto__: 1, __proto__: 2 });',
];

/**
 * Sometimes inserts one early error into a generated program, on a line
 * of its own after the first line. The choice uses its own random stream,
 * so the programs without one are exactly what `generate` made.
 */
export function withEarlyError(prog, seed) {
  const R = rng(seed ^ 0x6ea41e);
  if (!R.chance(0.05)) return prog;
  const lines = prog.code.trimEnd().split('\n');
  const names = [...prog.code.matchAll(/^(?:const|let) ([A-Za-z_$][\w$]*) = \[/gm)].map((m) => m[1]);
  const stmt = R.pick(EARLY_ERRORS)({ name: names.length ? R.pick(names) : 'k', n: R.int(1, 99) });
  lines.splice(R.int(1, lines.length), 0, stmt);
  return { code: lines.join('\n') + '\n', oob: prog.oob, early: stmt };
}

/** The profile for the batch starting at program b: random measured sizes for some collection names. */
function batchProfile(seed, b) {
  const R = rng(programSeed(seed, b) ^ 0x9f0f11e);
  const profile = {};
  for (const name of COLL_NAMES) {
    if (R.chance(0.6)) profile[name] = { maxLength: R.pick([0, 1, 10, 63, 64, 65, 200, 5000]) };
  }
  return profile;
}

/** Program k of campaign `seed`. */
function programAt(seed, k) {
  const s = programSeed(seed, k);
  return withEarlyError(generate(s), s);
}

// ---- running programs ------------------------------------------------------------------

/** Runs a program in a fresh VM context: its console output and uncaught error. */
function run(code) {
  const out = [];
  const fmt = (args) => args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
  const context = vm.createContext({ console: { log: (...a) => out.push(fmt(a)) } });
  let error = null;
  try {
    new vm.Script(code.replace(/^export (default )?/gm, '')).runInContext(context, { timeout: 5000 });
  } catch (e) {
    error = `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}`;
  }
  return JSON.stringify({ out, error });
}

/** What the TypeScript engine makes of a program. */
function tsOutputs(code, profile) {
  const res = {};
  if (profile) {
    try {
      res.profiled = compile(code, jsPlugin(), { profile }).explain || 'No arrays of objects found.';
    } catch {
      res.profiled = null;
    }
  }
  for (const [mode, opts] of [['check', {}], ['assume', { bounds: 'assume' }]]) {
    try {
      const r = compile(code, jsPlugin(), opts);
      res[mode] = { code: r.code, explain: r.explain || 'No arrays of objects found.' };
      if (mode === 'check') res.frames = explain(r.plan, { frames: r.analysis.module.source }) || 'No arrays of objects found.';
    } catch (e) {
      res[mode] = { error: `${e?.constructor?.name}: ${e?.message}` };
    }
  }
  return res;
}

/** Splits multi-file explain output into one text per file. */
function splitSections(text, files) {
  const res = new Map();
  let at = 0;
  const starts = [];
  for (const f of files) {
    const h = `== ${f} ==\n`;
    const i = text.indexOf(h, at);
    if (i < 0) continue;
    starts.push([f, i, i + h.length]);
    at = i + h.length;
  }
  starts.forEach(([f, , body], k) => {
    const end = k + 1 < starts.length ? starts[k + 1][1] - 1 : text.length; // drop the blank separator line
    res.set(f, text.slice(body, end).replace(/\n$/, ''));
  });
  return res;
}

/** What the Rust engine makes of a batch of program files (one CLI call per mode). */
function rustOutputs(bin, dir, files, profile) {
  const res = new Map(files.map((f) => [f, {}]));
  const call = (args) => spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 30 });
  const errorsOf = (stderr) => {
    const m = new Map();
    for (const line of stderr.split('\n')) {
      for (const f of files) if (line.startsWith(`viscosity: ${f}: `)) m.set(f, line.slice(`viscosity: ${f}: `.length));
    }
    if (!m.size && stderr.trim()) for (const f of files) m.set(f, `the CLI failed: ${stderr.trim().split('\n').slice(-3).join(' | ')}`);
    return m;
  };
  for (const [mode, extra] of [['check', []], ['assume', ['--bounds', 'assume']]]) {
    const outDir = join(dir, `rust-${mode}`);
    const b = call(['build', '-o', outDir + '/', ...extra, ...files]);
    const errs = errorsOf(b.stderr ?? '');
    const e = call(['explain', ...extra, ...files]);
    const sections = splitSections(e.stdout ?? '', files);
    for (const f of files) {
      const r = res.get(f);
      if (errs.has(f)) { r[mode] = { error: errs.get(f) }; continue; }
      const p = join(outDir, f.split('/').pop());
      r[mode] = { code: existsSync(p) ? readFileSync(p, 'utf8') : null, explain: sections.get(f) ?? null };
    }
  }
  const fr = call(['explain', '--frames', ...files]);
  const sections = splitSections(fr.stdout ?? '', files);
  for (const f of files) res.get(f).frames = sections.get(f) ?? null;
  if (profile) {
    const path = join(dir, 'profile.json');
    writeFileSync(path, JSON.stringify(profile));
    const pr = splitSections(call(['explain', '--profile', path, ...files]).stdout ?? '', files);
    for (const f of files) res.get(f).profiled = pr.get(f) ?? null;
  }
  return res;
}

/** Every way a program fails. `rust` is the Rust engine's outputs, or null. */
function failuresOf(prog, rust, info = {}) {
  const fails = [];
  const t = tsOutputs(prog.code, prog.profile);
  if (prog.early) {
    // Both engines must reject it, in both bounds modes.
    if (!t.check.error) fails.push({ kind: 'early-accepted-ts', detail: prog.early });
    if (rust && (!rust.check?.error || !rust.assume?.error)) fails.push({ kind: 'early-accepted-rust', detail: prog.early });
    return fails;
  }
  info.transformed = /\b__Vsc_/.test(t.check.code ?? '');
  if (t.check.error) fails.push({ kind: 'ts-crash', detail: t.check.error });
  else {
    const before = run(prog.code);
    const after = run(t.check.code);
    if (before !== after) fails.push({ kind: 'behaviour-check', detail: `original ${before}\ncompiled ${after}` });
    if (!prog.oob && !t.assume.error) {
      const assumed = run(t.assume.code);
      if (before !== assumed) fails.push({ kind: 'behaviour-assume', detail: `original ${before}\ncompiled ${assumed}` });
    }
  }
  if (rust) {
    for (const mode of ['check', 'assume']) {
      const [a, b] = [t[mode], rust[mode] ?? {}];
      if (a.error || b.error) {
        if (!a.error !== !b.error) fails.push({ kind: `parity-error-${mode}`, detail: `ts: ${a.error ?? 'ok'}\nrust: ${b.error ?? 'ok'}` });
        continue;
      }
      if (a.code !== b.code) fails.push({ kind: `parity-code-${mode}`, detail: firstDiff(a.code, b.code) });
      if (a.explain !== b.explain) fails.push({ kind: `parity-explain-${mode}`, detail: firstDiff(a.explain, b.explain) });
    }
    if (!t.check.error && !rust.check?.error && t.frames !== rust.frames) fails.push({ kind: 'parity-frames', detail: firstDiff(t.frames, rust.frames) });
    if (prog.profile && !t.check.error && !rust.check?.error && t.profiled !== rust.profiled) {
      fails.push({ kind: 'parity-profile', detail: `profile ${JSON.stringify(prog.profile)}\n${firstDiff(t.profiled, rust.profiled)}` });
    }
  }
  return fails;
}

function firstDiff(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return `ts: ${JSON.stringify(a)?.slice(0, 200)}\nrust: ${JSON.stringify(b)?.slice(0, 200)}`;
  const la = a.split('\n');
  const lb = b.split('\n');
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return `line ${i + 1}:\n  ts:   ${la[i]}\n  rust: ${lb[i]}`;
  }
  return 'texts differ';
}

// ---- reducing a failing program ----------------------------------------------------------

function parses(code) {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    return true;
  } catch {
    return false;
  }
}

/** Line-based delta debugging: drop chunks of lines while the failure stays. */
function reduce(prog, kind, bin, dir) {
  const stillFails = (lines) => {
    const code = lines.join('\n') + '\n';
    if (!prog.early && !parses(code)) return false;
    const p = { code, oob: prog.oob, early: prog.early, profile: prog.profile };
    let rust = null;
    if (kind.startsWith('parity') && bin) {
      const f = join(dir, 'reduce.js');
      writeFileSync(f, code);
      rust = rustOutputs(bin, dir, [f], prog.profile).get(f);
    }
    return failuresOf(p, rust).some((x) => x.kind === kind);
  };
  let lines = prog.code.trimEnd().split('\n');
  for (let chunk = Math.max(1, lines.length >> 1); chunk >= 1; chunk = chunk === 1 ? 0 : Math.max(1, chunk >> 1)) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i + chunk <= lines.length; ) {
        const cand = [...lines.slice(0, i), ...lines.slice(i + chunk)];
        if (cand.length && stillFails(cand)) { lines = cand; changed = true; } else i += chunk;
      }
    }
  }
  return lines.join('\n') + '\n';
}

// ---- main --------------------------------------------------------------------------------

function main() {
  const o = parseArgs(process.argv.slice(2));
  const indices = o.only !== null ? [o.only] : [...Array(o.count).keys()];
  if (o.print) {
    for (const k of indices) {
      const p = programAt(o.seed, k);
      process.stdout.write(`// ---- program ${k} (seed ${o.seed}) ${p.oob ? '(may go out of bounds) ' : ''}${p.early ? '(an early error)' : ''}\n${p.code}`);
    }
    return 0;
  }
  let bin = null;
  if (!o.noRust) {
    const debug = join(rustRoot, 'target', 'debug', 'viscosity');
    const release = join(rustRoot, 'target', 'release', 'viscosity');
    bin = o.rust || (existsSync(debug) ? debug : release);
    if (!existsSync(bin)) throw new Error(`no viscosity binary at ${bin}: run \`cargo build -p viscosity-cli\` or pass --rust or --no-rust`);
  }
  const work = mkdtempSync(join(tmpdir(), 'vsc-fuzz-'));
  const keep = o.keep || join(work, 'failures');
  mkdirSync(keep, { recursive: true });
  const t0 = Date.now();
  const stats = { programs: 0, oob: 0, early: 0, transformed: 0, failing: 0, kinds: {} };
  const failing = [];
  for (let b = 0; b < indices.length && failing.length < o.maxFail; b += o.batch) {
    const profile = batchProfile(o.seed, b);
    const batch = indices.slice(b, b + o.batch).map((k) => ({ k, ...programAt(o.seed, k), profile }));
    const dir = join(work, `batch${b}`);
    mkdirSync(dir, { recursive: true });
    const files = batch.map((p) => join(dir, `p${p.k}.js`));
    batch.forEach((p, i) => writeFileSync(files[i], p.code));
    const rust = bin ? rustOutputs(bin, dir, files, profile) : null;
    batch.forEach((p, i) => {
      if (failing.length >= o.maxFail) return;
      stats.programs++;
      if (p.oob) stats.oob++;
      if (p.early) stats.early++;
      const info = {};
      const fails = failuresOf(p, rust ? rust.get(files[i]) : null, info);
      if (info.transformed) stats.transformed++;
      if (!fails.length) return;
      stats.failing++;
      for (const f of fails) stats.kinds[f.kind] = (stats.kinds[f.kind] ?? 0) + 1;
      const name = join(keep, `seed${o.seed}-p${p.k}.js`);
      writeFileSync(name, p.code);
      let reduced = '';
      if (o.reduce) {
        reduced = reduce(p, fails[0].kind, bin, dir);
        writeFileSync(name.replace(/\.js$/, '.min.js'), reduced);
      }
      failing.push({ k: p.k, fails, name });
      if (!o.quiet) {
        console.log(`FAIL program ${p.k} (--seed ${o.seed} --only ${p.k}): ${fails.map((f) => f.kind).join(', ')}\n  ${name}`);
        for (const f of fails) console.log(`  [${f.kind}] ${f.detail.split('\n').join('\n    ')}`.slice(0, 2000));
        if (reduced) console.log(`  reduced:\n${reduced.replace(/^/gm, '    ')}`);
      }
    });
    rmSync(dir, { recursive: true, force: true });
    if (!o.quiet && indices.length > o.batch) process.stderr.write(`  ${Math.min(b + o.batch, indices.length)}/${indices.length} programs, ${stats.failing} failing\n`);
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`fuzz: seed ${o.seed}, ${stats.programs} programs (${stats.transformed} transformed, ${stats.oob} may go out of bounds, ${stats.early} with an early error), ${stats.failing} failing, ${secs} s${bin ? '' : ' (TS only)'}`);
  if (stats.failing) console.log(`  by kind: ${JSON.stringify(stats.kinds)}\n  programs kept in ${keep}`);
  if (!stats.failing) rmSync(work, { recursive: true, force: true });
  return stats.failing ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
