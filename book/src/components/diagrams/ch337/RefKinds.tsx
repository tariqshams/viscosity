// Chapter 337: what you may do with a value depending on how you hold it.
// The owner may do everything, including give it away or let it drop; a
// shared reference may only read; a mutable reference may read and write,
// but neither kind of reference can drop or move the value.
import { Box, Svg, T, tok } from '../../viz/svg';

const COLS = ['read', 'change', 'move or drop'];
const ROWS: { who: string; ty: string; can: boolean[]; col: string }[] = [
  { who: 'owner', ty: 's: String', can: [true, true, true], col: 'accent' },
  { who: 'shared borrow', ty: 'r: &String', can: [true, false, false], col: 'safe' },
  { who: 'mutable borrow', ty: 'w: &mut String', can: [true, true, false], col: 'warn' },
];

export default function RefKinds() {
  return (
    <Svg w={400} h={170} title="What an owner, a shared reference and a mutable reference may each do">
      {COLS.map((c, k) => (
        <T key={c} x={[205, 268, 345][k]} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
      ))}
      {ROWS.map((r, i) => {
        const y = 28 + i * 44;
        return (
          <g key={r.who}>
            <Box x={4} y={y} w={168} h={36} fill={tok(r.col, 0.1)} stroke={tok(r.col)}>
              <T x={12} y={y + 12} size={11} weight={700} fill={tok(r.col)}>{r.who}</T>
              <T x={12} y={y + 27} size={12} mono>{r.ty}</T>
            </Box>
            {r.can.map((ok, k) => (
              <T key={k} x={[205, 268, 345][k]} y={y + 18} size={17} anchor="middle" weight={700} fill={ok ? tok('safe') : tok('danger')}>{ok ? '✓' : '✕'}</T>
            ))}
          </g>
        );
      })}
      <T x={8} y={162} size={11} fill={tok('muted')}>Changing needs mut on the owner too: let mut s, then &amp;mut s.</T>
    </Svg>
  );
}
