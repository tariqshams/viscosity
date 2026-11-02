// Chapter 93-b (staged split of 191): a small call graph with a chain
// (main → step → move → clamp), a cycle (even ⇄ odd) and a call through a
// value whose target is unknown.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const N: Record<string, [number, number]> = {
  main: [60, 30], step: [60, 100], move: [20, 180], clamp: [110, 180],
  even: [220, 60], odd: [330, 60], run: [240, 150], unknown: [340, 200],
};

function Node({ id, tint, dash }: { id: string; tint?: string; dash?: boolean }) {
  const [x, y] = N[id];
  return (
    <Box x={x - 30} y={y - 14} w={60} h={28} dash={dash} fill={tint ? tok(tint, 0.12) : tok('panel')} stroke={tint ? tok(tint) : tok('line')}>
      <T x={x} y={y} size={12} mono weight={700} anchor="middle">{id === 'unknown' ? '?' : id}</T>
    </Box>
  );
}

export default function CallGraphPic() {
  const e = (a: string, b: string, opts: { color?: string; bend?: number; dash?: boolean } = {}) => {
    const [x1, y1] = N[a];
    const [x2, y2] = N[b];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const k = 18 / len;
    return <Arrow x1={x1 + dx * k} y1={y1 + dy * k} x2={x2 - dx * k * 1.2} y2={y2 - dy * k * 1.2} color={opts.color} bend={opts.bend} dash={opts.dash} />;
  };
  return (
    <Svg w={400} h={240} title="A call graph: main calls step; step calls move and clamp; move calls clamp. even and odd call each other. run calls an unknown function through its parameter g.">
      {e('main', 'step')}
      {e('step', 'move')}
      {e('step', 'clamp')}
      {e('move', 'clamp')}
      {e('even', 'odd', { color: tok('danger'), bend: 0.4 })}
      {e('odd', 'even', { color: tok('danger'), bend: 0.4 })}
      {e('run', 'unknown', { dash: true, color: tok('accent') })}
      {Object.keys(N).map((id) => (
        <Node key={id} id={id} tint={id === 'even' || id === 'odd' ? 'danger' : id === 'unknown' ? 'accent' : undefined} dash={id === 'unknown'} />
      ))}
      <T x={275} y={100} size={11} anchor="middle" fill={tok('danger')}>a cycle: recursion</T>
      <T x={240} y={186} size={11} anchor="middle" fill={tok('accent')}>g(x): any function</T>
      <T x={66} y={226} size={11} anchor="middle" fill={tok('muted')}>leaves: clamp</T>
    </Svg>
  );
}
