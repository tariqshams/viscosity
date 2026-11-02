// Chapter 161: renaming straight-line code into SSA. A table holds the
// latest version of each name; a use reads the table, and an assignment
// makes a new version (after its right-hand side has been read).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ORIG = ['x = a + 1', 'x = x * 2', 'y = x + 3', 'x = 0'];
const NEW = ['x1 = a0 + 1', 'x2 = x1 * 2', 'y1 = x2 + 3', 'x3 = 0'];

type St = { done: number; ver: Record<string, string>; hot: number | null; note: string };

const STATES: St[] = [
  { done: 0, ver: { a: 'a0' }, hot: null, note: 'Four lines, and the name x is assigned three times. The table on the right will hold the latest version of each name; a, an input nobody assigns here, starts as version 0, a0.' },
  { done: 1, ver: { a: 'a0', x: 'x1' }, hot: 0, note: 'Line 1 reads a, which the table says is a0. Then it assigns x, the first time, so x becomes x1, and the table remembers it.' },
  { done: 2, ver: { a: 'a0', x: 'x2' }, hot: 1, note: 'Line 2 reads x first: the table says x1. Only then does the assignment make a new version, x2. Reading before writing is what makes x2 = x1 * 2 rather than x2 = x2 * 2.' },
  { done: 3, ver: { a: 'a0', x: 'x2', y: 'y1' }, hot: 2, note: 'Line 3 reads x, now x2, and defines y1. The question from the start (which x is this?) is answered by the name itself.' },
  { done: 4, ver: { a: 'a0', x: 'x3', y: 'y1' }, hot: 3, note: 'Line 4 makes x3. Nothing that used x1 or x2 changes: no name is ever overwritten, so every use points at exactly one line.' },
];

export default function StraightSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Renaming straight-line code" steps={s} note={st.note}>
      <Svg w={400} h={170} title="Four lines renamed into SSA one by one, with a table of the latest version of each name.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>code</T>
        {ORIG.map((l, k) => {
          const y = 36 + k * 32;
          const hot = st.hot === k;
          return (
            <Box key={k} x={6} y={y - 13} w={220} h={26}
              fill={hot ? tok('brand', 0.18) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={16} y={y} size={13} mono>{k < st.done ? NEW[k] : l}</T>
            </Box>
          );
        })}
        <T x={260} y={12} size={11} weight={700} fill={tok('muted')}>latest version</T>
        {['a', 'x', 'y'].map((n, k) => (
          <g key={n}>
            <T x={268} y={36 + k * 32} size={13} mono>{n}</T>
            <Box x={290} y={23 + k * 32} w={70} h={26} fill={tok('accent', st.ver[n] ? 0.14 : 0.04)} stroke={tok('accent')}>
              <T x={325} y={36 + k * 32} size={13} mono anchor="middle">{st.ver[n] ?? '—'}</T>
            </Box>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
