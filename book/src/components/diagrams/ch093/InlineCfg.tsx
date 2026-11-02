// Chapter 93: inlining on a CFG. The caller's block is split at the call,
// the callee's blocks are copied in with fresh names, and each return jumps
// to the second half, where a phi picks the returned value.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Blk({ x, y, w, title, lines, tint }: { x: number; y: number; w: number; title: string; lines: string[]; tint?: string }) {
  const h = 18 + lines.length * 14;
  return (
    <Box x={x} y={y} w={w} h={h} fill={tint ? tok(tint, 0.12) : tok('panel')} stroke={tint ? tok(tint) : tok('line')}>
      <T x={x + 6} y={y + 9} size={10} weight={700} fill={tok('muted')}>{title}</T>
      {lines.map((l, k) => <T key={k} x={x + 6} y={y + 24 + k * 14} size={10.5} mono>{l}</T>)}
    </Box>
  );
}

export default function InlineCfg() {
  return (
    <Svg w={400} h={280} title="Left: a block b4 with a call to abs, and abs's own CFG of three blocks. Right: b4 split in two, with abs's blocks copied in between and a phi joining the two returns.">
      <T x={70} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>BEFORE</T>
      <Blk x={4} y={20} w={132} title="b4 (caller)" lines={['%9 = call abs, %8', '%10 = %9 + 1']} />
      <Blk x={4} y={96} w={132} title="abs: c0" lines={['%1 = %0 < 0', 'condbr %1, c1, c2']} tint="accent" />
      <Blk x={4} y={160} w={62} title="c1" lines={['%2 = -%0', 'return %2']} tint="accent" />
      <Blk x={74} y={160} w={62} title="c2" lines={['return %0']} tint="accent" />
      <Arrow x1={40} y1={142} x2={36} y2={158} />
      <Arrow x1={100} y1={142} x2={104} y2={158} />
      <line x1={146} y1={20} x2={146} y2={270} stroke={tok('line')} strokeWidth={1.5} />
      <T x={274} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>AFTER</T>
      <Blk x={196} y={20} w={156} title="b4 (first half)" lines={['… code before the call', 'br c0′']} />
      <Blk x={196} y={84} w={156} title="c0′ (copy)" lines={['%21 = %8 < 0', 'condbr %21, c1′, c2′']} tint="accent" />
      <Blk x={160} y={148} w={110} title="c1′" lines={['%22 = -%8', 'br b4′']} tint="accent" />
      <Blk x={280} y={148} w={110} title="c2′" lines={['br b4′']} tint="accent" />
      <Blk x={196} y={216} w={156} title="b4′ (second half)" lines={['%9 = phi %22, %8', '%10 = %9 + 1']} tint="safe" />
      <Arrow x1={274} y1={66} x2={274} y2={82} />
      <Arrow x1={240} y1={130} x2={220} y2={146} />
      <Arrow x1={310} y1={130} x2={330} y2={146} />
      <Arrow x1={215} y1={194} x2={240} y2={214} />
      <Arrow x1={335} y1={180} x2={310} y2={214} />
    </Svg>
  );
}
