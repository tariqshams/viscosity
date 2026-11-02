import { Box, Svg, T, tok } from '../../viz/svg';

// One grammar rule above, its parsing function below: each piece of the
// rule becomes one piece of code, in the same order.
const PIECES = [
  { text: '"{"', color: 'brand', lines: [1] },
  { text: 'statement*', color: 'safe', lines: [3, 4, 5] },
  { text: '"}"', color: 'warn', lines: [6] },
];

const CODE = [
  'function block() {',
  "  consume('{');",
  '  const body = [];',
  "  while (peek() !== '}') {",
  '    body.push(statement());',
  '  }',
  "  consume('}');",
  "  return { kind: 'block', body };",
  '}',
];

const chipW = (s: string) => s.length * 7.6 + 16;

export default function RuleToFunction() {
  let x = 120;
  const chips = PIECES.map((p) => {
    const w = chipW(p.text);
    const c = { ...p, x, w };
    x += w + 10;
    return c;
  });
  const lineY = (k: number) => 84 + k * 20;
  const colorOf = (k: number) => PIECES.find((p) => p.lines.includes(k))?.color;
  return (
    <Svg w={400} h={276} title={'The rule block → "{" statement* "}" above its function. The terminal "{" becomes consume of the open brace; statement* becomes a while loop that calls statement; the terminal "}" becomes consume of the close brace; and the function returns a block node.'}>
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE RULE</T>
      <T x={14} y={38} size={12.5} mono weight={700} fill={tok('brand')}>block</T>
      <T x={90} y={38} size={16} anchor="middle">→</T>
      {chips.map((c) => (
        <Box key={c.text} x={c.x} y={24} w={c.w} h={28} r={c.text.startsWith('"') ? 4 : 14} dash={!c.text.startsWith('"')} fill={tok(c.color, 0.14)} stroke={tok(c.color)}>
          <T x={c.x + c.w / 2} y={38.5} size={12.5} mono anchor="middle">{c.text}</T>
        </Box>
      ))}
      <T x={8} y={68} size={11} weight={700} fill={tok('muted')}>ITS FUNCTION</T>
      {CODE.map((line, k) => {
        const col = colorOf(k);
        return (
          <g key={k}>
            {col && <rect x={4} y={lineY(k) - 9} width={392} height={18} rx={3} fill={tok(col, 0.13)} />}
            {col && <rect x={4} y={lineY(k) - 9} width={4} height={18} fill={tok(col)} />}
            <T x={14} y={lineY(k)} size={12} mono>{line}</T>
          </g>
        );
      })}
      <T x={8} y={lineY(9) + 4} size={11} fill={tok('muted')}>terminal → consume · nonterminal → call · * → while</T>
    </Svg>
  );
}
