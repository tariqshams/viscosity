// Chapter 227: let, let mut and shadowing, drawn as named boxes. A plain
// let box is locked; a mut box is open; shadowing makes a NEW box with the
// same name and greys the old one out. One step shows the compiler
// rejecting an assignment to a locked box.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let x = 5;
x = 6;          // rejected
let mut n = 0;
n += 1;
n += 1;
let x = x * 10; // shadowing
let x = "fifty";`;

type Slot = { name: string; val: string; ty: string; mut?: boolean; old?: boolean; hl?: boolean; bad?: boolean };
type S = { line: number; slots: Slot[]; note: string };

const x1: Slot = { name: 'x', val: '5', ty: 'i32' };
const n0: Slot = { name: 'n', val: '0', ty: 'i32', mut: true };

const STATES: S[] = [
  { line: 0, slots: [{ ...x1, hl: true }], note: 'let x = 5 makes a box called x holding 5. Without mut, the box is locked: like const in TypeScript, x can never be given another value.' },
  { line: 1, slots: [{ ...x1, bad: true }], note: 'x = 6 tries to put a new value in the locked box. This never runs: rustc stops with “cannot assign twice to immutable variable `x`”. Delete this line to carry on.' },
  { line: 2, slots: [x1, { ...n0, hl: true }], note: 'let mut n = 0 makes an unlocked box. mut is Rust’s way of saying what TypeScript’s let says: this value will change.' },
  { line: 3, slots: [x1, { ...n0, val: '1', hl: true }], note: 'n += 1 changes the value inside the same box. Same box, new contents.' },
  { line: 4, slots: [x1, { ...n0, val: '2', hl: true }], note: 'And again: n is now 2.' },
  { line: 5, slots: [{ ...x1, old: true }, { ...n0, val: '2' }, { name: 'x', val: '50', ty: 'i32', hl: true }], note: 'let x = x * 10 does NOT change the locked box. It builds a NEW box, also called x, from the old value. From here on, the name x means the new box. This is shadowing.' },
  { line: 6, slots: [{ ...x1, old: true }, { ...n0, val: '2' }, { name: 'x', val: '50', ty: 'i32', old: true }, { name: 'x', val: '"fifty"', ty: '&str', hl: true }], note: 'Because each let makes a new box, the new x may even have a different type: here, text. mut could never do that: a mut box keeps its type forever.' },
];

export default function BindingSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Locked boxes, open boxes, new boxes" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={118} title="Variables as boxes: locked without mut, open with mut, new ones for shadowing">
        {st.slots.map((v, k) => {
          const x = 6 + k * 98;
          const col = v.bad ? tok('danger') : v.mut ? tok('safe') : tok('accent');
          return (
            <g key={k} opacity={v.old ? 0.35 : 1}>
              <T x={x + 44} y={12} size={14} mono weight={700} anchor="middle">{v.name}</T>
              <Box x={x} y={22} w={88} h={50} r={6} fill={v.hl ? tok('brand', 0.15) : tok('panel')} stroke={v.hl ? tok('brand') : col}>
                <T x={x + 44} y={44} size={v.val.length > 4 ? 13 : 18} mono weight={700} anchor="middle" fill={tok('f1')}>{v.val}</T>
                <T x={x + 44} y={63} size={10} mono anchor="middle" fill={tok('muted')}>{v.ty}</T>
              </Box>
              <T x={x + 44} y={86} size={10.5} anchor="middle" fill={col} weight={700}>{v.bad ? '✕ locked' : v.mut ? 'mut: open' : 'locked'}</T>
              {v.old && <T x={x + 44} y={102} size={10} anchor="middle" fill={tok('muted')}>shadowed</T>}
            </g>
          );
        })}
        {st.slots.some((v) => v.bad) && <T x={300} y={47} size={13} mono fill={tok('danger')} anchor="middle">x = 6 ✕</T>}
      </Svg>
    </StepFrame>
  );
}
