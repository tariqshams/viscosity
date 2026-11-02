// Chapter 203: the function g after SCCP. The branch has become `br b1`
// and the return uses a new constant, so marking from the roots reaches
// only that constant; b2 has no incoming edge left and goes as a whole.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Row = [string, boolean];
const BLOCKS: { name: string; x: number; y: number; w: number; rows: Row[]; gone?: boolean }[] = [
  { name: 'b0', x: 100, y: 4, w: 200, rows: [['%0 = const 1', false], ['%1 = const undefined', false], ['%2 = const 0', false], ['%3 = binop > %0, %2', false], ['br b1', true]] },
  { name: 'b1', x: 6, y: 128, w: 178, rows: [['%4 = const 2', false], ['br b3', true]] },
  { name: 'b2 · no edge reaches it', x: 216, y: 128, w: 178, rows: [['%5 = const 3', false], ['br b3', false]], gone: true },
  { name: 'b3', x: 100, y: 206, w: 200, rows: [['%6 = phi %4, %5', false], ['%7 = const 10', false], ['%8 = binop * %6, %7', false], ['%9 = const 20', true], ['return %9', true]] },
];
const LH = 15;

export default function AfterSccp() {
  const h = (k: number) => 20 + BLOCKS[k].rows.length * LH;
  return (
    <Svg w={400} h={318} title="The CFG of g after SCCP. Instructions that marking reaches are shown in green; all others, and the whole of block b2, are struck out.">
      <Arrow x1={150} y1={4 + h(0)} x2={95} y2={126} color={tok('brand')} />
      <Arrow x1={95} y1={128 + h(1)} x2={150} y2={204} color={tok('brand')} />
      <Arrow x1={305} y1={128 + h(2)} x2={250} y2={204} color={tok('ink', 0.25)} dash />
      {BLOCKS.map((b, k) => (
        <Box key={k} x={b.x} y={b.y} w={b.w} h={h(k)} dash={b.gone} opacity={b.gone ? 0.5 : 1}>
          <T x={b.x + 8} y={b.y + 10} size={10} weight={700} fill={tok('muted')}>{b.name}</T>
          {b.rows.map(([text, live], j) => {
            const y = b.y + 25 + j * LH;
            return (
              <g key={j}>
                <T x={b.x + 8} y={y} size={11.5} mono fill={live ? tok('safe') : tok('muted')} weight={live ? 700 : 400}>{text}</T>
                {!live && <line x1={b.x + 6} y1={y} x2={b.x + 10 + text.length * 6.9} y2={y} stroke={tok('danger', 0.7)} strokeWidth={1.3} />}
              </g>
            );
          })}
        </Box>
      ))}
      <T x={6} y={310} size={11} fill={tok('muted')}>green = marked live (roots and what they use) · struck out = swept</T>
    </Svg>
  );
}
