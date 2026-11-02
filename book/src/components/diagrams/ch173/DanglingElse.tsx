import { Svg, T, tok } from '../../viz/svg';

const TOKS = ['if', 'a', 'if', 'b', 's1', 'else', 's2'];
const X0 = 40;
const DX = 50;
const cx = (i: number) => X0 + i * DX;

/** A rounded bracket under tokens from..to, at depth d below the row. */
function Group({ from, to, y, d, color, label }: { from: number; to: number; y: number; d: number; color: string; label: string }) {
  const x1 = cx(from) - 22;
  const x2 = cx(to) + 22;
  const yy = y + 16 + d * 18;
  return (
    <g>
      <path d={`M${x1},${y + 12} L${x1},${yy} L${x2},${yy} L${x2},${y + 12}`} fill="none" stroke={color} strokeWidth={2} />
      <T x={(x1 + x2) / 2} y={yy + 9} size={11} anchor="middle" fill={color} weight={700}>{label}</T>
    </g>
  );
}

function Row({ y, title, inner, color }: { y: number; title: string; inner: [number, number]; color: string }) {
  return (
    <g>
      <T x={8} y={y - 22} size={11} weight={700} fill={color}>{title}</T>
      {TOKS.map((t, i) => (
        <T key={i} x={cx(i)} y={y} size={14} mono anchor="middle" weight={t === 'if' || t === 'else' ? 700 : 400}>{t}</T>
      ))}
      <Group from={inner[0]} to={inner[1]} y={y} d={0} color={color} label="inner if" />
      <Group from={0} to={6} y={y} d={1.6} color={tok('ink', 0.55)} label="outer if" />
    </g>
  );
}

export default function DanglingElse() {
  return (
    <Svg w={400} h={236} title="The tokens if a if b s1 else s2, grouped two ways. Top: the else belongs to the inner if, the nearest one. Bottom: the else belongs to the outer if.">
      <Row y={34} title="READING 1: else BELONGS TO THE NEAREST if" inner={[2, 6]} color={tok('safe')} />
      <Row y={150} title="READING 2: else BELONGS TO THE OUTER if" inner={[2, 4]} color={tok('danger')} />
    </Svg>
  );
}
