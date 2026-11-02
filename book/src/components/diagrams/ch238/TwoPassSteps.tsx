// Chapter 238: a two-pass assembler on a small RISC-V function. Pass 1
// gives every line an address and records the labels; pass 2 encodes, now
// that a forward branch's target is known. Bytes are llvm-mc's output.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type L = { text: string; addr: number; label?: boolean; bytes?: string; off?: string };
const LINES: L[] = [
  { text: 'sumsq:', addr: 0, label: true },
  { text: '  li   a2, 0', addr: 0 },
  { text: '  blez a1, done', addr: 4, bytes: '63 5e b0 00', off: 'done − 0x04 = +28' },
  { text: 'loop:', addr: 8, label: true },
  { text: '  ld   a3, 0(a0)', addr: 8 },
  { text: '  mul  a3, a3, a3', addr: 12 },
  { text: '  add  a2, a2, a3', addr: 16 },
  { text: '  addi a0, a0, 8', addr: 20 },
  { text: '  addi a1, a1, -1', addr: 24 },
  { text: '  bnez a1, loop', addr: 28, bytes: 'e3 96 05 fe', off: 'loop − 0x1c = −20' },
  { text: 'done:', addr: 32, label: true },
  { text: '  mv   a0, a2', addr: 32 },
  { text: '  ret', addr: 36 },
];
const hex = (n: number) => '0x' + n.toString(16).padStart(2, '0');

type S = { upto: number; pass: 1 | 2; enc?: number; note: string };
const STATES: S[] = [
  { upto: -1, pass: 1, note: 'Pass 1 walks the lines only to count bytes. Every base RISC-V instruction is 4 bytes, so the counter goes up by 4 per instruction; a label takes no space, it just names the current address.' },
  { upto: 2, pass: 1, note: 'blez a1, done needs the address of done, which has not been seen yet: a forward reference. Pass 1 does not care: it only notes that this instruction takes 4 bytes.' },
  { upto: 3, pass: 1, note: 'The label loop: is reached when the counter is 0x08, so loop = 0x08 goes into the symbol table.' },
  { upto: 10, pass: 1, note: 'On to done:, at 0x20. Pass 1 ends with every label known: sumsq = 0x00, loop = 0x08, done = 0x20.' },
  { upto: 12, pass: 2, note: 'Pass 2 walks the lines again, this time writing bytes. Most instructions need nothing but the encoding tables.' },
  { upto: 12, pass: 2, enc: 2, note: 'blez a1, done: a branch stores the distance to its target, done − here = 0x20 − 0x04 = 28. Encoded, that is 63 5e b0 00, exactly what llvm-mc produced.' },
  { upto: 12, pass: 2, enc: 9, note: 'bnez a1, loop jumps backwards: 0x08 − 0x1c = −20, encoded as e3 96 05 fe. Backward targets were known in pass 1 anyway; it is the forward ones that need the second pass.' },
];

export default function TwoPassSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const known = LINES.filter((l, k) => l.label && k <= st.upto);
  const RH = 19;
  return (
    <StepFrame title="Two passes over the same lines" steps={s} note={st.note}>
      <Svg w={400} h={272} title="The assembly lines with the address of each instruction, a symbol table of labels found so far, and the encoded bytes of the two branches.">
        <T x={8} y={10} size={11} weight={700} fill={st.pass === 1 ? tok('brand') : tok('accent')}>{`PASS ${st.pass}`}</T>
        {LINES.map((l, k) => {
          const y = 22 + k * RH;
          const seen = k <= st.upto;
          const hot = st.enc === k;
          return (
            <g key={k} opacity={seen || st.upto < 0 ? 1 : 0.4}>
              {hot && <Box x={4} y={y - 2} w={214} h={RH} r={3} fill={tok('accent', 0.15)} stroke={tok('accent')} />}
              {!l.label && <T x={8} y={y + 7} size={11} mono fill={tok('muted')}>{seen ? hex(l.addr) : ''}</T>}
              <T x={44} y={y + 7} size={12} mono weight={l.label ? 700 : undefined}>{l.text}</T>
            </g>
          );
        })}
        <T x={232} y={10} size={11} weight={700} fill={tok('muted')}>SYMBOL TABLE</T>
        <Box x={228} y={18} w={168} h={70} fill={tok('panel')} stroke={tok('line')}>
          {known.map((l, k) => (
            <T key={l.text} x={238} y={34 + k * 18} size={12} mono>{`${l.text.replace(':', '')} = ${hex(l.addr)}`}</T>
          ))}
        </Box>
        {st.enc !== undefined && (
          <g>
            <T x={232} y={112} size={11} weight={700} fill={tok('accent')}>OFFSET</T>
            <T x={232} y={130} size={12} mono>{LINES[st.enc].off}</T>
            <T x={232} y={156} size={11} weight={700} fill={tok('accent')}>BYTES</T>
            <T x={232} y={174} size={13} mono weight={700}>{LINES[st.enc].bytes}</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
