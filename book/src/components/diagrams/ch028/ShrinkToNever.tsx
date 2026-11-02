import { Box, Svg, T, tok } from '../../viz/svg';

const KINDS = ['circle', 'rect', 'tri'];
const ROWS: { label: string; left: string[]; bad?: boolean; never?: boolean }[] = [
  { label: 's: Shape, at the top', left: ['circle', 'rect', 'tri'] },
  { label: 'after the circle check', left: ['rect', 'tri'] },
  { label: 'after the rect check', left: ['tri'] },
  { label: 'tri forgotten: unreachable(s)', left: ['tri'], bad: true },
  { label: 'tri handled: unreachable(s)', left: [], never: true },
];

/** Each check that returns removes one variant, until nothing is left. */
export default function ShrinkToNever() {
  return (
    <Svg w={400} h={222} title="Five rows. At the top s may be circle, rect or tri. After the circle check, rect or tri. After the rect check, tri. If tri is forgotten, unreachable(s) is handed a tri, which is an error. If tri is handled, nothing is left: the type is never.">
      {ROWS.map((r, k) => {
        const y = 10 + k * 42;
        return (
          <g key={k}>
            <T x={6} y={y + 15} size={11} fill={tok('muted')}>{r.label}</T>
            {r.never ? (
              <Box x={196} y={y + 2} w={196} h={26} r={13} fill={tok('safe', 0.12)} stroke={tok('safe')}>
                <T x={294} y={y + 15.5} size={12} mono weight={700} anchor="middle" fill={tok('safe')}>never: nothing left ✓</T>
              </Box>
            ) : KINDS.map((kd, j) => {
              const on = r.left.includes(kd);
              const c = r.bad && on ? 'danger' : 'brand';
              return (
                <g key={kd} opacity={on ? 1 : 0.3}>
                  <Box x={196 + j * 68} y={y + 2} w={60} h={26} r={13} fill={on ? tok(c, 0.14) : 'transparent'} stroke={on ? tok(c) : tok('line')} dash={!on}>
                    <T x={226 + j * 68} y={y + 15.5} size={12} mono weight={700} anchor="middle" fill={on ? tok(c) : tok('muted')}>{kd}</T>
                  </Box>
                </g>
              );
            })}
            {r.bad && <T x={6} y={y + 31} size={11} weight={700} fill={tok('danger')}>error: a tri is not a never</T>}
          </g>
        );
      })}
    </Svg>
  );
}
