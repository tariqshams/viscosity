import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// Chapter 331: what each change to drip-rs's hot reads is worth on fib.
// All numbers measured for this chapter on the book's shared 4-vCPU cloud
// VM, 2026-10-31, rustc 1.97, release builds (lto, codegen-units = 1) of
// scratch copies of book/companion/rust (deleted afterwards; every
// variant passed the 246-program corpus and the 95 stress-GC programs):
//   committed  — drip-rs as it is
//   heap walk  — no registers: every byte read goes frame → closure →
//                function → chunk through the heap
//   unsafe ×1  — forbid removed, read_byte uses get_unchecked
//   unsafe ×4  — also read_constant, peek and GetLocal/SetLocal
// Instructions: valgrind 3.22 callgrind, total Ir for fib.drip.
// Times: fib.drip wall clock, 14 fresh processes per variant, the four
// variants alternating, in two rounds of 7.
type V = { key: string; label: string; ir: number; ms: number[]; col: string };

const VARIANTS: V[] = [
  { key: 'walk', label: 'heap walk (safe)', ir: 39_267_264_607, col: 'danger',
    ms: [2911, 3015, 3101, 3277, 2926, 3026, 2977, 3008, 3067, 3049, 3057, 3389, 3000, 3363] },
  { key: 'base', label: 'committed (safe)', ir: 20_186_274_402, col: 'brand',
    ms: [1341, 1428, 1331, 1677, 1593, 1440, 1468, 1389, 1359, 1376, 1385, 1379, 1567, 1399] },
  { key: 'u1', label: 'unsafe ×1', ir: 18_932_124_861, col: 'warn',
    ms: [1401, 1266, 1423, 1424, 1278, 1551, 1411, 1388, 1268, 1448, 1460, 1531, 1342, 1571] },
  { key: 'u4', label: 'unsafe ×4', ir: 18_588_726_709, col: 'warn',
    ms: [1488, 1246, 1786, 1542, 1419, 1260, 1773, 1317, 1328, 1548, 1773, 1400, 1496, 1575] },
];

type S = { show: string[]; view: 'ir' | 'ms'; note: string };
const STATES: S[] = [
  { show: ['base'], view: 'ir', note: 'The committed drip-rs runs fib in 20.19 billion instructions, all its indexing checked, no unsafe anywhere.' },
  { show: ['walk', 'base'], view: 'ir', note: 'Take away the registers and read every byte through the heap, also in safe code: 39.27 billion. Half the work was the walk to the byte, with its three arena checks.' },
  { show: ['walk', 'base', 'u1'], view: 'ir', note: 'Now go the other way: delete the forbid and read the byte with get_unchecked. 18.93 billion, 6.2% fewer than committed.' },
  { show: ['walk', 'base', 'u1', 'u4'], view: 'ir', note: 'Unchecked constants, peek and locals too: 18.59 billion, 7.9% fewer. Every other check in the loop is still there.' },
  { show: ['walk', 'base', 'u1', 'u4'], view: 'ms', note: 'Now wall time, 14 runs each, as dots. The heap walk is clearly slower. The unsafe builds’ dots sit among the committed build’s dots: on this VM, their gain is inside the noise.' },
];

export default function CheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rows = VARIANTS.filter((v) => st.show.includes(v.key));
  const L = 116;
  const W = 400 - L - 96;
  const maxIr = VARIANTS[0].ir;
  const msMax = 3400;
  const base = VARIANTS[1];
  return (
    <StepFrame title="What a check costs on fib" steps={s} note={st.note}>
      <Svg w={400} h={190} title="Instructions or wall times for fib under four builds of drip-rs">
        <T x={8} y={14} size={11} weight={700} fill={tok('brand')}>
          {st.view === 'ir' ? 'instructions (callgrind), billions' : 'wall time per run (ms), 14 runs each'}
        </T>
        {VARIANTS.map((v, k) => {
          const y = 32 + k * 36;
          const on = rows.includes(v);
          if (!on) return null;
          if (st.view === 'ir') {
            const w = (v.ir / maxIr) * W;
            const d = v.key === 'base' ? '' : ` (${v.ir > base.ir ? '+' : ''}${(((v.ir - base.ir) / base.ir) * 100).toFixed(1)}%)`;
            return (
              <g key={v.key}>
                <T x={L - 6} y={y + 11} size={10} mono anchor="end">{v.label}</T>
                <rect x={L} y={y} width={w} height={22} rx={3} fill={tok(v.col, 0.3)} stroke={tok(v.col)} strokeWidth={1.2} />
                <T x={L + w + 4} y={y + 11} size={10} mono>{`${(v.ir / 1e9).toFixed(2)}${d}`}</T>
              </g>
            );
          }
          const x = (ms: number) => L + (ms / msMax) * W;
          const lo = Math.min(...v.ms);
          const hi = Math.max(...v.ms);
          return (
            <g key={v.key}>
              <T x={L - 6} y={y + 11} size={10} mono anchor="end">{v.label}</T>
              <line x1={x(lo)} x2={x(hi)} y1={y + 11} y2={y + 11} stroke={tok(v.col, 0.6)} strokeWidth={2} />
              {v.ms.map((m, j) => <circle key={j} cx={x(m)} cy={y + 11 + ((j % 3) - 1) * 4} r={2.6} fill={tok(v.col, 0.75)} />)}
              <T x={x(hi) + 6} y={y + 11} size={10} mono>{`${lo}–${hi}`}</T>
            </g>
          );
        })}
        {st.view === 'ms' && (
          <g>
            <rect x={L + (Math.min(...base.ms) / msMax) * W} y={24} width={((Math.max(...base.ms) - Math.min(...base.ms)) / msMax) * W} height={150} fill={tok('brand', 0.08)} />
            <T x={L} y={184} size={10} fill={tok('muted')}>shaded: the committed build’s range</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
