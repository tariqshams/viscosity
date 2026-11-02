import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import rs from '../../../../companion/rust/results/drip-rs-bench-2026-10-31.json';

// Chapter 256: the ledger of the port. The line counts were made for this
// chapter on 2026-10-31 with a small script over companion/ts/src/vm/*.ts
// and companion/rust/src/*.rs: lines that are not blank and not comments
// (//, ///, //!, /* … */, and JSDoc lines starting with *), and for Rust,
// nothing from a module's #[cfg(test)] onwards. object.ts is paired with
// object.rs + value.rs; main.rs (the CLI) has no twin inside ts/src/vm.
// The speed-ups are read from companion/rust/results/drip-rs-bench-2026-10-31.json.
type Loc = { mod: string; ts: number | null; rs: number };
const LOC: Loc[] = [
  { mod: 'compiler', ts: 537, rs: 804 },
  { mod: 'vm', ts: 362, rs: 611 },
  { mod: 'heap / gc', ts: 144, rs: 348 },
  { mod: 'object+value', ts: 55, rs: 236 },
  { mod: 'scanner', ts: 80, rs: 209 },
  { mod: 'table', ts: 97, rs: 122 },
  { mod: 'chunk', ts: 25, rs: 85 },
  { mod: 'debug', ts: 56, rs: 84 },
  { mod: 'main (CLI)', ts: null, rs: 50 },
  { mod: 'lib / index', ts: 8, rs: 14 },
];

type Row = { program: string; rust: number | null; speedupVsTsVm: number | null };
const timed = (rs.rows as Row[]).filter((r) => r.rust !== null && r.speedupVsTsVm !== null && r.program !== 'zoo_batch');
const ratios = timed.map((r) => r.speedupVsTsVm as number);
const geo = Math.exp(ratios.reduce((a, x) => a + Math.log(x), 0) / ratios.length);

type Kind = 'forced' | 'caught' | 'missed' | 'cost' | 'speed';
const LISTS: Record<'forced' | 'caught' | 'missed', { head: string; items: string[]; col: string }> = {
  forced: {
    head: 'What ownership forced',
    col: 'accent',
    items: ['objects in arenas, Gc<T> handles', 'roots passed in to collect()', 'ip and Rc<Chunk> as registers', 'mark bits outside the objects'],
  },
  caught: {
    head: 'What the compiler caught',
    col: 'safe',
    items: ['a missing opcode arm (E0004)', 'a class handle for an instance (E0308)', 'a reference into a growing arena (E0502)', 'two &mut self at once (E0499)'],
  },
  missed: {
    head: 'What it could not catch',
    col: 'danger',
    items: ['a root you forgot to pass in', 'a handle kept after its object died', 'stress/debug: freed slot → panic', 'normal: may read the slot’s new object'],
  },
};

const STATES: { kind: Kind; note: string }[] = [
  { kind: 'forced', note: 'Four designs the TypeScript VM never needed. Each one is how drip-rs satisfies “one owner, and one &mut or many &” for a heap of objects that point at each other.' },
  { kind: 'caught', note: 'Errors the earlier chapters met at compile time. In C, the last two could have been a dangling pointer and two writers to one object, found only when something broke.' },
  { kind: 'missed', note: 'A handle is a number, so a forgotten root is a logic bug, not a type error. The 95 stress-GC programs exist to find it: a collection before every allocation, and freed slots never reused, so a stale handle panics.' },
  { kind: 'cost', note: 'Code lines, comments and Rust’s in-module tests not counted. 1,364 in TypeScript, 2,563 in Rust: 1.88× the lines, 1.53× the non-blank characters. rustfmt wraps at 90 columns; some TypeScript lines run to 152.' },
  { kind: 'speed', note: `And what it bought, on the committed run: ${Math.min(...ratios)}× to ${Math.max(...ratios)}× the TypeScript VM’s speed, geometric mean ${geo.toFixed(2)}×, on ${timed.length} programs. One run against best of three, on a shared VM.` },
];

export default function LedgerSteps() {
  const s = useSteps(STATES);
  const k = s.state.kind;
  return (
    <StepFrame title="The ledger of the port" steps={s} note={s.state.note}>
      <Svg w={400} h={240} title="What Rust forced, caught and missed in drip-rs, its line counts, and its speed-ups">
        {(k === 'forced' || k === 'caught' || k === 'missed') && (() => {
          const l = LISTS[k];
          return (
            <g>
              <T x={10} y={18} size={13} weight={700} fill={tok(l.col)}>{l.head}</T>
              {l.items.map((it, j) => (
                <g key={j}>
                  <rect x={10} y={38 + j * 46} width={380} height={36} rx={4} fill={tok(l.col, 0.12)} stroke={tok(l.col, 0.7)} />
                  <T x={22} y={56 + j * 46} size={12} mono>{it}</T>
                </g>
              ))}
            </g>
          );
        })()}
        {k === 'cost' && (() => {
          const L = 92;
          const W = 400 - L - 64;
          const x = (n: number) => (n / 804) * W;
          return (
            <g>
              <rect x={L} y={4} width={10} height={10} rx={2} fill={tok('accent')} />
              <T x={L + 14} y={9} size={10}>TypeScript</T>
              <rect x={L + 90} y={4} width={10} height={10} rx={2} fill={tok('brand')} />
              <T x={L + 104} y={9} size={10}>Rust</T>
              {LOC.map((m, j) => {
                const y = 24 + j * 21;
                return (
                  <g key={m.mod}>
                    <T x={L - 6} y={y + 8} size={10} mono anchor="end">{m.mod}</T>
                    {m.ts !== null && <rect x={L} y={y} width={x(m.ts)} height={7} rx={1.5} fill={tok('accent')} />}
                    <rect x={L} y={y + 8} width={x(m.rs)} height={7} rx={1.5} fill={tok('brand')} />
                    <T x={L + x(m.rs) + 4} y={y + 8} size={9} mono fill={tok('muted')}>{`${m.ts ?? '—'} / ${m.rs}`}</T>
                  </g>
                );
              })}
            </g>
          );
        })()}
        {k === 'speed' && (() => {
          const L = 104;
          const W = 400 - L - 50;
          const x = (v: number) => L + (v / 6) * W;
          const rows = [...timed].sort((a, b) => (b.speedupVsTsVm as number) - (a.speedupVsTsVm as number));
          return (
            <g>
              <T x={10} y={12} size={11} weight={700} fill={tok('brand')}>drip-rs speed-up over the TypeScript VM</T>
              {rows.map((r, j) => {
                const y = 26 + j * 22;
                const v = r.speedupVsTsVm as number;
                return (
                  <g key={r.program}>
                    <T x={L - 6} y={y + 8} size={10} mono anchor="end">{r.program}</T>
                    <rect x={L} y={y + 1} width={x(v) - L} height={14} rx={2} fill={tok('brand', 0.7)} />
                    <T x={x(v) + 4} y={y + 8} size={9} mono>{`${v}×`}</T>
                  </g>
                );
              })}
              <line x1={x(geo)} x2={x(geo)} y1={22} y2={26 + rows.length * 22} stroke={tok('ink', 0.7)} strokeDasharray="3 3" />
              <T x={x(geo)} y={34 + rows.length * 22} size={9} anchor="middle" fill={tok('muted')}>{`geometric mean ${geo.toFixed(2)}×`}</T>
            </g>
          );
        })()}
      </Svg>
    </StepFrame>
  );
}
