// Why ((1 + 2) + 3) + 4 → (3 + 3) + 4 is a legal step: a derivation
// with Add at the top and AddL twice below it.
import { Svg, T, tok } from '../../viz/svg';

const ROWS: { text: string; rule: string; w: number; y: number; hi?: boolean }[] = [
  { text: '1 + 2 → 3', rule: 'Add', w: 100, y: 32, hi: true },
  { text: '(1 + 2) + 3 → 3 + 3', rule: 'AddL', w: 190, y: 82 },
  { text: '((1 + 2) + 3) + 4 → (3 + 3) + 4', rule: 'AddL', w: 286, y: 132 },
];

export default function DerivationTree() {
  return (
    <Svg w={400} h={176} title="A derivation in three rows. Top: 1 + 2 → 3 by Add. Middle, below a line labelled AddL: (1 + 2) + 3 → 3 + 3. Bottom, below a line labelled AddL: ((1 + 2) + 3) + 4 → (3 + 3) + 4.">
      {ROWS.map((r, k) => (
        <g key={k}>
          {k > 0 && (
            <>
              <line x1={170 - r.w / 2} y1={r.y - 22} x2={170 + r.w / 2} y2={r.y - 22} stroke={tok('ink', 0.7)} strokeWidth={1.4} />
              <T x={176 + r.w / 2} y={r.y - 22} size={12} weight={700} fill={tok('accent')}>{r.rule}</T>
            </>
          )}
          {k === 0 && (
            <>
              <line x1={170 - r.w / 2} y1={r.y - 18} x2={170 + r.w / 2} y2={r.y - 18} stroke={tok('ink', 0.7)} strokeWidth={1.4} />
              <T x={176 + r.w / 2} y={r.y - 18} size={12} weight={700} fill={tok('accent')}>{r.rule}</T>
            </>
          )}
          <T x={170} y={r.y} size={13} mono anchor="middle" weight={r.hi ? 700 : 400} fill={r.hi ? tok('brand') : tok('ink')}>{r.text.replace(/ /g, ' ')}</T>
        </g>
      ))}
      <T x={200} y={164} size={11} anchor="middle" fill={tok('muted')}>read upwards: each line is justified by the one above it</T>
    </Svg>
  );
}
