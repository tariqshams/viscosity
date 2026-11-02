import { Box, Svg, T, tok } from '../../viz/svg';

const COLS = ['print', 'NUMBER', '(', '+', ';', ')'];
const ROWS: [string, Record<string, string>][] = [
  ['stmt', { print: 'print expr ;' }],
  ['expr', { NUMBER: 'item rest', '(': 'item rest' }],
  ['rest', { '+': '+ item rest', ';': 'ε', ')': 'ε' }],
  ['item', { NUMBER: 'NUMBER', '(': '( expr )' }],
];
// Why each cell is filled: from FIRST, or (for ε) from FOLLOW.
const FROM_FOLLOW = new Set(['rest;', 'rest)']);

/** Long bodies go on two lines, split at the space nearest the middle. */
function lines(v: string): string[] {
  if (v.length <= 8) return [v];
  const spaces = [...v].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i >= 0);
  const cut = spaces.reduce((b, i) => (Math.abs(i - v.length / 2) < Math.abs(b - v.length / 2) ? i : b));
  return [v.slice(0, cut), v.slice(cut + 1)];
}

/** The LL(1) table of the adding grammar, one rule per cell at most. */
export default function LLTable() {
  const x0 = 44;
  const cw = 59;
  return (
    <Svg w={400} h={196} title="The LL(1) table of the adding grammar. Rows are nonterminals, columns are next tokens, and each filled cell names the body to use. The two ε cells in the rest row come from FOLLOW(rest); every other cell comes from FIRST.">
      {COLS.map((c, j) => (
        <T key={c} x={x0 + cw * j + cw / 2} y={14} size={11} mono weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
      ))}
      {ROWS.map(([nt, cells], i) => {
        const y = 26 + i * 36;
        return (
          <g key={nt}>
            <T x={4} y={y + 15} size={12} mono weight={700}>{nt}</T>
            {COLS.map((c, j) => {
              const v = cells[c];
              const ff = FROM_FOLLOW.has(nt + c);
              return (
                <Box key={c} x={x0 + cw * j} y={y} w={cw - 3} h={30} r={3}
                  fill={v ? (ff ? tok('accent', 0.18) : tok('brand', 0.12)) : 'transparent'}
                  stroke={v ? (ff ? tok('accent') : tok('brand', 0.6)) : tok('line')}>
                  {v && lines(v).map((l, k, all) => (
                    <T key={k} x={x0 + cw * j + (cw - 3) / 2} y={y + 15.5 + (k - (all.length - 1) / 2) * 11} size={10.5} mono anchor="middle">{l}</T>
                  ))}
                </Box>
              );
            })}
          </g>
        );
      })}
      <rect x={44} y={176} width={12} height={12} fill={tok('brand', 0.12)} stroke={tok('brand', 0.6)} />
      <T x={62} y={182} size={11} fill={tok('muted')}>from FIRST of the body</T>
      <rect x={214} y={176} width={12} height={12} fill={tok('accent', 0.18)} stroke={tok('accent')} />
      <T x={232} y={182} size={11} fill={tok('muted')}>ε, from FOLLOW(rest)</T>
    </Svg>
  );
}
