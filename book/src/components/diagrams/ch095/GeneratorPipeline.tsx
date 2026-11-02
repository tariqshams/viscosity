// What a parser generator does: at build time it turns a grammar into
// parser code; at run time that code turns tokens into a tree.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function B({ x, y, w, label, sub, hot }: { x: number; y: number; w: number; label: string; sub?: string; hot?: boolean }) {
  return (
    <Box x={x} y={y} w={w} h={sub ? 44 : 32} fill={hot ? tok('brand', 0.14) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x + w / 2} y={y + (sub ? 16 : 16)} size={12} anchor="middle" weight={700}>{label}</T>
      {sub && <T x={x + w / 2} y={y + 32} size={11} anchor="middle" fill={tok('muted')}>{sub}</T>}
    </Box>
  );
}

export default function GeneratorPipeline() {
  return (
    <Svg w={400} h={214} title="Build time: grammar file into the generator, parser code out. Run time: tokens into that parser, tree out.">
      <T x={4} y={12} size={11} weight={700} fill={tok('muted')}>ONCE, WHEN YOU BUILD THE COMPILER</T>
      <B x={4} y={24} w={108} label="grammar file" sub="rules + actions" />
      <Arrow x1={114} y1={46} x2={140} y2={46} />
      <B x={142} y={24} w={112} label="generator" sub="Bison, ANTLR, …" hot />
      <Arrow x1={256} y1={46} x2={282} y2={46} />
      <B x={284} y={24} w={112} label="parser code" sub="tables or functions" />
      <path d="M330,70 L270,128" stroke={tok('ink', 0.5)} strokeWidth={2} strokeDasharray="4 4" fill="none" />
      <T x={306} y={104} size={11} fill={tok('muted')}>becomes</T>
      <T x={4} y={118} size={11} weight={700} fill={tok('muted')}>EVERY TIME A PROGRAM IS COMPILED</T>
      <B x={4} y={130} w={84} label="source" />
      <Arrow x1={90} y1={146} x2={108} y2={146} />
      <B x={110} y={130} w={84} label="scanner" />
      <Arrow x1={196} y1={146} x2={214} y2={146} />
      <B x={216} y={130} w={84} label="parser" hot />
      <Arrow x1={302} y1={146} x2={320} y2={146} />
      <B x={322} y={130} w={74} label="tree" />
      <T x={200} y={194} size={11} anchor="middle" fill={tok('muted')}>the parser in the second row is the code made in the first</T>
    </Svg>
  );
}
