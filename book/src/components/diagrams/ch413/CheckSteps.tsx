import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// Chapter 413: what three changes to drip-rs are worth. All measured for
// this chapter on the book's shared 4-vCPU cloud VM, 2026-11-02, rustc
// 1.97, release builds (lto, codegen-units = 1) of scratch copies of
// book/companion/rust (the companion code itself is unchanged; every
// variant passed the 334-program corpus and the 165 stress-GC programs):
//   committed  drip-rs as it is
//   no chunk   no chunk register: read_byte and read_constant reach the
//              chunk through frame, closure and function in the heap
//   unchecked  forbid(unsafe_code) removed, read_byte uses get_unchecked
//   fast int   format_number prints whole numbers below 2^53 with
//              (n as i64).to_string(), before its general path
// Instructions: valgrind 3.22 callgrind, total Ir. Times: wall clock,
// 15 fresh processes per variant, the variants alternating.
type V = { key: string; label: string; ir: number; ms: number[]; col: string };

const FIB: V[] = [
  { key: 'walk', label: 'no chunk', ir: 11_011_220_718, col: 'danger',
    ms: [860, 871, 892, 870, 1034, 850, 881, 854, 842, 931, 995, 893, 889, 1006, 896] },
  { key: 'base', label: 'committed', ir: 5_551_649_854, col: 'brand',
    ms: [402, 439, 398, 423, 423, 481, 428, 409, 414, 439, 499, 443, 427, 403, 572] },
  { key: 'u1', label: 'unchecked', ir: 5_107_553_155, col: 'warn',
    ms: [409, 476, 434, 451, 463, 491, 410, 463, 406, 432, 492, 436, 415, 493, 439] },
];

const STR: V[] = [
  { key: 'base', label: 'committed', ir: 3_573_697_000, col: 'brand',
    ms: [402, 308, 403, 372, 437, 376, 423, 398, 338, 363, 326, 332, 335, 345, 313] },
  { key: 'fast', label: 'fast int', ir: 1_989_310_781, col: 'safe',
    ms: [182, 202, 221, 184, 183, 180, 178, 180, 187, 178, 182, 188, 188, 176, 179] },
];

type S = { prog: 'fib' | 'strings'; show: string[]; view: 'ir' | 'ms'; note: string };
const STATES: S[] = [
  { prog: 'fib', show: ['base'], view: 'ir', note: 'The committed drip-rs runs fib.drip in 5.55 billion instructions, every index checked and no unsafe code anywhere.' },
  { prog: 'fib', show: ['walk', 'base'], view: 'ir', note: 'Take away the chunk register, so every byte and constant is reached through the frame, the closure and the function in the heap: 11.01 billion, almost twice as many.' },
  { prog: 'fib', show: ['walk', 'base', 'u1'], view: 'ir', note: 'Now go the other way: delete the forbid and read each byte with get_unchecked. 5.11 billion, 8.0% fewer than committed.' },
  { prog: 'fib', show: ['walk', 'base', 'u1'], view: 'ms', note: 'Now wall time, 15 runs each, as dots. Without the register fib is clearly slower, about 2.1 times. The unchecked build’s dots sit among the committed build’s: its 8% fewer instructions bought no measurable time.' },
  { prog: 'strings', show: ['base', 'fast'], view: 'ir', note: 'strings.drip, where the profile pointed at format_number. A fast path for whole numbers cuts the instructions from 3.57 to 1.99 billion, 44% fewer.' },
  { prog: 'strings', show: ['base', 'fast'], view: 'ms', note: 'And this time the time follows: every fast-path run is faster than every committed run, best 176 ms against 308, about 1.75 times. A change found by profiling, in safe code.' },
];

export default function CheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const all = st.prog === 'fib' ? FIB : STR;
  const L = 84;
  const W = 400 - L - 100;
  const maxIr = st.prog === 'fib' ? FIB[0].ir : STR[0].ir;
  const msMax = st.prog === 'fib' ? 1100 : 480;
  const base = all.find((v) => v.key === 'base')!;
  return (
    <StepFrame title="What a change is worth, measured" steps={s} note={st.note}>
      <Svg w={400} h={170} title="Instructions or wall times for builds of drip-rs on fib.drip and strings.drip">
        <T x={4} y={12} size={12} weight={700} fill={tok('brand')}>
          {st.prog}.drip: {st.view === 'ir' ? 'instructions (callgrind), billions' : 'ms per run, 15 runs each'}
        </T>
        {all.map((v, k) => {
          const y = 30 + k * 40;
          if (!st.show.includes(v.key)) return null;
          if (st.view === 'ir') {
            const w = (v.ir / maxIr) * W;
            const d = v.key === 'base' ? '' : ` (${v.ir > base.ir ? '+' : ''}${(((v.ir - base.ir) / base.ir) * 100).toFixed(1)}%)`;
            return (
              <g key={v.key}>
                <T x={L - 6} y={y + 12} size={11} mono anchor="end">{v.label}</T>
                <rect x={L} y={y} width={w} height={24} rx={3} fill={tok(v.col, 0.3)} stroke={tok(v.col)} strokeWidth={1.2} />
                <T x={L + w + 4} y={y + 12} size={11} mono>{`${(v.ir / 1e9).toFixed(2)}${d}`}</T>
              </g>
            );
          }
          const x = (ms: number) => L + (ms / msMax) * W;
          const lo = Math.min(...v.ms);
          const hi = Math.max(...v.ms);
          return (
            <g key={v.key}>
              <T x={L - 6} y={y + 12} size={11} mono anchor="end">{v.label}</T>
              <line x1={x(lo)} x2={x(hi)} y1={y + 12} y2={y + 12} stroke={tok(v.col, 0.6)} strokeWidth={2} />
              {v.ms.map((m, j) => <circle key={j} cx={x(m)} cy={y + 12 + ((j % 3) - 1) * 5} r={2.8} fill={tok(v.col, 0.75)} />)}
              <T x={x(hi) + 6} y={y + 12} size={11} mono>{`${lo}–${hi}`}</T>
            </g>
          );
        })}
        {st.view === 'ms' && (
          <g>
            <rect x={L + (Math.min(...base.ms) / msMax) * W} y={24} width={((Math.max(...base.ms) - Math.min(...base.ms)) / msMax) * W} height={124} fill={tok('brand', 0.08)} />
            <T x={L} y={162} size={11} fill={tok('muted')}>shaded: the committed build’s range</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
