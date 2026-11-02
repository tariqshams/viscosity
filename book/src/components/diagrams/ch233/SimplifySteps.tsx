// Chapter 233: simplify and select on sumsq's interference graph with four
// registers, r1 to r4. Simplify removes a node with fewer than four
// remaining neighbours and pushes it; select pops and colours.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const POS: Record<string, [number, number]> = {
  n: [200, 118], s0: [62, 36], i0: [62, 118], s1: [200, 28], i1: [338, 118],
  t: [290, 48], s2: [290, 198], i2: [110, 198],
};
const EDGES = 'i0-n i0-s0 i0-s1 i1-n i1-s1 i1-s2 i1-t i2-n i2-s1 i2-s2 n-s0 n-s1 n-s2 n-t s1-t'.split(' ').map((e) => e.split('-'));
const ORDER = ['s0', 'i0', 't', 's1', 'n', 'i1', 's2', 'i2'];
const COLOUR: Record<string, number> = { i2: 0, s2: 1, i1: 0, n: 2, s1: 1, t: 3, i0: 0, s0: 1 };
const FILL = ['f1', 'f2', 'f3', 'f4'];

function degrees(removed: number) {
  const gone = new Set(ORDER.slice(0, removed));
  const d: Record<string, number> = {};
  for (const v of Object.keys(POS)) d[v] = 0;
  for (const [a, b] of EDGES) if (!gone.has(a) && !gone.has(b)) { d[a]++; d[b]++; }
  return d;
}

type S = { removed: number; coloured: number; note: string };
const STATES: S[] = [
  { removed: 0, coloured: 0, note: 'sumsq’s graph and k = 4 registers, r1 to r4. The number by each node is its degree: how many neighbours it still has. Simplify looks for a node with fewer than 4.' },
  { removed: 1, coloured: 0, note: 's0 has degree 2. However its neighbours are coloured later, they use at most 2 registers, so s0 is sure to find one free. Remove it and push it on the stack. Its neighbours’ degrees drop.' },
  { removed: 2, coloured: 0, note: 'i0 now has degree 2 (n and s1): push it.' },
  { removed: 3, coloured: 0, note: 't has degree 3: push it. Removing it lowers n, s1 and i1.' },
  { removed: 4, coloured: 0, note: 's1 is down to 3 (n, i1, i2): push it. Every removal makes the rest easier.' },
  { removed: 5, coloured: 0, note: 'Even n, which started with 7 neighbours, now has only 3 left: push it.' },
  { removed: 8, coloured: 0, note: 'i1, s2 and i2 go the same way. The graph is empty, and the stack holds all eight values, s0 at the bottom, i2 at the top.' },
  { removed: 8, coloured: 3, note: 'Select: pop in reverse. i2 has no coloured neighbours: r1. s2 neighbours i2, so r2. i1 neighbours s2 only so far: r1.' },
  { removed: 8, coloured: 6, note: 'n neighbours i2, s2 and i1 (r1, r2, r1), so it takes r3. s1 neighbours i1 and n and i2: r2. t neighbours n, s1 and i1: r4, the last one.' },
  { removed: 8, coloured: 8, note: 'i0 neighbours n and s1: r1. s0 neighbours n and i0: r2. Done, four registers, and no edge joins two of the same. By luck, s0, s1 and s2 all got r2, and i0, i1 and i2 all got r1, so all four mv instructions copy a register to itself.' },
];

export default function SimplifySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const gone = new Set(ORDER.slice(0, st.removed));
  const popped = [...ORDER].reverse().slice(0, st.coloured);
  const deg = degrees(st.removed);
  const stack = ORDER.slice(0, st.removed).filter((v) => !popped.includes(v));
  return (
    <StepFrame title="Simplify, then select" steps={s} note={st.note}>
      <Svg w={400} h={280} title="The interference graph shrinking as nodes are pushed on a stack, then coloured as they are popped.">
        {EDGES.map(([a, b]) => {
          const [x1, y1] = POS[a]; const [x2, y2] = POS[b];
          const live = !gone.has(a) && !gone.has(b);
          const both = popped.includes(a) && popped.includes(b);
          return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('ink', live || both ? 0.55 : 0.12)} strokeWidth={1.5} strokeDasharray={live || both ? undefined : '3 4'} />;
        })}
        {Object.entries(POS).map(([v, [x, y]]) => {
          const isC = popped.includes(v);
          const out = gone.has(v) && !isC;
          return (
            <g key={v} opacity={out ? 0.35 : 1}>
              <circle cx={x} cy={y} r={17} fill={isC ? tok(FILL[COLOUR[v]], 0.35) : tok('panel')} stroke={isC ? tok(FILL[COLOUR[v]]) : tok('ink', 0.6)} strokeWidth={isC ? 2.5 : 1.5} />
              <T x={x} y={y + 1} size={12.5} mono anchor="middle" weight={700}>{v}</T>
              {!gone.has(v) && <T x={x + 20} y={y - 14} size={11} mono fill={deg[v] < 4 ? tok('safe') : tok('muted')} weight={700}>{deg[v]}</T>}
              {isC && <T x={x + 20} y={y - 14} size={11.5} mono weight={700}>{`r${COLOUR[v] + 1}`}</T>}
            </g>
          );
        })}
        <T x={8} y={244} size={11} weight={700} fill={tok('muted')}>STACK (top at right)</T>
        <T x={8} y={264} size={12.5} mono>{stack.join(' ') || '(empty)'}</T>
      </Svg>
    </StepFrame>
  );
}
