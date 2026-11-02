import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The generated SoA container for ps {x, vx} (engine/ts emit.ts,
// containerClass): it starts with room for 16, and push() doubles every
// typed column when it is full. Values are those of
//   for (let i = 0; i < N; i++) ps.push(i, 1);
const CODE = `push(v0, v1) {
  const n = this.length;
  if (n === this.cap) this.grow();
  this.x[n] = v0; this.vx[n] = v1;
  return (this.length = n + 1);
}
grow() {
  const cap = (this.cap *= 2); let t;
  t = new Float64Array(cap);
  t.set(this.x); this.x = t;
  t = new Float64Array(cap);
  t.set(this.vx); this.vx = t;
}`;

type S = { line: number | null; len: number; cap: number; xCap: number; vxCap: number; ret: string; hi: 'x' | 'vx' | null; note: string };
const STATES: S[] = [
  { line: null, len: 0, cap: 16, xCap: 16, vxCap: 16, ret: '', hi: null, note: 'const ps = new __Vsc_ps() makes an empty container: length 0, room for 16 (cap), and one Float64Array of 16 zeros per numeric field.' },
  { line: 3, len: 1, cap: 16, xCap: 16, vxCap: 16, ret: '1', hi: null, note: 'ps.push(0, 1): n is 0, there is room, so v0 goes into x[0] and v1 into vx[0]. Like Array’s push, it returns the new length, 1.' },
  { line: 4, len: 16, cap: 16, xCap: 16, vxCap: 16, ret: '16', hi: null, note: 'Fifteen pushes later, length is 16 and every slot is used. The next push will find n === cap.' },
  { line: 9, len: 16, cap: 32, xCap: 32, vxCap: 16, ret: '', hi: 'x', note: 'push(16, 1) calls grow(). cap doubles to 32. A new 32-slot Float64Array is made, t.set copies the 16 old values of x into it, and it replaces the old one.' },
  { line: 11, len: 16, cap: 32, xCap: 32, vxCap: 32, ret: '', hi: 'vx', note: 'The same for vx. Every typed column grows together, so all of them always have cap slots. (A plain-array column isn’t touched: it grows by itself.)' },
  { line: 4, len: 17, cap: 32, xCap: 32, vxCap: 32, ret: '17', hi: null, note: 'Back in push, the new values go into slot 16, and push returns 17. The next 15 pushes are plain writes; the 33rd grows to 64.' },
];

const CELL = 10.5;
const X0 = 40;

function Column({ y, name, color, cap, len, vals, hi }: { y: number; name: string; color: string; cap: number; len: number; vals: (k: number) => number; hi: boolean }) {
  return (
    <g>
      <T x={X0 - 8} y={y + 9} size={12} mono weight={700} anchor="end" fill={tok(color)}>{name}</T>
      {Array.from({ length: cap }, (_, k) => (
        <rect key={k} x={X0 + k * CELL} y={y} width={CELL - 1.5} height={18} rx={1.5}
          fill={k < len ? tok(color, 0.3) : 'transparent'}
          stroke={hi ? tok('brand') : tok('line')} strokeWidth={1} />
      ))}
      {Array.from({ length: Math.min(len, cap) }, (_, k) => (k % 4 === 0 || k === len - 1) && (
        <T key={k} x={X0 + k * CELL + 5} y={y + 30} size={11} mono anchor="middle" fill={tok('muted')}>{vals(k)}</T>
      ))}
      <T x={X0 + cap * CELL + 4} y={y + 9} size={11} fill={tok('muted')}>{cap}</T>
    </g>
  );
}

export default function GrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A container growing" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The x and vx Float64Array columns, their used slots, and the container's length and cap">
        <Box x={6} y={6} w={96} h={28}>
          <T x={16} y={20} size={12} mono>length <tspan fontWeight={700}>{st.len}</tspan></T>
        </Box>
        <Box x={110} y={6} w={84} h={28} stroke={st.hi ? tok('brand') : tok('line')}>
          <T x={120} y={20} size={12} mono>cap <tspan fontWeight={700}>{st.cap}</tspan></T>
        </Box>
        {st.ret && <T x={392} y={20} size={12} mono anchor="end" fill={tok('safe')}>push returned {st.ret}</T>}
        <Column y={52} name="x" color="f1" cap={st.xCap} len={st.len} vals={(k) => k} hi={st.hi === 'x'} />
        <Column y={100} name="vx" color="f3" cap={st.vxCap} len={st.len} vals={() => 1} hi={st.hi === 'vx'} />
      </Svg>
    </StepFrame>
  );
}
