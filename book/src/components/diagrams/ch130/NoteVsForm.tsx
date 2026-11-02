// Chapter 130: why an error enum beats a String error. On the left, four
// failures as strings: telling them apart means reading the text. On the
// right, the same failures as variants, sorted by kind before anyone
// reads a word. Messages follow Drip's own wording (book/DRIP.md); the
// enum is the chapter's DripError design.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const NOTES = [
  'cannot read prog.drip',
  "line 3: expected ';'…",
  'runtime error: cannot…',
  'line 9: unexpected…',
];
const KINDS: { v: string; c: string; n: number }[] = [
  { v: 'Io', c: 'f3', n: 1 },
  { v: 'Compile', c: 'f2', n: 2 },
  { v: 'Runtime', c: 'f6', n: 1 },
];

export default function NoteVsForm() {
  return (
    <Svg w={400} h={196} title="Four error messages as plain strings on the left, and the same errors sorted into three enum variants on the right">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>Result&lt;T, String&gt;</T>
      {NOTES.map((n, k) => (
        <Box key={k} x={8} y={24 + k * 40} w={176} h={30} r={3} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={39 + k * 40} size={11} mono fill={tok('ink')}>{n}</T>
        </Box>
      ))}
      <Arrow x1={190} y1={98} x2={222} y2={98} color={tok('ink', 0.5)} />
      <T x={226} y={12} size={11} weight={700} fill={tok('muted')}>Result&lt;T, DripError&gt;</T>
      {KINDS.map((k, j) => (
        <Box key={k.v} x={226} y={24 + j * 54} w={166} h={44} r={4} fill={tok(k.c, 0.15)} stroke={tok(k.c)}>
          <T x={236} y={40 + j * 54} size={12} mono weight={700} fill={tok('ink')}>DripError::{k.v}</T>
          <T x={236} y={57 + j * 54} size={11} fill={tok('muted')}>{k.n === 1 ? '1 error' : `${k.n} errors`}, details inside</T>
        </Box>
      ))}
      <T x={8} y={190} size={11} fill={tok('muted')}>read every word to sort them</T>
      <T x={226} y={190} size={11} fill={tok('muted')}>sorted by the type; match</T>
    </Svg>
  );
}
