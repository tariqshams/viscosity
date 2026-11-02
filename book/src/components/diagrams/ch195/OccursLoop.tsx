// 'a ↦ fn('a) -> 'b unfolded: each replacement of 'a brings another 'a,
// so the written-out type never ends.
import { Arrow, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  "'a",
  "fn('a) -> 'b",
  "fn(fn('a) -> 'b) -> 'b",
  "fn(fn(fn('a) -> 'b) -> 'b) -> 'b",
];

export default function OccursLoop() {
  return (
    <Svg w={400} h={206} title="Unfolding 'a with the binding 'a goes to fn('a) -> 'b. Row 1: 'a. Row 2: fn('a) -> 'b. Row 3: fn(fn('a) -> 'b) -> 'b. Row 4: fn(fn(fn('a) -> 'b) -> 'b) -> 'b, and so on forever: each row still contains 'a.">
      <T x={200} y={14} size={12} anchor="middle" weight={700} fill={tok('danger')}>binding: 'a ↦ fn('a) -&gt; 'b</T>
      {ROWS.map((r, i) => (
        <g key={i}>
          <T x={200} y={44 + i * 40} size={13} mono anchor="middle">{r}</T>
          {i < ROWS.length - 1 && <Arrow x1={200} y1={52 + i * 40} x2={200} y2={70 + i * 40} color={tok('danger', 0.7)} />}
        </g>
      ))}
      <T x={200} y={198} size={12} anchor="middle" fill={tok('danger')}>… and every row still contains 'a</T>
    </Svg>
  );
}
