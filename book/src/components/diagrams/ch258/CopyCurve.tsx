import { Svg, T, tok } from '../../viz/svg';

// Total values copied by grows while pushing n elements, starting from
// capacity 16 (as Viscosity's container does), for two growth policies:
// doubling the capacity, and adding 16 slots. Computed here with the same
// loop as the chapter's runnable example; the dashed line is 2n, the bound
// that doubling never crosses.
const N = 400;

function totals(next: (cap: number) => number): number[] {
  const out: number[] = [];
  let cap = 16;
  let c = 0;
  for (let len = 0; len <= N; len++) {
    if (len === cap) {
      c += len;
      cap = next(cap);
    }
    out.push(c);
  }
  return out;
}

const DBL = totals((c) => c * 2);
const ADD = totals((c) => c + 16);
const MAXY = ADD[N];

const X0 = 46;
const Y0 = 196;
const W = 330;
const H = 176;
const px = (n: number) => X0 + (n / N) * W;
const py = (v: number) => Y0 - (Math.min(v, MAXY) / MAXY) * H;
const path = (vals: number[]) => vals.map((v, n) => `${n === 0 ? 'M' : 'L'}${px(n).toFixed(1)},${py(v).toFixed(1)}`).join(' ');

export default function CopyCurve() {
  return (
    <Svg w={400} h={232} title="Copies made while pushing up to 400 elements: adding 16 slots curves up steeply, doubling stays a low staircase under the line 2n">
      <line x1={X0} y1={Y0} x2={X0 + W} y2={Y0} stroke={tok('ink', 0.5)} />
      <line x1={X0} y1={Y0} x2={X0} y2={Y0 - H} stroke={tok('ink', 0.5)} />
      {[0, 2000, 4000].map((v) => (
        <T key={v} x={X0 - 6} y={py(v)} size={11} anchor="end" fill={tok('muted')}>{v}</T>
      ))}
      {[0, 100, 200, 300, 400].map((n) => (
        <T key={n} x={px(n)} y={Y0 + 14} size={11} anchor="middle" fill={tok('muted')}>{n}</T>
      ))}
      <T x={X0 + W / 2} y={Y0 + 30} size={11} anchor="middle" fill={tok('muted')}>elements pushed (n)</T>
      <T x={X0 + 4} y={14} size={11} fill={tok('muted')}>values copied in all</T>
      <path d={`M${px(0)},${py(0)} L${px(N)},${py(2 * N)}`} stroke={tok('ink', 0.4)} strokeDasharray="4 4" fill="none" />
      <path d={path(ADD)} stroke={tok('danger')} strokeWidth={2.2} fill="none" />
      <path d={path(DBL)} stroke={tok('safe')} strokeWidth={2.2} fill="none" />
      <T x={px(250)} y={py(ADD[250]) - 12} size={12} weight={700} fill={tok('danger')}>add 16: {ADD[N]} at 400</T>
      <T x={px(400) - 2} y={py(2 * N) - 14} size={11} anchor="end" fill={tok('muted')}>2n</T>
      <T x={px(400) - 2} y={py(DBL[N]) + 14} size={12} weight={700} anchor="end" fill={tok('safe')}>doubling: {DBL[N]} at 400</T>
    </Svg>
  );
}
