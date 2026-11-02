import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Field representations as a ladder: a field only ever moves up, to a
// representation general enough for every value it has held. Smi and
// Double come from the V8 blog post on the React performance cliff;
// "heap object" and "tagged" are the h and t of V8's trace output, as seen
// in this repo's --trace-generalization run.
const R = [
  { id: 'smi', label: 'Smi', sub: 'small integers, in the slot', x: 18, y: 184, c: 'safe' },
  { id: 'double', label: 'Double', sub: 'any number, own box', x: 18, y: 102, c: 'safe' },
  { id: 'heap', label: 'heap object', sub: 'undefined, null, objects', x: 214, y: 102, c: 'warn' },
  { id: 'tagged', label: 'Tagged', sub: 'anything: numbers boxed', x: 116, y: 20, c: 'danger' },
];

export default function RepLadder() {
  const at = (id: string) => R.find((r) => r.id === id)!;
  const W = 168;
  const H = 52;
  const top = (id: string) => ({ x: at(id).x + W / 2, y: at(id).y });
  const bot = (id: string) => ({ x: at(id).x + W / 2, y: at(id).y + H });
  const edge = (a: string, b: string) => {
    const p = top(a);
    const q = bot(b);
    return <Arrow x1={p.x} y1={p.y - 2} x2={q.x} y2={q.y + 3} width={1.8} />;
  };
  return (
    <Svg w={400} h={270} title="A ladder of field representations. Smi widens to Double; Double widens to Tagged; heap object widens to Tagged. Higher means more general and slower for numbers.">
      {R.map((r) => (
        <Box key={r.id} x={r.x} y={r.y} w={W} h={H} r={7} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
          <T x={r.x + 12} y={r.y + 18} size={14} mono weight={700}>{r.label}</T>
          <T x={r.x + 12} y={r.y + 38} size={11} fill={tok('muted')}>{r.sub}</T>
        </Box>
      ))}
      {edge('smi', 'double')}
      {edge('double', 'tagged')}
      {edge('heap', 'tagged')}
      <T x={226} y={196} size={11} fill={tok('muted')}>a field only moves up,</T>
      <T x={226} y={212} size={11} fill={tok('muted')}>never back down</T>
      <T x={18} y={258} size={11} fill={tok('muted')}>more general ↑ (and, for numbers, slower)</T>
    </Svg>
  );
}
