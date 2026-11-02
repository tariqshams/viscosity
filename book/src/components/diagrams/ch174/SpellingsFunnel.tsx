// Chapter 174: lowering collapses spellings that mean the same thing, and
// keeps apart the ones that differ. Both listings are the real output of
// Viscosity's JavaScript front end (printFunc), trimmed to the body.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Src({ y, text }: { y: number; text: string }) {
  return (
    <Box x={6} y={y - 14} w={150} h={28} fill={tok('panel')} stroke={tok('line')}>
      <T x={14} y={y} size={12} mono>{text}</T>
    </Box>
  );
}

function Vir({ y, lines, hot }: { y: number; lines: string[]; hot?: number }) {
  const h = lines.length * 17 + 12;
  return (
    <Box x={202} y={y} w={192} h={h} fill={tok('brand', 0.08)} stroke={tok('brand')}>
      {lines.map((l, k) => (
        <T key={k} x={210} y={y + 14 + k * 17} size={11.5} mono fill={k === hot ? tok('brand') : undefined} weight={k === hot ? 700 : undefined}>{l}</T>
      ))}
    </Box>
  );
}

export default function SpellingsFunnel() {
  return (
    <Svg w={400} h={300} title="Two spellings of p.x plus p.vx lower to the same four VIR instructions; x += 1 and x++ lower to different VIR, because x++ first converts x to a number with unop +.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>source</T>
      <T x={202} y={12} size={11} weight={700} fill={tok('muted')}>VIR</T>
      <Src y={46} text="p.x += p.vx" />
      <Src y={90} text="p.x = p.x + p.vx" />
      <Arrow x1={158} y1={46} x2={200} y2={66} color={tok('brand')} />
      <Arrow x1={158} y1={90} x2={200} y2={72} color={tok('brand')} />
      <Vir y={30} lines={['%1 = field.get %0 .x', '%2 = field.get %0 .vx', '%3 = binop + %1, %2', 'field.set %0, %3 .x']} />
      <T x={200} y={124} size={11} fill={tok('muted')}>two spellings, one form</T>

      <Src y={172} text="x += 1" />
      <Src y={240} text="x++" />
      <Arrow x1={158} y1={172} x2={200} y2={172} color={tok('accent')} />
      <Arrow x1={158} y1={240} x2={200} y2={240} color={tok('accent')} />
      <Vir y={146} lines={['%1 = const 1', '%2 = binop + %0, %1']} />
      <Vir y={200} lines={['%1 = unop + %0', '%2 = const 1', '%3 = binop + %1, %2']} hot={0} />
      <T x={200} y={278} size={11} fill={tok('muted')}>a real difference stays visible</T>
    </Svg>
  );
}
