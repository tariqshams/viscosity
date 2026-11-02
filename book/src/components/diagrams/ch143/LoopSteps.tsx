// Chapter 143: finding natural loops in the CFG of sum() (a loop nest), as
// cfg.ts's naturalLoops does: find each back edge t → h where h dominates
// t, then walk predecessors backwards from t until reaching h.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const POS: Record<string, [number, number]> = {
  b0: [170, 22], b1: [170, 72], b2: [170, 122], b5: [170, 172], b6: [170, 222], b7: [170, 272],
  b4: [56, 122], b3: [330, 122], b8: [330, 222],
};
const W = 56;
const H = 26;

type E = { f: string; t: string; bend?: number; back?: boolean };
const EDGES: E[] = [
  { f: 'b0', t: 'b1' }, { f: 'b1', t: 'b2' }, { f: 'b1', t: 'b4' }, { f: 'b2', t: 'b5' },
  { f: 'b5', t: 'b6' }, { f: 'b5', t: 'b8' }, { f: 'b6', t: 'b7' }, { f: 'b7', t: 'b5', bend: -1.3, back: true },
  { f: 'b8', t: 'b3' }, { f: 'b3', t: 'b1', back: true },
];

const LABEL: Record<string, string> = {
  b1: 'i < g.length', b5: 'k < 3', b6: 's += g[i].x', b3: 'i++', b7: 'k++', b4: 'return s',
};

type S = { hot?: string; inner: string[]; outer: string[]; stack?: string[]; note: string };

const STATES: S[] = [
  { inner: [], outer: [], note: 'The CFG of sum(g) from the real IR: an i loop around a k loop. There is no “for” in a CFG, only blocks and edges. Where are the loops?' },
  { hot: 'b7>b5', inner: [], outer: [], note: 'Check each edge t → h: does h dominate t? For b7 → b5, yes: every path from b0 to b7 passes through b5. So this is a back edge, and b5 is a loop header.' },
  { hot: 'b7>b5', inner: ['b5', 'b7'], outer: [], stack: ['b6'], note: 'Grow the loop backwards. Start the body as {b5}, then add the back edge’s source b7, and push its predecessor b6.' },
  { hot: 'b7>b5', inner: ['b5', 'b7', 'b6'], outer: [], stack: [], note: 'Add b6. Its predecessor is b5, already in the body, so the walk stops there. The header fences the loop in. Inner loop: {b5, b6, b7}.' },
  { hot: 'b3>b1', inner: ['b5', 'b7', 'b6'], outer: ['b1', 'b3'], stack: ['b8'], note: 'The second back edge: b3 → b1, since b1 dominates b3. Start {b1}, add b3, push its predecessor b8.' },
  { hot: 'b3>b1', inner: ['b5', 'b7', 'b6'], outer: ['b1', 'b3', 'b8', 'b5', 'b7', 'b6', 'b2'], stack: [], note: 'Keep walking: b8, then b5, whose predecessors are b2 and b7, then b6, b2. Everything stops at b1. Outer loop: seven blocks, including the whole inner loop.' },
  { inner: ['b5', 'b7', 'b6'], outer: ['b1', 'b3', 'b8', 'b5', 'b7', 'b6', 'b2'], note: 'No other edge is a back edge: b5 → b8 leaves the inner loop, b1 → b4 leaves both. The inner loop’s header lies inside one other loop, so its depth is 2. The access g[i] in b6 belongs to the innermost loop around it.' },
];

function edgePts(e: E) {
  const [x1, y1] = POS[e.f];
  const [x2, y2] = POS[e.t];
  if (e.f === 'b7') return { x1: x1 - W / 2, y1, x2: x2 - W / 2, y2: y2 + 4 };
  if (e.f === 'b3') return { x1: x1 - 4, y1: y1 - H / 2, x2: x2 + W / 2, y2 };
  if (y1 === y2) return { x1: x1 + (x2 > x1 ? W / 2 : -W / 2), y1, x2: x2 + (x2 > x1 ? -W / 2 : W / 2), y2 };
  const down = y2 > y1;
  const dx = x2 - x1;
  return {
    x1: x1 + (dx === 0 ? 0 : Math.sign(dx) * 14), y1: y1 + (down ? H / 2 : -H / 2),
    x2: x2 - (dx === 0 ? 0 : Math.sign(dx) * 14), y2: y2 + (down ? -H / 2 : H / 2),
  };
}

export default function LoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Back edges grow natural loops" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The control-flow graph of sum, with its two natural loops highlighted">
        {EDGES.map((e) => {
          const p = edgePts(e);
          const hot = st.hot === `${e.f}>${e.t}`;
          return <Arrow key={e.f + e.t} {...p} bend={e.bend ?? 0} width={hot ? 3 : 1.6} dash={e.back && !hot}
            color={hot ? tok('danger') : tok('ink', 0.55)} />;
        })}
        {Object.entries(POS).map(([b, [x, y]]) => {
          const inI = st.inner.includes(b);
          const inO = st.outer.includes(b);
          return (
            <g key={b}>
              <Box x={x - W / 2} y={y - H / 2} w={W} h={H} r={5}
                fill={inI ? tok('accent', 0.22) : inO ? tok('brand', 0.16) : tok('panel')}
                stroke={inO ? tok('brand') : inI ? tok('accent') : tok('line')}>
                <T x={x} y={y} size={13} mono weight={700} anchor="middle">{b}</T>
              </Box>
              {LABEL[b] && (
                <T x={b === 'b4' ? x : b === 'b1' ? x - W / 2 - 6 : x + W / 2 + 6} y={b === 'b4' ? y + 24 : y} size={10.5} mono
                  anchor={b === 'b4' ? 'middle' : b === 'b1' ? 'end' : 'start'} fill={tok('muted')}>{LABEL[b]}</T>
              )}
            </g>
          );
        })}
        {st.stack && <T x={250} y={286} size={12} mono fill={tok('muted')}>to visit: [{st.stack.join(', ')}]</T>}
        <T x={8} y={286} size={11} fill={tok('muted')}>dashed = back edge</T>
      </Svg>
    </StepFrame>
  );
}
