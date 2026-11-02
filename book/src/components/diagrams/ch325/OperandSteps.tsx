import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 325: element_uses and describe_use from
// engine/rust/crates/core/src/analysis.rs on a small program. The VIR
// instructions are from a real print_func listing; the messages are the
// real `viscosity explain` output, in the order it prints them (the
// collection worklist pops the last load first, chapter 323).
const SRC = `const ps = [];
for (let i = 0; i < 99; i++)
  ps.push({ x: i });
const box = {};
box.k = ps[1];
ps[2][0] = 5;
const t = [];
t[ps[3]] = 1;`;

type S = { line: number | null; op: string; args: string[]; hit: number | null; why: string; msg: string; ok?: boolean; note: string };

const STATES: S[] = [
  { line: 7, op: 'index.set', args: ['%25 (t)', '%28 (ps[3])', '%29 (1)'], hit: 1, why: 'used as an index at line 8', msg: 'line 8: an element is used as an index', note: 'Elements are checked in the order their index.gets were found, and the worklist found ps[3] first. Its use is an index.set, and the element is operand 1, the index: “used as an index”.' },
  { line: 7, op: 'index.set', args: ['%25 (t)', '%28 (ps[3])', '%29 (1)'], hit: 1, why: 'used as an index at line 8', msg: 'line 8: an element is used as an index', note: 'The message starts with the element’s own line, “line 8: an element is …”, so element_uses strips the trailing “ at line 8” rather than saying it twice.' },
  { line: 5, op: 'index.set', args: ['%19 (ps[2])', '%20 (0)', '%21 (5)'], hit: 0, why: 'written with an index store at line 6', msg: 'line 6: an element is written with an index store', note: 'ps[2][0] = 5 is ALSO an index.set. This time the element is operand 0, the thing being indexed: “written with an index store”. Same instruction kind, different operand, different reason.' },
  { line: 4, op: 'field.set .k', args: ['%12 (box)', '%15 (ps[1])'], hit: 1, why: 'stored into an object property at line 5', msg: 'line 5: an element is stored into an object property', note: 'box.k = ps[1]: a field.set where the element is operand 1, the value. Writing ps[1].k would be operand 0, and allowed if k were a field. Here the element gets a second home, in box: an alias.' },
  { line: 7, op: 'index.set', args: ['%25 (t)', '%28 (ps[3])', '%29 (1)'], hit: 0, why: 'written with an index store at line 8', msg: 'the array is written with an index store at line 8', ok: true, note: 't is a candidate too (it is given []), and the same instruction is a use of t as operand 0. For the array the reason is prefixed “the array is”, and the line stays.' },
];

export default function OperandSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const w = 120;
  return (
    <StepFrame title="Same instruction, different operand" steps={s} note={st.note}>
      <CodeTrace code={SRC} line={st.line} />
      <Svg w={400} h={150} title="A VIR instruction with its operands, the one being described highlighted, and the reason explain gives">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>USE</T>
        <T x={44} y={12} size={12} mono weight={700}>{st.op}</T>
        {st.args.map((a, k) => {
          const on = st.hit === k;
          return (
            <Box key={k} x={8 + k * (w + 8)} y={24} w={w} h={26} fill={on ? tok('brand', 0.16) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
              <T x={8 + k * (w + 8) + w / 2} y={37} size={11.5} mono anchor="middle" weight={on ? 700 : 400}>{a}</T>
            </Box>
          );
        })}
        <T x={8} y={64} size={10.5} fill={tok('muted')}>operand {st.hit} is the value being described</T>
        <T x={8} y={88} size={11} weight={700} fill={tok('muted')}>describe_use</T>
        <T x={8} y={104} size={11.5} mono>{st.why}</T>
        <T x={8} y={124} size={11} weight={700} fill={tok('muted')}>explain</T>
        <T x={8} y={140} size={11} mono fill={st.ok ? tok('accent') : tok('danger')}>{st.msg}</T>
      </Svg>
    </StepFrame>
  );
}
