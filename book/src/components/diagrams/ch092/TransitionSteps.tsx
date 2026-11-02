import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A transition tree growing as properties are added, following the V8
// blog's "Fast properties in V8" (2017). The divergence for a different
// order matches the real %HaveSameMap run shown in chapter 92.
const CODE = `const a = {};
a.x = 1;
a.y = 2;
const b = {};
b.x = 5;
b.y = 6;
const c = {};
c.y = 2;
c.x = 1;`;

type Id = 'S0' | 'S1' | 'S2' | 'S3' | 'S4';
const NODES: Record<Id, { x: number; y: number; keys: string[]; from?: Id; add?: string }> = {
  S0: { x: 145, y: 8, keys: [] },
  S1: { x: 30, y: 82, keys: ['x'], from: 'S0', add: 'x' },
  S2: { x: 30, y: 156, keys: ['x', 'y'], from: 'S1', add: 'y' },
  S3: { x: 260, y: 82, keys: ['y'], from: 'S0', add: 'y' },
  S4: { x: 260, y: 156, keys: ['y', 'x'], from: 'S3', add: 'x' },
};
const W = 110, H = 46;
const FIELD: Record<string, string> = { x: 'f1', y: 'f2' };

type S = { line: number | null; made: Id[]; fresh?: Id; reused?: Id; objs: { n: string; at: Id }[]; note: string };

const STATES: S[] = [
  { line: 0, made: ['S0'], objs: [{ n: 'a', at: 'S0' }], note: 'An empty object starts with the root shape: no properties. Every {} made this way shares it.' },
  { line: 1, made: ['S0', 'S1'], fresh: 'S1', objs: [{ n: 'a', at: 'S1' }], note: 'Adding x needs a shape that says “x is in slot 0”. None exists, so V8 makes one, and links it from the root with a transition labelled x.' },
  { line: 2, made: ['S0', 'S1', 'S2'], fresh: 'S2', objs: [{ n: 'a', at: 'S2' }], note: 'Adding y makes another shape: x in slot 0, y in slot 1. Each shape points back to its parent, so the shapes form a tree.' },
  { line: 4, made: ['S0', 'S1', 'S2'], reused: 'S1', objs: [{ n: 'a', at: 'S2' }, { n: 'b', at: 'S1' }], note: 'A second object adds x. The root already has a transition for x, so V8 follows it. No new shape: b now shares a’s old one.' },
  { line: 5, made: ['S0', 'S1', 'S2'], reused: 'S2', objs: [{ n: 'a', at: 'S2' }, { n: 'b', at: 'S2' }], note: 'Same again for y. a and b have the same shape, so any code that has learned where a.x lives already knows where b.x lives.' },
  { line: 7, made: ['S0', 'S1', 'S2', 'S3'], fresh: 'S3', objs: [{ n: 'a', at: 'S2' }, { n: 'b', at: 'S2' }, { n: 'c', at: 'S3' }], note: 'A third object adds y first. The root has no transition for y yet, so a new branch starts. In this shape y is in slot 0.' },
  { line: 8, made: ['S0', 'S1', 'S2', 'S3', 'S4'], fresh: 'S4', objs: [{ n: 'a', at: 'S2' }, { n: 'b', at: 'S2' }, { n: 'c', at: 'S4' }], note: 'Then x. c has the same keys as a, but a different shape, with x in slot 1. Same properties, different order, different shape: that is what %HaveSameMap(a, c) reported as false.' },
];

export default function TransitionSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const center = (id: Id) => ({ cx: NODES[id].x + W / 2, cy: NODES[id].y + H / 2 });
  // stack object chips per shape
  const chips: Record<string, string[]> = {};
  for (const o of st.objs) (chips[o.at] ??= []).push(o.n);
  return (
    <StepFrame title="A transition tree grows" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={212} title="A tree of shapes. The root is the empty shape. One branch adds x then y; another adds y then x. Objects a, b and c point at the shape they currently have.">
        {st.made.map((id) => {
          const nd = NODES[id];
          if (!nd.from || !nd.add) return null;
          const p = NODES[nd.from];
          const x1 = p.x + W / 2, y1 = p.y + H, x2 = nd.x + W / 2, y2 = nd.y;
          return (
            <g key={'e' + id}>
              <Arrow x1={x1} y1={y1} x2={x2} y2={y2 - 2} color={tok('ink', 0.45)} />
              <T x={(x1 + x2) / 2 + (x2 > x1 ? 8 : -8)} y={(y1 + y2) / 2} size={11} mono weight={700} anchor={x2 > x1 ? 'start' : 'end'} fill={tok(FIELD[nd.add])}>+{nd.add}</T>
            </g>
          );
        })}
        {st.made.map((id) => {
          const nd = NODES[id];
          const hot = st.fresh === id ? 'brand' : st.reused === id ? 'safe' : null;
          return (
            <Box key={id} x={nd.x} y={nd.y} w={W} h={H} r={6} fill={hot ? tok(hot, 0.16) : tok('panel')} stroke={hot ? tok(hot) : tok('line')}>
              <T x={nd.x + 8} y={nd.y + 13} size={10} weight={700} fill={tok('muted')}>{id}{st.fresh === id ? ' new' : st.reused === id ? ' reused' : ''}</T>
              {nd.keys.length === 0 && <T x={nd.x + 8} y={nd.y + 32} size={12} mono fill={tok('muted')}>{'{ }'}</T>}
              {nd.keys.map((k, j) => (
                <T key={k} x={nd.x + 8 + j * 48} y={nd.y + 32} size={12} mono weight={700} fill={tok(FIELD[k])}>{k}@{j}</T>
              ))}
            </Box>
          );
        })}
        {Object.entries(chips).map(([id, ns]) => {
          const { cy } = center(id as Id);
          const left = NODES[id as Id].x < 145;
          const bx = id === 'S0' ? NODES.S0.x + W + 8 : left ? NODES[id as Id].x + W + 6 : NODES[id as Id].x - 6 - ns.length * 22;
          return (
            <g key={'c' + id}>
              {ns.map((n, j) => (
                <Box key={n} x={bx + j * 22} y={cy - 10} w={20} h={20} r={10} fill={tok('accent', 0.2)} stroke={tok('accent')}>
                  <T x={bx + j * 22 + 10} y={cy} size={11} mono weight={700} anchor="middle">{n}</T>
                </Box>
              ))}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
