import { Box, Svg, T, tok } from '../../viz/svg';

// One row per token: what it means with nothing on its left (prefix
// position), and what it means after a finished operand (infix position).
const ROWS: { t: string; pre: string; inf: string; bp?: number }[] = [
  { t: '-', pre: 'negate   -x', inf: 'subtract   a - b', bp: 5 },
  { t: '(', pre: 'group   (a + b)', inf: 'call   f(a)', bp: 8 },
  { t: '[', pre: 'list   [1, 2]', inf: 'index   xs[i]', bp: 8 },
  { t: '!', pre: 'not   !ok', inf: '' },
  { t: '.', pre: '', inf: 'field   p.x', bp: 8 },
  { t: '*', pre: '', inf: 'multiply   a * b', bp: 6 },
  { t: '7', pre: 'a number', inf: '' },
];

/** The two jobs a token can have, depending on where the parser meets it. */
export default function TokenRoles() {
  const RH = 30;
  const top = 34;
  return (
    <Svg w={400} h={top + ROWS.length * RH + 8} title="A table of Drip tokens and their two possible jobs. Minus: negate in prefix position, subtract in infix position. Open bracket: group, or call. Square bracket: list, or index. Not: prefix only. Dot: infix only, a field. Star: infix only, multiply. A number: prefix only.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>TOKEN</T>
      <T x={56} y={12} size={11} weight={700} fill={tok('accent')}>PREFIX</T>
      <T x={56} y={25} size={10.5} fill={tok('muted')}>nothing on the left</T>
      <T x={220} y={12} size={11} weight={700} fill={tok('brand')}>INFIX (bp)</T>
      <T x={220} y={25} size={10.5} fill={tok('muted')}>after an operand</T>
      {ROWS.map((r, k) => {
        const y = top + k * RH;
        return (
          <g key={k}>
            <Box x={8} y={y + 3} w={36} h={RH - 6} fill={tok('panel')} stroke={tok('ink', 0.45)}>
              <T x={26} y={y + RH / 2} size={15} mono anchor="middle" weight={700}>{r.t}</T>
            </Box>
            <Box x={52} y={y + 3} w={160} h={RH - 6} fill={r.pre ? tok('accent', 0.12) : 'transparent'} stroke={r.pre ? tok('accent') : tok('line')} dash={!r.pre}>
              <T x={60} y={y + RH / 2} size={12} mono fill={r.pre ? tok('ink') : tok('muted')}>{r.pre || 'no prefix job'}</T>
            </Box>
            <Box x={216} y={y + 3} w={176} h={RH - 6} fill={r.inf ? tok('brand', 0.12) : 'transparent'} stroke={r.inf ? tok('brand') : tok('line')} dash={!r.inf}>
              <T x={224} y={y + RH / 2} size={12} mono fill={r.inf ? tok('ink') : tok('muted')}>{r.inf || 'no infix job'}</T>
              {r.bp !== undefined && <T x={386} y={y + RH / 2} size={11} mono anchor="end" weight={700} fill={tok('brand')}>{r.bp}</T>}
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
