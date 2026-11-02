import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 357-b: the Rust Reference's privacy rule, drawn on a small
// module tree shaped like drip-rs. A private item (Table's grow method)
// is visible in its own module and that module's descendants (green),
// and nowhere else (grey). A pub item (Table::new) is visible wherever
// every module on its path is.
type N = { id: string; x: number; y: number; sees: boolean };

const NODES: N[] = [
  { id: 'crate', x: 150, y: 30, sees: false },
  { id: 'vm', x: 30, y: 104, sees: false },
  { id: 'table', x: 150, y: 104, sees: true },
  { id: 'gc', x: 270, y: 104, sees: false },
  { id: 'tests', x: 150, y: 178, sees: true },
];
const EDGES: [string, string][] = [['crate', 'vm'], ['crate', 'table'], ['crate', 'gc'], ['table', 'tests']];
const W = 100;
const H = 30;
const at = (id: string) => NODES.find((n) => n.id === id)!;

export default function PrivacyMap() {
  return (
    <Svg w={400} h={252} title="Where a private method of table can be used: table and its child tests, but not vm, gc or the root">
      <T x={8} y={12} size={12} weight={700} fill={tok('muted')}>Who may call table’s private fn grow?</T>
      {EDGES.map(([a, b]) => (
        <line key={a + b} x1={at(a).x + W / 2} y1={at(a).y + H} x2={at(b).x + W / 2} y2={at(b).y} stroke={tok('line')} strokeWidth={1.5} />
      ))}
      {NODES.map((n) => (
        <Box key={n.id} x={n.x} y={n.y} w={W} h={H} r={5} fill={n.sees ? tok('safe', 0.18) : tok('panel')} stroke={n.sees ? tok('safe') : tok('line')}>
          <T x={n.x + W / 2} y={n.y + H / 2} size={12} mono anchor="middle" fill={n.sees ? undefined : tok('muted')}>{n.id}</T>
        </Box>
      ))}
      <T x={256} y={193} size={11} fill={tok('safe')}>✓ a child of table</T>
      <T x={150} y={226} size={11} fill={tok('safe')}>green: the module and its descendants</T>
      <T x={150} y={242} size={11} fill={tok('muted')}>grey: everywhere else gets E0624</T>
      <T x={8} y={226} size={11} fill={tok('muted')}>pub fn new:</T>
      <T x={8} y={242} size={11} fill={tok('muted')}>usable everywhere</T>
    </Svg>
  );
}
