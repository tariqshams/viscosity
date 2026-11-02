import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

// Chapter 288: one program through the Rust engine, stage by stage. Every
// listing is real output, trimmed and wrapped to fit a phone:
//  - VIR: viscosity_vir::print_func on JsPlugin.lower(source), from a small
//    program of the author's (not in the repo) that calls the crates;
//  - analysis and plan: fields of viscosity_core::analyze and plan;
//  - code and explain: `viscosity build` and `viscosity explain --frames`
//    (the release CLI), which the TypeScript CLI matches byte for byte;
//  - output: node on the original and on the compiled program.
const SRC = `const ps = [];
for (let i = 0; i < 1000; i++) {
  ps.push({ x: i, vx: 1, hp: 3 });
}
for (let t = 0; t < 10; t++) {
  for (const p of ps) p.x += p.vx;
}
const qs = [];
for (let i = 0; i < 100; i++) {
  qs.push({ x: i, vx: 1, hp: 3 });
}
let s = 0;
for (const p of ps) s += p.x;
console.log(s, qs[0]);`;

const VIR = `func <module>():
  ...
  b9:  ; preds b6 b11
    %20 = phi %19, %29
    %21 = field.get %18 .length
    %22 = binop < %20, %21
    condbr %22, b10, b12
  b10:  ; preds b9
    %23 = index.get %18, %20
    %24 = field.get %23 .x
    %25 = field.get %23 .vx
    %26 = binop + %24, %25
    field.set %23, %26 .x
    br b11
  b11:  ; preds b10
    %28 = const 1
    %29 = binop + %20, %28
    br b9`;

const ANALYSIS = `ps  line 1, fields x, vx, hp
    numeric: x, vx, hp
    size estimate 1000
    loop line 6, depth 2:
      reads x, vx; writes x
    loop line 13, depth 1: reads x
    index gets proven in bounds: 2/2
    bailouts: none
qs  line 8, fields x, vx, hp
    size estimate 100
    bailouts:
      line 14: an element is passed
      to a method call`;

const PLAN = `ps  Layout::Soa
  loop at line 6 in <module>()
    touches 2 of 3 fields (x, vx)
  loop at line 13 in <module>()
    touches 1 of 3 fields (x)
  typed Float64Array columns for
    all 3 fields
  about 1000 elements
  2 of 2 element accesses proven
    in bounds
qs  Layout::Aos
  unsafe: line 14: an element is
    passed to a method call`;

const CODE = `class __Vsc_ps {
  constructor(cap = 16) { ...
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
    this.hp = new Float64Array(cap); }
  push(v0, v1, v2) { ... }
  grow() { ... }
}
const ps = new __Vsc_ps();
for (let i = 0; i < 1000; i++) {
  ps.push(i, 1, 3);
}
for (let t = 0; t < 10; t++) {
  for (let p = 0; p < ps.length; p++)
    ps.x[p] += ps.vx[p];
}
const qs = [];   // unchanged`;

const FRAMES = `ps (line 1) {x, vx, hp} → struct
  of arrays
  · loop at line 6 in <module>()
    touches 2 of 3 fields (x, vx)
  · ...
qs (line 8) {x, vx, hp} → kept as
  array of objects
  · unsafe: line 14: an element is
    passed to a method call
    14 | console.log(s, qs[0]);
       |                ^^^^^`;

const RUN = `$ node w.js
509500 { x: 0, vx: 1, hp: 3 }
$ viscosity build w.js > out.js
$ node out.js
509500 { x: 0, vx: 1, hp: 3 }`;

type S = { title: string; code: string; line: number | null; note: string };
const STATES: S[] = [
  { title: 'source', code: SRC, line: 5, note: 'The program: a thousand particles moved ten times, a hundred more that are only printed, and a sum. Line 6 is the hot loop.' },
  { title: 'front-end → VIR', code: VIR, line: 11, note: 'oxc parses it (chapter 260) and the JavaScript plugin lowers the tree to VIR in SSA form (173, 176). Line 6’s for…of is now blocks b9 to b11: a phi for the hidden index, a length check, one index.get, two field reads and a field.set.' },
  { title: 'analyses', code: ANALYSIS, line: 11, note: 'The analyses read only VIR: collection discovery (178), shapes and numeric fields (179), escapes (180), access patterns and loop depth (181), sizes and bounds proofs. qs[0] leaves the program’s sight in a call, so qs gets a bailout.' },
  { title: 'plan', code: PLAN, line: 0, note: 'The cost model (182) decides: ps becomes a struct of arrays, with every reason recorded as it decides. qs stays as objects, and the plan keeps the bailout as its reason.' },
  { title: 'emit', code: CODE, line: 14, note: 'The plugin rewrites the source from the plan (174, 183): a container class with three Float64Array columns, push(i, 1, 3) instead of an object, and the hot loop as two column reads and a write. qs is spliced through untouched.' },
  { title: 'explain --frames', code: FRAMES, line: 9, note: 'explain prints the plan’s reasons (185). With --frames, each refusal gets the source line and carets under the element it is about. The TypeScript CLI prints the same bytes.' },
  { title: 'run both', code: RUN, line: 4, note: 'And the promise underneath it all: the compiled program prints exactly what the original prints. The differential tests (chapter 276) check that for every test program, and the fuzzer for thousands more.' },
];

export default function WholeMachineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title={`One program, in Rust: ${st.title}`} steps={s} note={st.note}>
      <div className="text-[0.78rem] leading-snug">
        <CodeTrace code={st.code} line={st.line} />
      </div>
    </StepFrame>
  );
}
