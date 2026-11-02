import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { call: string; ret: string; after: number }[] = [
  { call: 'peek()', ret: "'='", after: 1 },
  { call: "match('=')", ret: 'true', after: 2 },
  { call: "match('<')", ret: 'false', after: 1 },
  { call: 'advance()', ret: "'='", after: 2 },
];

function Chars({ x, y, cur }: { x: number; y: number; cur: number }) {
  return (
    <g>
      {['<', '='].map((c, k) => (
        <Box key={k} x={x + k * 26} y={y} w={24} h={24} r={3} fill={k < cur ? tok('ink', 0.08) : tok('panel')} stroke={k === cur ? tok('accent') : tok('ink', 0.35)}>
          <T x={x + k * 26 + 12} y={y + 12} size={14} mono anchor="middle">{c}</T>
        </Box>
      ))}
      <T x={x + cur * 26 + 12} y={y + 34} size={11} mono anchor="middle" fill={tok('accent')} weight={700}>▲</T>
    </g>
  );
}

/** Each helper, starting from the same state: current = 1, after reading '<'. */
export default function HelperTable() {
  return (
    <Svg w={400} h={252} title="Four calls, each starting with current at 1, on the second character of <=. peek returns = and leaves current at 1. match of = returns true and moves current to 2. match of less-than returns false and leaves current at 1. advance returns = and moves current to 2.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>CALL</T>
      <T x={128} y={12} size={11} weight={700} fill={tok('muted')}>RETURNS</T>
      <T x={214} y={12} size={11} weight={700} fill={tok('muted')}>CURRENT AFTER</T>
      {ROWS.map((r, k) => {
        const y = 26 + k * 56;
        const moved = r.after !== 1;
        return (
          <g key={r.call}>
            <T x={6} y={y + 12} size={13} mono weight={700}>{r.call}</T>
            <T x={128} y={y + 12} size={13} mono>{r.ret}</T>
            <Chars x={214} y={y} cur={r.after} />
            <T x={290} y={y + 12} size={12} fill={moved ? tok('accent') : tok('muted')} weight={moved ? 700 : 400}>{moved ? 'moved on' : 'unchanged'}</T>
          </g>
        );
      })}
      <T x={6} y={246} size={11} fill={tok('muted')}>Every row starts with current = 1, just after reading “&lt;”.</T>
    </Svg>
  );
}
