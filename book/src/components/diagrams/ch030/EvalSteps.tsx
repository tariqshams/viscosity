import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type N = { x: number; y: number; kind: string; extra?: string; leaf: boolean };

const NODES: N[] = [
  { x: 144, y: 8, kind: 'mul', leaf: false },
  { x: 40, y: 88, kind: 'add', leaf: false },
  { x: 250, y: 88, kind: 'num', extra: 'value: 4', leaf: true },
  { x: 4, y: 168, kind: 'num', extra: 'value: 1', leaf: true },
  { x: 132, y: 168, kind: 'num', extra: 'value: 2', leaf: true },
];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4]];
const W = 112;
const H = 46;

type S = { active: number; vals: Record<number, number>; note: string };

const STATES: S[] = [
  { active: 0, vals: {}, note: 'evaluate(tree) starts at the root. Its kind is mul, so its value is “left times right”, and neither side is known yet.' },
  { active: 1, vals: {}, note: 'To get the left side, evaluate calls itself on the left child. That child’s kind is add: it needs its own two children first.' },
  { active: 3, vals: { 3: 1 }, note: 'A num node is the base case: its value is right there in the node. evaluate returns 1 with no further calls.' },
  { active: 4, vals: { 3: 1, 4: 2 }, note: 'The add node’s right child is also a num: it returns 2.' },
  { active: 1, vals: { 3: 1, 4: 2, 1: 3 }, note: 'Both children are known, so the add node returns 1 + 2 = 3 to the mul node that asked for it.' },
  { active: 2, vals: { 3: 1, 4: 2, 1: 3, 2: 4 }, note: 'Now the mul node’s right child: a num, returning 4.' },
  { active: 0, vals: { 3: 1, 4: 2, 1: 3, 2: 4, 0: 12 }, note: 'Both sides are known: 3 × 4 = 12. Every path down the tree ended at a num node, which is why the recursion stopped.' },
];

/** Evaluating (1 + 2) * 4 by walking its tree, one call at a time. */
export default function EvalSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Evaluating a tree" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The tree for (1 + 2) * 4, with the node being evaluated highlighted and each finished node's value shown beside it">
        {EDGES.map(([a, b]) => {
          const p = NODES[a];
          const c = NODES[b];
          return <Arrow key={`${a}-${b}`} x1={p.x + W / 2} y1={p.y + H} x2={c.x + W / 2} y2={c.y - 2} width={1.5} />;
        })}
        {NODES.map((n, k) => {
          const on = st.active === k;
          const v = st.vals[k];
          return (
            <g key={k}>
              <Box x={n.x} y={n.y} w={W} h={H} r={8} fill={on ? tok('brand', 0.18) : n.leaf ? tok('panel') : tok('brand', 0.06)} stroke={on ? tok('brand') : tok('ink', 0.4)}>
                <T x={n.x + 10} y={n.y + (n.extra ? 15 : 23)} size={13} mono>
                  kind: <tspan fontWeight={700} fill={n.leaf ? tok('accent') : tok('brand')}>&apos;{n.kind}&apos;</tspan>
                </T>
                {n.extra && <T x={n.x + 10} y={n.y + 33} size={13} mono fill={tok('muted')}>{n.extra}</T>}
              </Box>
              {v !== undefined && (n.leaf
                ? <T x={n.x + W / 2} y={n.y + H + 12} size={12} mono weight={700} anchor="middle" fill={tok('safe')}>returns {v}</T>
                : <T x={n.x + W + 6} y={n.y + H / 2} size={12} mono weight={700} fill={tok('safe')}>returns {v}</T>)}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
