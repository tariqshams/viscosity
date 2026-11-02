// Chapter 138: a chunk being filled, one instruction at a time, for
//   print 1.5 + 2;
//   print "hi";
// The bytes, lines and constants are the real ones the companion compiler
// (companion/ts/src/vm/compiler.ts) produces, checked with
// disassembleFunction: const takes a two-byte constant number.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = [0, 0, 0, 0, 0, 1, 20, 33, 0, 0, 2, 33, 1, 49];
const LINES = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2];
const CONSTS = ['1.5', '2', '"hi"'];
// which byte positions are operands (the two bytes of a constant number)
const OPERAND = new Set([1, 2, 4, 5, 9, 10]);

type S = { upto: number; from: number; pool: number; link?: [number, number]; label: string; note: string };

const STATES: S[] = [
  { upto: 0, from: 0, pool: 0, label: '', note: 'A new, empty chunk: three arrays. code will hold the bytes, lines the source line of each byte, and constants the values the code refers to.' },
  { upto: 3, from: 0, pool: 1, link: [2, 0], label: "const 0 '1.5'", note: 'The number 1.5 takes eight bytes in memory, far too big for one byte of code, so it goes into the constant pool, at index 0. The code gets three bytes: opcode 0 (const), then the index 0 written as two bytes, 0 and 0.' },
  { upto: 6, from: 3, pool: 2, link: [5, 1], label: "const 1 '2'", note: 'The same for 2: it lands at index 1 of the pool, and the two operand bytes say 0, 1. Constants are numbered in the order they were added.' },
  { upto: 7, from: 6, pool: 2, label: 'add', note: 'add needs no operand: it always uses the two newest values. One byte, 20. Every byte so far came from line 1, and lines has a 1 for each of them.' },
  { upto: 8, from: 7, pool: 2, label: 'print', note: 'print is one byte too, 33. That finishes the first statement: eight bytes, eight line numbers.' },
  { upto: 11, from: 8, pool: 3, link: [10, 2], label: "const 2 'hi'", note: 'The string "hi" also goes in the pool, at index 2. These bytes came from line 2, and the lines array records that, byte by byte.' },
  { upto: 12, from: 11, pool: 3, label: 'print', note: 'The second print.' },
  { upto: 14, from: 12, pool: 3, label: 'none, return', note: 'The compiler ends every script with none and return (opcodes 1 and 49), so the VM has a tidy place to stop.' },
  { upto: 14, from: 14, pool: 3, label: '', note: 'Finished: 14 bytes of code, 14 line numbers (one per byte) and 3 constants. On their own the bytes are hard to read; a disassembler turns them back into text.' },
];

const BW = 25;
const GAP = 2.5;
const bx = (k: number) => 8 + k * (BW + GAP);

export default function ChunkSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Filling a chunk" steps={s} note={st.note}>
      <pre className="code-surface !my-0 !border-line font-mono">{'print 1.5 + 2;\nprint "hi";'}</pre>
      <Svg w={400} h={232} title="A chunk for print 1.5 + 2; print hi. The code array holds 0 0 0 0 0 1 20 33 0 0 2 33 1 49, the lines array eight 1s then six 2s, and the constant pool holds 1.5, 2 and hi. Each const operand points to a slot in the pool.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>code</T>
        <T x={392} y={12} size={11} anchor="end" fill={tok('muted')}>offset above each byte</T>
        {CODE.map((b, k) => {
          const shown = k < st.upto;
          const fresh = k >= st.from && k < st.upto;
          const operand = OPERAND.has(k);
          return (
            <g key={k}>
              <T x={bx(k) + BW / 2} y={28} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
              <Box x={bx(k)} y={36} w={BW} h={26} r={3}
                fill={!shown ? tok('panel') : fresh ? tok('brand', 0.22) : operand ? tok('accent', 0.12) : tok('brand', 0.08)}
                stroke={!shown ? tok('line') : fresh ? tok('brand') : operand ? tok('accent') : tok('brand', 0.6)} dash={!shown} />
              {shown && <T x={bx(k) + BW / 2} y={50} size={12} mono anchor="middle" weight={operand ? 400 : 700}>{b}</T>}
            </g>
          );
        })}
        <T x={8} y={80} size={11} weight={700} fill={tok('muted')}>lines</T>
        {LINES.map((l, k) => (
          <g key={k}>
            <Box x={bx(k)} y={88} w={BW} h={22} r={3} fill={k < st.upto ? tok('panel') : tok('panel', 0.4)} stroke={k < st.upto ? tok('ink', 0.4) : tok('line')} dash={k >= st.upto} />
            {k < st.upto && <T x={bx(k) + BW / 2} y={100} size={12} mono anchor="middle" fill={tok('muted')}>{l}</T>}
          </g>
        ))}
        {st.label && (
          <T x={8} y={128} size={12} mono weight={700} fill={tok('brand')}>{`just written: ${st.label}`}</T>
        )}
        <T x={8} y={150} size={11} weight={700} fill={tok('muted')}>constants (the pool)</T>
        {CONSTS.map((c, k) => {
          const x = 8 + k * 96;
          const shown = k < st.pool;
          const linked = st.link?.[1] === k;
          return (
            <g key={k}>
              <Box x={x} y={190} w={88} h={30} r={4}
                fill={linked ? tok('accent', 0.22) : shown ? tok('accent', 0.08) : tok('panel')}
                stroke={linked ? tok('accent') : shown ? tok('accent', 0.6) : tok('line')} dash={!shown} />
              <T x={x + 6} y={205} size={11} mono fill={tok('muted')}>{`[${k}]`}</T>
              {shown && <T x={x + 52} y={205} size={14} mono anchor="middle">{c}</T>}
            </g>
          );
        })}
        {st.link && (
          <Arrow x1={bx(st.link[0]) + BW / 2} y1={64} x2={8 + st.link[1] * 96 + 44} y2={188} color={tok('accent')} bend={0.15} />
        )}
      </Svg>
    </StepFrame>
  );
}
