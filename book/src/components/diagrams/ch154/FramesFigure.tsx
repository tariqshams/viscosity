// Chapter 154: at the deepest moment of
//   fn sq(x) { return x * x; }  fn f(y) { return sq(y) + 1; }  print f(3);
// three frames exist, and each frame's ip points into its OWN function's
// bytecode (real offsets from the companion's disassembler).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Row = { fn: string; ip: number; slots: number; lines: [string, string][]; hl: number };

const ROWS: Row[] = [
  { fn: 'sq', ip: 0, slots: 3, lines: [['0000', 'load.local 1'], ['0002', 'load.local 1'], ['0004', 'mul']], hl: 0 },
  { fn: 'f', ip: 7, slots: 1, lines: [['0005', 'call 1'], ['0007', "const 1 '1'"], ['0010', 'add']], hl: 1 },
  { fn: 'script', ip: 20, slots: 0, lines: [['0018', 'call 1'], ['0020', 'print'], ['0021', 'none']], hl: 1 },
];

const RH = 64;

export default function FramesFigure() {
  return (
    <Svg w={400} h={232} title="Three frame records, newest on top: sq with ip 0, f with ip 7, and the script with ip 20. Each record's ip points at the next instruction in that function's own bytecode: sq's first instruction, f's const 1 after its call, and the script's print after its call.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>FRAMES (newest on top)</T>
      <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>EACH FUNCTION’S OWN BYTECODE</T>
      {ROWS.map((r, k) => {
        const y = 24 + k * RH;
        const top = k === 0;
        return (
          <g key={r.fn}>
            <Box x={8} y={y} w={150} h={52} fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('line')}>
              <T x={18} y={y + 16} size={12.5} mono weight={700}>{r.fn}</T>
              <T x={18} y={y + 36} size={11.5} mono>ip {r.ip} · slots {r.slots}</T>
            </Box>
            <Box x={200} y={y} w={192} h={52} fill={tok('panel')} stroke={tok('line')}>
              {r.lines.map(([off, ins], i) => (
                <g key={off}>
                  {i === r.hl && <rect x={202} y={y + 3 + i * 15.5} width={188} height={15} rx={3} fill={tok('brand', 0.16)} />}
                  <T x={208} y={y + 11 + i * 15.5} size={11} mono fill={tok('muted')}>{off}</T>
                  <T x={246} y={y + 11 + i * 15.5} size={11} mono weight={i === r.hl ? 700 : 400}>{ins}</T>
                </g>
              ))}
            </Box>
            <Arrow x1={158} y1={y + 36} x2={200} y2={y + 11 + r.hl * 15.5} color={tok('brand')} />
          </g>
        );
      })}
      <T x={8} y={222} size={11.5}>Each frame’s ip is a bookmark in its own function.</T>
    </Svg>
  );
}
