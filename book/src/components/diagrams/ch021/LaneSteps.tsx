import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Adding a[i] + b[i] for four elements: one number at a time (scalar), then
// four lanes at a time (SIMD). Numbers are small so the arithmetic is easy.
const A = [1, 2, 3, 4];
const B = [10, 20, 30, 40];

type Mode = 'scalar' | 'simd';
type S = { mode: Mode; done: number; ra: boolean; rb: boolean; rc: boolean; adds: number; note: string };

const STATES: S[] = [
  { mode: 'scalar', done: 0, ra: false, rb: false, rc: false, adds: 0, note: 'Two arrays of four numbers. We want c[i] = a[i] + b[i] for every i. First, the ordinary way: one number at a time.' },
  { mode: 'scalar', done: 1, ra: false, rb: false, rc: false, adds: 1, note: 'One add instruction: a[0] + b[0] = 11. The CPU loaded two numbers, added them, and stored one result.' },
  { mode: 'scalar', done: 2, ra: false, rb: false, rc: false, adds: 2, note: 'A second add for slot 1. Same work, different numbers.' },
  { mode: 'scalar', done: 4, ra: false, rb: false, rc: false, adds: 4, note: 'Four elements took four add instructions. The loop body ran four times.' },
  { mode: 'simd', done: 0, ra: true, rb: false, rc: false, adds: 0, note: 'Now the SIMD way. One vector load copies a[0..3] into one wide register. Each of its four slots is a lane.' },
  { mode: 'simd', done: 0, ra: true, rb: true, rc: false, adds: 0, note: 'A second vector load fills another register with b[0..3]. This only works in one load because the four numbers sit side by side in memory.' },
  { mode: 'simd', done: 0, ra: true, rb: true, rc: true, adds: 1, note: 'ONE add instruction adds lane 0 to lane 0, lane 1 to lane 1, and so on. Four answers from one instruction.' },
  { mode: 'simd', done: 4, ra: true, rb: true, rc: true, adds: 1, note: 'One vector store writes all four results back. Same answers as before, with a quarter of the add instructions.' },
];

const CW = 58;
const X0 = 96;

function Row({ y, label, vals, shown, color }: { y: number; label: string; vals: number[]; shown: number; color: string }) {
  return (
    <g>
      <T x={X0 - 12} y={y + 15} size={14} mono weight={700} anchor="end">{label}</T>
      {vals.map((v, k) => (
        <Box key={k} x={X0 + k * (CW + 6)} y={y} w={CW} h={30} r={4} fill={k < shown ? tok(color, 0.18) : tok('panel')} stroke={tok('ink', 0.35)}>
          <T x={X0 + k * (CW + 6) + CW / 2} y={y + 15} size={14} mono anchor="middle" opacity={k < shown ? 1 : 0.25}>{v}</T>
        </Box>
      ))}
    </g>
  );
}

function Reg({ y, vals, on, label }: { y: number; vals: number[]; on: boolean; label: string }) {
  const w = 4 * CW + 18;
  return (
    <g opacity={on ? 1 : 0.2}>
      <Box x={X0 - 3} y={y} w={w + 6} h={30} r={7} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        {vals.map((v, k) => (
          <g key={k}>
            {k > 0 && <line x1={X0 + k * (CW + 6) - 3} x2={X0 + k * (CW + 6) - 3} y1={y + 4} y2={y + 26} stroke={tok('brand', 0.6)} strokeDasharray="3 3" />}
            <T x={X0 + k * (CW + 6) + CW / 2} y={y + 15} size={14} mono anchor="middle">{v}</T>
          </g>
        ))}
      </Box>
      <T x={X0 - 12} y={y + 15} size={12} mono anchor="end" fill={tok('brand')}>{label}</T>
    </g>
  );
}

export default function LaneSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const C = A.map((a, k) => a + B[k]);
  return (
    <StepFrame title="One add, or four at once" steps={s} note={st.note}>
      <Svg w={400} h={266} title="Arrays a, b and c in memory, and in SIMD mode three wide registers with four lanes each">
        <Row y={8} label="a" vals={A} shown={4} color="f1" />
        <Row y={44} label="b" vals={B} shown={4} color="f2" />
        <Row y={80} label="c" vals={C} shown={st.done} color="safe" />
        {[0, 1, 2, 3].map((k) => (
          <T key={k} x={X0 + k * (CW + 6) + CW / 2} y={122} size={11} mono anchor="middle" fill={tok('muted')}>{st.mode === 'simd' ? `lane ${k}` : `[${k}]`}</T>
        ))}
        {st.mode === 'scalar' && (
          <T x={200} y={185} size={12} anchor="middle" fill={tok('muted')}>one number in, one number out, per instruction</T>
        )}
        {st.mode === 'simd' && (
          <g>
            <Reg y={138} vals={A} on={st.ra} label="reg 1" />
            <Reg y={174} vals={B} on={st.rb} label="reg 2" />
            <Reg y={210} vals={C} on={st.rc} label="reg 3" />
          </g>
        )}
        <T x={392} y={254} size={13} mono anchor="end" fill={tok('ink')} weight={700}>
          {st.mode === 'scalar' ? 'scalar' : 'SIMD'}: {st.adds} add{st.adds === 1 ? '' : 's'}
        </T>
      </Svg>
    </StepFrame>
  );
}
