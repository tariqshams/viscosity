import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// #[derive(Clone, PartialEq, Debug)] on V2, and the three impls it
// stands for, written out by hand (simplified). Static.

const IMPLS: { title: string; lines: string[] }[] = [
  { title: 'Clone', lines: ['fn clone(&self) -> V2 {', '  V2 { x: self.x.clone(),', '       y: self.y.clone() } }'] },
  { title: 'PartialEq', lines: ['fn eq(&self, o: &V2) -> bool {', '  self.x == o.x && self.y == o.y }'] },
  { title: 'Debug', lines: ['fn fmt(&self, f) -> fmt::Result {', '  f.debug_struct("V2")', '   .field("x", &self.x)', '   .field("y", &self.y).finish() }'] },
];

export default function DeriveExpand() {
  let y = 92;
  return (
    <Svg w={400} h={330} title="A derive attribute and the impls it writes, one line per field">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>YOU WRITE</T>
      <Box x={8} y={20} w={384} h={52} r={4} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={16} y={36} size={12} mono>#[derive(Clone, PartialEq, Debug)]</T>
        <T x={16} y={56} size={12} mono>struct V2 {'{'} x: f64, y: f64 {'}'}</T>
      </Box>
      <Arrow x1={200} y1={74} x2={200} y2={90} />
      {IMPLS.map((im) => {
        const h = 22 + im.lines.length * 15;
        const top = y;
        y += h + 8;
        return (
          <g key={im.title}>
            <Box x={8} y={top} w={384} h={h} r={4}>
              <T x={16} y={top + 12} size={11} weight={700} fill={tok('accent')}>impl {im.title} for V2</T>
              {im.lines.map((l, i) => (
                <T key={i} x={22} y={top + 28 + i * 15} size={11} mono>{l}</T>
              ))}
            </Box>
          </g>
        );
      })}
      <T x={200} y={322} size={11} anchor="middle" fill={tok('muted')}>each method uses the same trait on every field</T>
    </Svg>
  );
}
