// Chapter 94: the three answers an alias analysis can give, as arrows.
// Must: on every run p and q reach one object. May: on some runs they do,
// on others they don't. No: on no run do they share an object.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Name({ x, y, n }: { x: number; y: number; n: string }) {
  return (
    <Box x={x} y={y} w={30} h={24}>
      <T x={x + 15} y={y + 12} size={13} mono weight={700} anchor="middle">{n}</T>
    </Box>
  );
}

function Obj({ x, y, n, c }: { x: number; y: number; n: string; c: string }) {
  return (
    <Box x={x} y={y} w={36} h={26} r={8} fill={tok(c, 0.12)} stroke={tok(c)}>
      <T x={x + 18} y={y + 13} size={12} mono anchor="middle">{n}</T>
    </Box>
  );
}

export default function MayMustNo() {
  const col = [8, 140, 272];
  return (
    <Svg w={400} h={200} title="Three panels. Must: p and q both point at o1. May: p points at o1, q points at o1 on some runs and o2 on others. No: p points at o1 and q at o2, always.">
      {['MUST', 'MAY', 'NO'].map((h, k) => (
        <T key={h} x={col[k] + 60} y={14} size={12} weight={700} anchor="middle" fill={tok(k === 1 ? 'warn' : k === 0 ? 'safe' : 'brand')}>{h}</T>
      ))}
      {/* must */}
      <Name x={col[0]} y={40} n="p" />
      <Name x={col[0]} y={110} n="q" />
      <Obj x={col[0] + 80} y={74} n="o1" c="safe" />
      <Arrow x1={col[0] + 30} y1={52} x2={col[0] + 80} y2={84} color={tok('safe')} />
      <Arrow x1={col[0] + 30} y1={122} x2={col[0] + 80} y2={92} color={tok('safe')} />
      {/* may */}
      <Name x={col[1]} y={40} n="p" />
      <Name x={col[1]} y={110} n="q" />
      <Obj x={col[1] + 80} y={40} n="o1" c="warn" />
      <Obj x={col[1] + 80} y={110} n="o2" c="warn" />
      <Arrow x1={col[1] + 30} y1={52} x2={col[1] + 80} y2={53} color={tok('warn')} />
      <Arrow x1={col[1] + 30} y1={118} x2={col[1] + 80} y2={60} color={tok('warn')} dash />
      <Arrow x1={col[1] + 30} y1={124} x2={col[1] + 80} y2={124} color={tok('warn')} dash />
      {/* no */}
      <Name x={col[2]} y={40} n="p" />
      <Name x={col[2]} y={110} n="q" />
      <Obj x={col[2] + 80} y={40} n="o1" c="brand" />
      <Obj x={col[2] + 80} y={110} n="o2" c="brand" />
      <Arrow x1={col[2] + 30} y1={52} x2={col[2] + 80} y2={53} color={tok('brand')} />
      <Arrow x1={col[2] + 30} y1={122} x2={col[2] + 80} y2={123} color={tok('brand')} />
      <T x={col[0] + 60} y={162} size={11} anchor="middle" fill={tok('muted')}>every run:</T>
      <T x={col[0] + 60} y={178} size={11} anchor="middle" fill={tok('muted')}>one object</T>
      <T x={col[1] + 60} y={162} size={11} anchor="middle" fill={tok('muted')}>dashed: only on</T>
      <T x={col[1] + 60} y={178} size={11} anchor="middle" fill={tok('muted')}>some runs</T>
      <T x={col[2] + 60} y={162} size={11} anchor="middle" fill={tok('muted')}>no run:</T>
      <T x={col[2] + 60} y={178} size={11} anchor="middle" fill={tok('muted')}>never shared</T>
    </Svg>
  );
}
