// Chapter 142: the arithmetic of a forward jump (patch_jump) and a
// backward one (emit_loop), measured from the byte after the operand,
// which is where the VM's ip is when it adds or subtracts. Numbers are
// from the while loop in the chapter (drip-rs --disassemble).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CELL = 34;

function Cell({ x, y, label, sub, fill, stroke }: { x: number; y: number; label: string; sub: string; fill?: string; stroke?: string }) {
  return (
    <g>
      <Box x={x} y={y} w={CELL - 2} h={26} r={3} fill={fill ?? tok('panel')} stroke={stroke ?? tok('line')}>
        <T x={x + (CELL - 2) / 2} y={y + 13} size={11} mono anchor="middle">{label}</T>
      </Box>
      <T x={x + (CELL - 2) / 2} y={y + 38} size={11} mono anchor="middle" fill={tok('muted')}>{sub}</T>
    </g>
  );
}

export default function JumpMath() {
  return (
    <Svg w={400} h={236} title="A forward jump is measured from the end of its operand to the end of the code; a backward loop from the end of its operand back to the loop's start">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>FORWARD: patch_jump(at = 14)</T>
      <Cell x={8} y={24} label="j.u" sub="13" />
      <Cell x={8 + CELL} y={24} label="00" sub="at" fill={tok('brand', 0.14)} stroke={tok('brand')} />
      <Cell x={8 + CELL * 2} y={24} label="12" sub="15" fill={tok('brand', 0.14)} stroke={tok('brand')} />
      <Box x={8 + CELL * 3} y={24} w={150} h={26} r={3} dash>
        <T x={8 + CELL * 3 + 75} y={37} size={11} anchor="middle" fill={tok('muted')}>the body, 18 bytes</T>
      </Box>
      <Cell x={268} y={24} label="…" sub="34" fill={tok('safe', 0.14)} stroke={tok('safe')} />
      <T x={110} y={62} size={11} mono anchor="middle" fill={tok('muted')}>16 = at + 2</T>
      <Arrow x1={110} y1={74} x2={284} y2={74} color={tok('brand')} />
      <T x={8} y={92} size={12} mono>jump = len − (at + 2) = 34 − 16 = 18</T>

      <T x={8} y={124} size={11} weight={700} fill={tok('muted')}>BACKWARD: emit_loop(loop_start = 6)</T>
      <Cell x={8} y={136} label="ld" sub="6" fill={tok('safe', 0.14)} stroke={tok('safe')} />
      <Box x={8 + CELL} y={136} w={150} h={26} r={3} dash>
        <T x={8 + CELL + 75} y={149} size={11} anchor="middle" fill={tok('muted')}>condition and body</T>
      </Box>
      <Cell x={196} y={136} label="loop" sub="31" />
      <Cell x={196 + CELL} y={136} label="00" sub="32" fill={tok('accent', 0.14)} stroke={tok('accent')} />
      <Cell x={196 + CELL * 2} y={136} label="1c" sub="33" fill={tok('accent', 0.14)} stroke={tok('accent')} />
      <T x={300} y={184} size={11} mono anchor="middle" fill={tok('muted')}>ip = 34</T>
      <Arrow x1={300} y1={196} x2={24} y2={196} color={tok('accent')} />
      <T x={8} y={216} size={12} mono>offset = (32 + 2) − 6 = 28</T>
      <T x={8} y={230} size={11} fill={tok('muted')}>(32 is code.len() just after the loop opcode)</T>
    </Svg>
  );
}
