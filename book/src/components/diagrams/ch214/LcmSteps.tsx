// Chapter 213-b (staged split of 190): lazy code motion for a + b on a
// five-block function, one dataflow fact at a time, then the rewrite.
// The facts are those computed by the chapter's own implementation.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const BLOCKS = ['b0', 'b1', 'b2', 'b3', 'b4'];
const CODE = ['(entry)', 'condbr', 'x = a + b', '(nothing)', 'y = a + b'];
const ROWS: { name: string; v: boolean[] }[] = [
  { name: 'ANT', v: [true, true, true, true, true] },
  { name: 'AV', v: [false, true, true, true, true] },
  { name: 'EARL', v: [true, false, false, false, false] },
  { name: 'POST', v: [false, true, true, true, false] },
  { name: 'LATE', v: [false, false, true, true, false] },
  { name: 'USEDout', v: [false, false, true, true, false] },
];
const AFTER = ['(entry)', 'condbr', 't = a + b; x = t', 't = a + b', 'y = t'];

const NOTES = [
  'The function: b0 is the entry, b1 branches to b2 or b3, and both go on to b4. b2 and b4 compute a + b. (Edges: b0→b1, b1→b2, b1→b3, b2→b4, b3→b4; none is critical.)',
  'ANT, anticipated on entry: every path from every block computes a + b before a or b change, so it is yes everywhere.',
  'AV, will be available on entry: if copies went at the earliest points, would b already have one? Not b0, the entry; every other block, yes, because b0 would have it.',
  'EARL, earliest = anticipated and not available: only b0. Busy code motion would put the one copy here, live across the whole function.',
  'POST, postponable on entry: b1’s only predecessor b0 is earliest and does not use a + b, so the copy may slide into b1; then into b2 and b3. Not into b4: its predecessor b2 uses the expression.',
  'LATE: b2 and b3 may hold the copy (they are OK) and cannot pass it on, since their successor b4 is not OK. b1 could pass it to both successors, so it is not latest.',
  'USEDout: is the copy needed after the block? After b2 and b3, yes: b4 uses it. So both insertions are kept.',
  'The rewrite: insert t = a + b at the start of b2 and b3; b2 and b4 use t. One addition on each path, as before on b3’s path and one fewer on b2’s, and t lives from b2 or b3 to b4 only.',
];

export default function LcmSteps() {
  const s = useSteps(NOTES);
  const shown = Math.min(s.i, ROWS.length);
  const done = s.i === NOTES.length - 1;
  const cw = 62;
  const x0 = 80;
  return (
    <StepFrame title="Earliest, then as late as possible" steps={s} note={s.state}>
      <Svg w={400} h={226} title="A table with one column per block, b0 to b4, and one row per dataflow fact; the code of each block is in the top row.">
        {BLOCKS.map((b, k) => (
          <g key={k}>
            <T x={x0 + k * cw + cw / 2} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>{b}</T>
            <Box x={x0 + k * cw + 2} y={20} w={cw - 4} h={36} fill={done && (k === 2 || k === 3 || k === 4) ? tok('safe', 0.12) : tok('panel')} stroke={done && (k === 2 || k === 3 || k === 4) ? tok('safe') : tok('line')}>
              {(done ? AFTER[k] : CODE[k]).split('; ').map((line, j, all) => (
                <T key={j} x={x0 + k * cw + cw / 2} y={38 + (j - (all.length - 1) / 2) * 13} size={10} mono anchor="middle">{line}</T>
              ))}
            </Box>
          </g>
        ))}
        {ROWS.map((r, i) => (
          <g key={i} opacity={i < shown ? 1 : 0.2}>
            <T x={6} y={76 + i * 24} size={11} weight={700} fill={i === shown - 1 && !done ? tok('brand') : tok('muted')}>{r.name}</T>
            {r.v.map((v, k) => (
              <T key={k} x={x0 + k * cw + cw / 2} y={76 + i * 24} size={12} mono anchor="middle" weight={700}
                fill={i < shown ? (v ? tok('safe') : tok('muted')) : tok('muted')}>{i < shown ? (v ? 'yes' : 'no') : '·'}</T>
            ))}
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
