import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 291: the two litmus tests and whether their surprising outcome
// can happen under each model.
const ROWS = [
  { name: 'SB', code: ['x=1; r1=y', 'y=1; r2=x'], odd: 'r1=0, r2=0', cells: ['no', 'yes', 'yes'] },
  { name: 'MP', code: ['data=1; flag=1', 'r1=flag; r2=data'], odd: 'r1=1, r2=0', cells: ['no', 'no', 'yes'] },
];
const COLS = ['SC', 'x86', 'Arm'];

export default function LitmusTable() {
  return (
    <Svg w={400} h={180} title="Store buffering: the outcome r1 = 0 and r2 = 0 is impossible under SC but possible on x86 and Arm. Message passing: r1 = 1 and r2 = 0 is impossible under SC and on x86 but possible on weakly ordered hardware such as Arm">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>TEST AND ITS SURPRISE</T>
      {COLS.map((c, j) => (
        <T key={c} x={268 + j * 44} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
      ))}
      {ROWS.map((r, i) => {
        const y = 24 + i * 72;
        return (
          <g key={r.name}>
            <Box x={8} y={y} w={232} h={62}>
              <T x={16} y={y + 14} size={12} weight={700}>{r.name}</T>
              <T x={50} y={y + 14} size={11} mono>{`T1: ${r.code[0]}`}</T>
              <T x={50} y={y + 31} size={11} mono>{`T2: ${r.code[1]}`}</T>
              <T x={16} y={y + 50} size={11} fill={tok('muted')}>{`surprise: ${r.odd}`}</T>
            </Box>
            {r.cells.map((c, j) => (
              <Box key={j} x={250 + j * 44} y={y + 16} w={36} h={28} fill={c === 'yes' ? tok('danger', 0.15) : tok('safe', 0.15)} stroke={c === 'yes' ? tok('danger') : tok('safe')}>
                <T x={268 + j * 44} y={y + 30} size={11} anchor="middle">{c}</T>
              </Box>
            ))}
          </g>
        );
      })}
      <T x={8} y={172} size={11} fill={tok('muted')}>"yes": the hardware may produce the surprise.</T>
    </Svg>
  );
}
