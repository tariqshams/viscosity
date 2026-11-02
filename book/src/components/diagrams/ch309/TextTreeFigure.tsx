import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 309: the same square macro used as sq(n + 1). C's preprocessor
// pastes tokens, so the multiplication grabs 1 and n; a tree macro pastes
// the whole argument tree into each hole. Outputs are real: gcc -E gave
// n + 1 * n + 1, and rustc's expanded output was (n + 1) * (n + 1).
function Node({ x, y, t, c = 'line' }: { x: number; y: number; t: string; c?: string }) {
  return (
    <Box x={x - 17} y={y - 11} w={34} h={22} r={11} fill={c === 'line' ? tok('panel') : tok(c, 0.15)} stroke={tok(c)}>
      <T x={x} y={y} size={12} mono anchor="middle">{t}</T>
    </Box>
  );
}
function L({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <path d={`M${x1},${y1 + 11} L${x2},${y2 - 11}`} stroke={tok('ink', 0.45)} strokeWidth={1.5} />;
}

export default function TextTreeFigure() {
  return (
    <Svg w={400} h={210} title="Left: C text expansion parses as n plus 1 times n plus 1. Right: a tree macro gives (n plus 1) times (n plus 1).">
      <T x={100} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>C: PASTE TOKENS</T>
      <T x={100} y={34} size={12} mono anchor="middle">n + 1 * n + 1</T>
      <Node x={100} y={64} t="+" />
      <Node x={60} y={104} t="+" />
      <Node x={150} y={104} t="1" />
      <Node x={30} y={144} t="n" />
      <Node x={90} y={144} t="*" c="f6" />
      <Node x={70} y={184} t="1" />
      <Node x={110} y={184} t="n" />
      <L x1={100} y1={64} x2={60} y2={104} />
      <L x1={100} y1={64} x2={150} y2={104} />
      <L x1={60} y1={104} x2={30} y2={144} />
      <L x1={60} y1={104} x2={90} y2={144} />
      <L x1={90} y1={144} x2={70} y2={184} />
      <L x1={90} y1={144} x2={110} y2={184} />
      <path d="M200,8 L200,200" stroke={tok('line')} strokeWidth={1} />
      <T x={300} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>RUST: PASTE TREES</T>
      <T x={300} y={34} size={12} mono anchor="middle">(n + 1) * (n + 1)</T>
      <Node x={300} y={64} t="*" c="f3" />
      <Node x={250} y={104} t="+" c="f2" />
      <Node x={350} y={104} t="+" c="f2" />
      <Node x={230} y={144} t="n" />
      <Node x={270} y={144} t="1" />
      <Node x={330} y={144} t="n" />
      <Node x={370} y={144} t="1" />
      <L x1={300} y1={64} x2={250} y2={104} />
      <L x1={300} y1={64} x2={350} y2={104} />
      <L x1={250} y1={104} x2={230} y2={144} />
      <L x1={250} y1={104} x2={270} y2={144} />
      <L x1={350} y1={104} x2={330} y2={144} />
      <L x1={350} y1={104} x2={370} y2={144} />
      <T x={300} y={184} size={11} anchor="middle" fill={tok('muted')}>each hole holds a whole tree</T>
    </Svg>
  );
}
