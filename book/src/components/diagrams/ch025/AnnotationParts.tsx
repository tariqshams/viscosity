import { Box, Svg, T, tok } from '../../viz/svg';

const CW = 7.2; // width of one character at size 12, monospace
type Seg = [string, boolean];

function Line({ x, y, segs }: { x: number; y: number; segs: Seg[] }) {
  let col = 0;
  return (
    <g>
      {segs.map(([text, isType], k) => {
        const sx = x + col * CW;
        col += text.length;
        return (
          <g key={k}>
            {isType && <rect x={sx - 1} y={y - 10} width={text.length * CW + 2} height={20} rx={3} fill={tok('brand', 0.16)} stroke={tok('brand')} strokeWidth={1} />}
            <T x={sx} y={y} size={12} mono weight={isType ? 700 : 400} fill={isType ? tok('brand') : undefined}>{text}</T>
          </g>
        );
      })}
    </g>
  );
}

/** Where type annotations go: after a parameter, after the parameter list, after a variable name. */
export default function AnnotationParts() {
  const x0 = 8;
  const at = (col: number) => x0 + col * CW;
  return (
    <Svg w={400} h={236} title="The line function mul(a: number, b: number): number with each label highlighted: a holds a number, b holds a number, and mul returns a number. Below, let count: number = 0 labels a variable, and let n = 3 has no label, so TypeScript infers number.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>A LABELLED FUNCTION</T>
      <Line x={x0} y={34} segs={[['function mul(a', false], [': number', true], [', b', false], [': number', true], [')', false], [': number', true], [' {', false]]} />
      <line x1={at(17.5)} y1={45} x2={at(17.5)} y2={62} stroke={tok('brand')} strokeWidth={1.5} />
      <line x1={at(28.5)} y1={45} x2={at(28.5)} y2={86} stroke={tok('brand')} strokeWidth={1.5} />
      <line x1={at(38)} y1={45} x2={at(38)} y2={110} stroke={tok('brand')} strokeWidth={1.5} />
      <T x={at(17.5) - 4} y={70} size={11} anchor="end">a holds a number</T>
      <T x={at(28.5) - 4} y={94} size={11} anchor="end">b holds a number</T>
      <T x={at(38) - 4} y={118} size={11} anchor="end">mul returns a number</T>
      <T x={8} y={146} size={11} weight={700} fill={tok('muted')}>VARIABLES</T>
      <Line x={x0} y={168} segs={[['let count', false], [': number', true], [' = 0;', false]]} />
      <T x={392} y={168} size={11} anchor="end" fill={tok('muted')}>labelled by you</T>
      <Box x={4} y={186} w={392} h={40} r={6} stroke={tok('line')} fill="transparent" dash>
        <Line x={x0 + 4} y={206} segs={[['let n = 3;', false]]} />
        <T x={386} y={206} size={11} anchor="end" fill={tok('muted')}>no label: TypeScript infers number</T>
      </Box>
    </Svg>
  );
}
