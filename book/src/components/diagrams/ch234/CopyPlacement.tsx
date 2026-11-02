// Chapter 234: sumsq after SSA destruction. Each phi in b1 becomes one copy
// at the end of each predecessor (b0 and b2), just before its jump.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Block({ x, y, w, name, lines, copies }: { x: number; y: number; w: number; name: string; lines: string[]; copies: string[] }) {
  const h = 22 + (lines.length + copies.length) * 16;
  return (
    <Box x={x} y={y} w={w} h={h}>
      <T x={x + 6} y={y + 11} size={11} weight={700} fill={tok('muted')}>{name}</T>
      {lines.map((l, k) => <T key={k} x={x + 8} y={y + 28 + k * 16} size={12} mono>{l}</T>)}
      {copies.map((l, k) => (
        <g key={'c' + k}>
          <rect x={x + 3} y={y + 20 + (lines.length + k) * 16} width={w - 6} height={16} fill={tok('safe', 0.16)} />
          <T x={x + 8} y={y + 28 + (lines.length + k) * 16} size={12} mono fill={tok('safe')} weight={700}>{l}</T>
        </g>
      ))}
    </Box>
  );
}

export default function CopyPlacement() {
  return (
    <Svg w={400} h={330} title="sumsq after leaving SSA: the phis of b1 are gone, and copies sit at the ends of b0 and b2.">
      <Block x={20} y={6} w={170} name="b0" lines={['s0 = 0', 'i0 = 0']} copies={['s1 = s0', 'i1 = i0']} />
      <Block x={20} y={118} w={170} name="b1 (phis removed)" lines={['if i1 >= n: b4']} copies={[]} />
      <Block x={20} y={196} w={170} name="b2" lines={['t  = i1 * i1', 's2 = s1 + t', 'i2 = i1 + 1']} copies={['s1 = s2', 'i1 = i2']} />
      <Block x={236} y={196} w={140} name="b4" lines={['return s1']} copies={[]} />
      <Arrow x1={105} y1={92} x2={105} y2={116} />
      <Arrow x1={105} y1={156} x2={105} y2={194} />
      <Arrow x1={190} y1={140} x2={300} y2={194} />
      <Arrow x1={190} y1={300} x2={192} y2={134} bend={0.9} color={tok('accent')} />
      <T x={230} y={60} size={11.5} fill={tok('muted')}>was, in b1:</T>
      <T x={230} y={78} size={12} mono>s1 = φ(s0, s2)</T>
      <T x={230} y={95} size={12} mono>i1 = φ(i0, i2)</T>
      <T x={258} y={320} size={11.5} fill={tok('accent')}>back edge b2 → b1</T>
    </Svg>
  );
}
