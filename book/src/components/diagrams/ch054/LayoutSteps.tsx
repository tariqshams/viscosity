import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The same particles in four layouts, as 8-byte slots. Bright cells are the
// ones update-xy (x += vx, y += vy) actually needs; faded cells ride along
// in the same cache lines anyway. One cache line = 64 bytes = 8 slots.
// The last step shows a hot/cold split.
const F = ['x', 'y', 'vx', 'vy', 'm', 'h'];
const COL: Record<string, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', m: 'f5', h: 'f6', H: 'muted' };
const HOT = new Set(['x', 'y', 'vx', 'vy']);
const CW = 15;
const X0 = 20;

type Kind = 'aos' | 'packed' | 'soa' | 'hotcold';
type S = { kind: Kind; title: string; note: string };

const STATES: S[] = [
  { kind: 'aos', title: 'Array of objects', note: 'AoS with real objects: the array holds pointers, and each object sits somewhere on the heap with a 3-word header before its six fields. The loop hops from pointer to object, and the header, mass and health share its cache lines.' },
  { kind: 'packed', title: 'Packed AoS (one Float64Array)', note: 'Packed AoS: the same record order, but raw doubles, with no headers and no pointers. Each 64-byte cache line still carries mass and health, which this loop never reads: a third of every line is wasted.' },
  { kind: 'soa', title: 'Struct of arrays', note: 'SoA: one Float64Array per field. The loop streams through four columns, and every byte it loads is a byte it uses. The mass and health columns are never touched at all.' },
  { kind: 'hotcold', title: 'Hot/cold split', note: 'A hot/cold split: only the four fields the loop uses every frame become columns. The cold fields stay together in ordinary objects, one per particle, at the same index, out of the hot loop’s way.' },
];

function Cell({ x, y, f, w = CW, hotOnly = true }: { x: number; y: number; f: string; w?: number; hotOnly?: boolean }) {
  const hot = f !== 'H' && (!hotOnly || HOT.has(f));
  return <rect x={x} y={y} width={w - 2} height={20} rx={2} fill={tok(COL[f], hot ? 0.9 : 0.2)} />;
}

function Lines({ y, n }: { y: number; n: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, k) => (
        <g key={k}>
          <path d={`M${X0 + k * 8 * CW},${y} v5 h${8 * CW - 3} v-5`} fill="none" stroke={tok('ink', 0.4)} strokeWidth={1} />
          <T x={X0 + k * 8 * CW + 4 * CW} y={y + 14} size={10} mono anchor="middle" fill={tok('muted')}>64 B line</T>
        </g>
      ))}
    </g>
  );
}

export default function LayoutSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  let body;
  if (st.kind === 'aos') {
    const objs = [{ x: 220, y: 34 }, { x: 96, y: 84 }, { x: 170, y: 134 }];
    body = (
      <g>
        <T x={X0} y={12} size={12} mono fill={tok('muted')}>array of pointers → objects on the heap</T>
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <Box x={X0} y={33 + k * 50} w={30} h={22} r={3} fill={tok('ink', 0.08)} stroke={tok('ink', 0.4)}>
              <circle cx={X0 + 15} cy={44 + k * 50} r={3} fill={tok('ink', 0.8)} />
            </Box>
            <T x={X0 + 36} y={44 + k * 50} size={10} mono fill={tok('muted')}>[{k}]</T>
            <Arrow x1={X0 + 52} y1={44 + k * 50} x2={objs[k].x - 3} y2={objs[k].y + 10} width={1.5} />
          </g>
        ))}
        {objs.map((o, k) => (
          <g key={k}>
            {['H', 'H', 'H', ...F].map((f, j) => <Cell key={j} x={o.x + j * CW} y={o.y} f={f} />)}
          </g>
        ))}
        <T x={X0} y={180} size={10} fill={tok('muted')}>grey = object header; bright = fields this loop uses</T>
      </g>
    );
  } else if (st.kind === 'packed') {
    body = (
      <g>
        <T x={X0} y={14} size={12} mono fill={tok('muted')}>one Float64Array, stride 6</T>
        {Array.from({ length: 24 }, (_, i) => <Cell key={i} x={X0 + i * CW} y={30} f={F[i % 6]} />)}
        <Lines y={54} n={3} />
      </g>
    );
  } else if (st.kind === 'soa') {
    body = (
      <g>
        {F.map((f, r) => (
          <g key={f}>
            <T x={X0 - 4} y={20 + r * 30} size={11} mono anchor="end" fill={tok(COL[f])} weight={700}>{f}</T>
            {Array.from({ length: 16 }, (_, i) => <Cell key={i} x={X0 + 6 + i * CW} y={10 + r * 30} f={f} />)}
            <T x={X0 + 16 * CW + 14} y={20 + r * 30} size={10} fill={tok('muted')}>{HOT.has(f) ? 'streamed' : 'never loaded'}</T>
          </g>
        ))}
      </g>
    );
  } else {
    body = (
      <g>
        {['x', 'y', 'vx', 'vy'].map((f, r) => (
          <g key={f}>
            <T x={X0 + 10} y={20 + r * 26} size={11} mono anchor="end" fill={tok(COL[f])} weight={700}>{f}</T>
            {Array.from({ length: 14 }, (_, i) => <Cell key={i} x={X0 + 16 + i * CW} y={10 + r * 26} f={f} />)}
          </g>
        ))}
        <T x={X0 + 16 + 14 * CW + 10} y={50} size={10} fill={tok('muted')}>hot: columns</T>
        <T x={X0} y={124} size={11} mono fill={tok('muted')}>cold[i]: ordinary objects</T>
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            {['H', 'H', 'H', 'm', 'h'].map((f, j) => <Cell key={j} x={X0 + k * 90 + j * CW} y={138} f={f} hotOnly={false} />)}
          </g>
        ))}
        <T x={X0} y={176} size={10} fill={tok('muted')}>mass and health stay in objects, read rarely</T>
      </g>
    );
  }
  return (
    <StepFrame title="Three layouts, one loop, and a split" steps={s} note={st.note}>
      <div className="mb-1 font-sans text-sm font-semibold">{st.title}</div>
      <Svg w={400} h={190} title={`${st.title}. Bright cells are the fields x, y, vx, vy that the update loop uses; faded cells are loaded but unused.`}>
        {body}
      </Svg>
    </StepFrame>
  );
}
