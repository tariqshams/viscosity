// Chapter 73: how a runtime error finds its source line. The bytes and
// lines are the real ones the companion compiler makes for
//   print 1;
//   print 2 +
//     -"a";
// (checked with disassembleFunction). neg fails at offset 10; by then ip
// has moved on to 11, so the VM reads lines[ip - 1], which is 3
// (companion/ts/src/vm/vm.ts, runtimeError).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = [0, 0, 0, 33, 0, 0, 1, 0, 0, 2, 32, 20, 33, 1, 49];
const LINES = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 2, 3, 3, 3];
const OPCODE = new Set([0, 3, 4, 7, 10, 11, 12, 13, 14]);
const FAIL = 10;
const BW = 23;
const bx = (k: number) => 8 + k * 25.5;

export default function ErrorLine() {
  const cx = bx(FAIL) + BW / 2;
  return (
    <Svg w={400} h={232} title="The code and lines arrays for a three-line program. The neg instruction at offset 10 fails; ip has already moved to 11, so the VM reads lines at ip minus 1, which is 3, and reports: runtime error: cannot negate a string, at line 3 in script.">
      <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>offset</T>
      {CODE.map((_, k) => (
        <T key={k} x={bx(k) + BW / 2} y={26} size={11} mono anchor="middle" fill={k === FAIL ? tok('accent') : tok('muted')}>{k}</T>
      ))}
      <T x={8} y={44} size={11} weight={700} fill={tok('muted')}>code</T>
      {CODE.map((b, k) => (
        <g key={k}>
          <Box x={bx(k)} y={52} w={BW} h={24} r={3}
            fill={k === FAIL ? tok('accent', 0.22) : OPCODE.has(k) ? tok('brand', 0.08) : tok('panel')}
            stroke={k === FAIL ? tok('accent') : tok('line')} />
          <T x={bx(k) + BW / 2} y={65} size={11} mono anchor="middle" weight={OPCODE.has(k) ? 700 : 400}>{b}</T>
        </g>
      ))}
      <T x={8} y={94} size={11} weight={700} fill={tok('muted')}>lines</T>
      {LINES.map((l, k) => (
        <g key={k}>
          <Box x={bx(k)} y={102} w={BW} h={22} r={3} fill={k === FAIL ? tok('accent', 0.22) : tok('panel')} stroke={k === FAIL ? tok('accent') : tok('line')} />
          <T x={bx(k) + BW / 2} y={114} size={11} mono anchor="middle" fill={k === FAIL ? tok('ink') : tok('muted')}>{l}</T>
        </g>
      ))}
      <polygon points={`${bx(FAIL + 1) + BW / 2},${80} ${bx(FAIL + 1) + BW / 2 - 6},${90} ${bx(FAIL + 1) + BW / 2 + 6},${90}`} fill={tok('brand')} />
      <T x={bx(FAIL + 1) + BW / 2 + 10} y={88} size={11} mono weight={700} fill={tok('brand')}>ip = 11</T>
      <T x={8} y={146} size={12}>neg at offset 10 fails: a string cannot be negated</T>
      <T x={8} y={166} size={12} mono>{'lines[ip - 1] = lines[10] = 3'}</T>
      <Arrow x1={cx} y1={126} x2={cx} y2={134} color={tok('accent')} />
      <Box x={8} y={182} w={384} h={42} r={4} fill={tok('paper')} stroke={tok('line')} />
      <T x={16} y={196} size={12} mono>runtime error: cannot negate a string</T>
      <T x={16} y={213} size={12} mono>{'  at line 3 in script'}</T>
    </Svg>
  );
}
