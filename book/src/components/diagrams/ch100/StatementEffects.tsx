import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Three statements, and the one place each leaves its mark. */
const ROWS = [
  { code: 'let n = 5;', target: 'variables', mark: 'n = 5 added', color: 'f1' },
  { code: 'print n + 1;', target: 'output', mark: 'a new line: 6', color: 'brand' },
  { code: 'n + 1;', target: 'nowhere', mark: '6 is dropped', color: 'muted' },
];

export default function StatementEffects() {
  return (
    <Svg w={400} h={170} title="Three statements and their side effects: print adds a line to the output, let adds a variable to the table, and an expression statement such as n + 1; computes 6 and throws it away.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STATEMENT</T>
      <T x={230} y={12} size={11} weight={700} fill={tok('muted')}>WHAT IT CHANGES</T>
      {ROWS.map((r, i) => {
        const y = 42 + i * 46;
        const dropped = r.target === 'nowhere';
        return (
          <g key={r.code}>
            <Box x={8} y={y - 15} w={140} h={30} fill={tok('panel')} stroke={tok('ink', 0.4)}>
              <T x={18} y={y} size={13} mono>{r.code}</T>
            </Box>
            <Arrow x1={152} y1={y} x2={224} y2={y} dash={dropped} color={tok(r.color, dropped ? 0.6 : 0.9)} />
            <Box x={228} y={y - 18} w={164} h={36} dash={dropped} fill={dropped ? 'transparent' : tok(r.color, 0.12)} stroke={tok(r.color, dropped ? 0.6 : 1)}>
              <T x={238} y={y - 7} size={11} weight={700} fill={tok(r.color)}>{r.target}</T>
              <T x={238} y={y + 8} size={12} mono>{r.mark}</T>
            </Box>
          </g>
        );
      })}
      <T x={8} y={162} size={11} fill={tok('muted')}>every statement computes; only two leave a mark</T>
    </Svg>
  );
}
