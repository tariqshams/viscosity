// One line of the running example, sumsq, on its way down: Drip source,
// VIR, RISC-V assembly, machine code. Encodings checked with llvm-mc 18.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { label: string; lines: string[]; how: string; color: string }[] = [
  { label: 'Drip', lines: ['s += i * i;'], how: 'lowering (Part VI)', color: 'f1' },
  { label: 'VIR', lines: ['%7 = binop * %3, %3', '%8 = binop + %6, %7'], how: 'choose instructions, registers', color: 'f2' },
  { label: 'assembly', lines: ['mul t2, t1, t1', 'add t0, t0, t2'], how: 'the assembler', color: 'f3' },
  { label: 'machine code', lines: ['b3 03 63 02', 'b3 82 72 00'], how: '', color: 'f4' },
];

export default function JourneyFigure() {
  return (
    <Svg w={400} h={300} title="The Drip statement s += i * i becomes two VIR instructions, then two RISC-V instructions, then eight bytes of machine code">
      {ROWS.map((r, k) => {
        const y = 6 + k * 74;
        const h = r.lines.length === 1 ? 34 : 50;
        return (
          <g key={r.label}>
            <T x={8} y={y + h / 2} size={11} weight={700} fill={tok('muted')}>{r.label.toUpperCase()}</T>
            <Box x={110} y={y} w={180} h={h} fill={tok(r.color, 0.16)} stroke={tok(r.color)}>
              {r.lines.map((l, j) => <T key={j} x={122} y={y + 17 + j * 17} size={12} mono>{l}</T>)}
            </Box>
            {r.how && (
              <>
                <Arrow x1={200} y1={y + h + 2} x2={200} y2={y + 72} />
                <T x={210} y={y + h + 13} size={11} fill={tok('muted')}>{r.how}</T>
              </>
            )}
          </g>
        );
      })}
    </Svg>
  );
}
