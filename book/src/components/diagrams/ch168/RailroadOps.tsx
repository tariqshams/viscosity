// The three operators of regular expressions as railway tracks: a train
// (the input) may take any route from the left end to the right end, and
// the letters it passes are the string it spells.
import { Box, Svg, T, tok } from '../../viz/svg';

const ink = tok('ink', 0.6);

function Stop({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <Box x={x - 16} y={y - 14} w={32} h={28} r={14} fill={tok('brand', 0.12)} stroke={tok('brand')}>
      <T x={x} y={y + 1} size={14} mono anchor="middle" weight={700}>{c}</T>
    </Box>
  );
}

function P({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={ink} strokeWidth={2} />;
}

export default function RailroadOps() {
  return (
    <Svg w={400} h={310} title="Railway pictures of concatenation ab, alternation a|b and star a*">
      <T x={8} y={16} size={12} weight={700} fill={tok('muted')}>CONCATENATION  ab</T>
      <P d="M20,50 H124 M156,50 H224 M256,50 H310" />
      <Stop x={140} y={50} c="a" />
      <Stop x={240} y={50} c="b" />
      <T x={318} y={50} size={11} fill={tok('muted')}>“ab”</T>

      <T x={8} y={98} size={12} weight={700} fill={tok('muted')}>ALTERNATION  a|b</T>
      <P d="M20,150 H80 Q100,150 100,135 Q100,122 120,122 H164 M196,122 H240 Q260,122 260,135 Q260,150 280,150 H310" />
      <P d="M80,150 Q100,150 100,165 Q100,178 120,178 H164 M196,178 H240 Q260,178 260,165 Q260,150 280,150" />
      <Stop x={180} y={122} c="a" />
      <Stop x={180} y={178} c="b" />
      <T x={318} y={150} size={11} fill={tok('muted')}>“a” or “b”</T>

      <T x={8} y={212} size={12} weight={700} fill={tok('muted')}>STAR  a*</T>
      <P d="M20,240 H310" />
      <P d="M80,240 Q100,240 100,256 Q100,272 120,272 H164 M196,272 H240 Q260,272 260,256 Q260,240 280,240" />
      <path d="M150,267 L140,272 L150,277" fill="none" stroke={ink} strokeWidth={2} />
      <path d="M206,235 L216,240 L206,245" fill="none" stroke={ink} strokeWidth={2} />
      <Stop x={180} y={272} c="a" />
      <T x={180} y={302} size={11} anchor="middle" fill={tok('muted')}>top: skip it; loop below: go round again</T>
      <T x={318} y={240} size={11} fill={tok('muted')}>“”, “a”,</T>
      <T x={318} y={254} size={11} fill={tok('muted')}>“aa”, …</T>
    </Svg>
  );
}
