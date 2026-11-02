// The finished LR(0) automaton for the small expression grammar, drawn as
// a DFA: numbered states, arrows labelled with grammar symbols, and a double
// ring on each state that holds a complete item (a place to reduce).
import { Svg, T, tok } from '../../viz/svg';

const R = 16;
const P: Record<number, [number, number]> = {
  0: [36, 120], 1: [125, 40], 5: [235, 40], 7: [350, 40],
  2: [125, 120], 3: [300, 120], 4: [125, 205], 6: [235, 205], 8: [350, 205],
};
const DONE = [1, 2, 3, 7, 8];
// [from, label, to, bend, label x, label y]
const E: [number, string, number, number, number, number][] = [
  [0, 'E', 1, 0, 70, 72], [0, 'T', 2, 0, 84, 130], [0, '(', 4, 0, 68, 170], [0, 'n', 3, -0.45, 168, 84],
  [1, '+', 5, 0, 180, 30], [5, 'T', 7, 0, 292, 30], [5, 'n', 3, 0, 279, 72], [5, '(', 4, 0, 192, 132],
  [4, 'E', 6, 0, 180, 216], [4, 'T', 2, 0, 113, 162], [4, 'n', 3, 0, 207, 155], [6, ')', 8, 0, 292, 216], [6, '+', 5, -0.25, 250, 178],
];

function edge([a, label, b, bend, tx, ty]: (typeof E)[number], k: number) {
  const [x1, y1] = P[a];
  const [x2, y2] = P[b];
  const ang0 = Math.atan2(y2 - y1, x2 - x1);
  const sx = x1 + R * Math.cos(ang0 - bend);
  const sy = y1 + R * Math.sin(ang0 - bend);
  const ex = x2 - R * Math.cos(ang0 + bend);
  const ey = y2 - R * Math.sin(ang0 + bend);
  const mx = (sx + ex) / 2 + bend * (ey - sy) * -0.6;
  const my = (sy + ey) / 2 + bend * (ex - sx) * 0.6;
  const ang = Math.atan2(ey - my, ex - mx);
  const ah = 7;
  const c = tok('ink', 0.55);
  return (
    <g key={k}>
      <path d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`} fill="none" stroke={c} strokeWidth={1.4} />
      <polygon points={`${ex},${ey} ${ex - ah * Math.cos(ang - 0.45)},${ey - ah * Math.sin(ang - 0.45)} ${ex - ah * Math.cos(ang + 0.45)},${ey - ah * Math.sin(ang + 0.45)}`} fill={c} />
      <T x={tx} y={ty} size={12} mono anchor="middle" weight={700} fill={tok('accent')}>{label}</T>
    </g>
  );
}

export default function Lr0Automaton() {
  const [lx, ly] = P[4];
  return (
    <Svg w={400} h={276} title="The nine-state LR(0) automaton for S → E, E → E + T | T, T → n | ( E )">
      {E.map(edge)}
      <path d={`M${lx - 7},${ly + R - 2} C${lx - 24},${ly + 50} ${lx + 24},${ly + 50} ${lx + 7},${ly + R - 2}`} fill="none" stroke={tok('ink', 0.55)} strokeWidth={1.4} />
      <polygon points={`${lx + 7},${ly + R - 2} ${lx + 12},${ly + R + 6} ${lx + 3},${ly + R + 5}`} fill={tok('ink', 0.55)} />
      <T x={lx} y={ly + 46} size={12} mono anchor="middle" weight={700} fill={tok('accent')}>(</T>
      <line x1={4} y1={120} x2={36 - R - 1} y2={120} stroke={tok('ink', 0.7)} strokeWidth={1.6} />
      {Object.entries(P).map(([id, [x, y]]) => {
        const done = DONE.includes(Number(id));
        return (
          <g key={id}>
            <circle cx={x} cy={y} r={R} fill={id === '0' ? tok('brand', 0.15) : tok('panel')} stroke={tok('ink', 0.6)} strokeWidth={1.5} />
            {done && <circle cx={x} cy={y} r={R - 4} fill="none" stroke={tok('ink', 0.6)} strokeWidth={1.2} />}
            <T x={x} y={y + 1} size={13} mono anchor="middle">{id}</T>
          </g>
        );
      })}
      <T x={200} y={268} size={11} anchor="middle" fill={tok('muted')}>double ring: the state holds a complete item, so it can reduce</T>
    </Svg>
  );
}
