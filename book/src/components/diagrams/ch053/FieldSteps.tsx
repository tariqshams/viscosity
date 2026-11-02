import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// What happens to one field, x, in two classes that differ by one TypeScript
// line. Based on the repo's --trace-generalization observation (FINDINGS.md
// section 4) and the V8 blog's description of field representations.
const CODE_A = `class P {
  x: number; // a real field
  constructor(x: number) {
    this.x = x;
  }
}
const p = new P(0.5);
p.x += 0.1;`;

const CODE_B = `class K {
  declare x: number; // no field
  constructor(x: number) {
    this.x = x;
  }
}
const p = new K(0.5);
p.x += 0.1;`;

type S = {
  cls: 'P' | 'K'; line: number; rep: string; repColor: string;
  x: string; boxes: { v: string; dead?: boolean }[]; to: number | null; note: string;
};

const STATES: S[] = [
  { cls: 'P', line: 6, rep: '—', repColor: 'muted', x: '', boxes: [], to: null, note: 'Every object starts with a header: a pointer to its hidden class (its shape), then pointers to its properties store and its elements store. Fields come after.' },
  { cls: 'P', line: 1, rep: 'heap object', repColor: 'warn', x: 'undefined', boxes: [], to: null, note: 'Before the constructor body runs, the class field x is created and set to undefined. undefined is not a number, so V8 records the field as holding a heap object.' },
  { cls: 'P', line: 3, rep: 'tagged', repColor: 'danger', x: 'address', boxes: [{ v: '0.5' }], to: 0, note: 'Now this.x = 0.5 stores a double into a heap-object field. V8 generalises the field to “tagged”: it may hold anything, and a double is kept in a separate HeapNumber.' },
  { cls: 'P', line: 7, rep: 'tagged', repColor: 'danger', x: 'address', boxes: [{ v: '0.5', dead: true }, { v: '0.6' }], to: 1, note: 'p.x += 0.1 makes a brand-new HeapNumber, because HeapNumbers are immutable. Every update of every particle allocates, and that is what makes this class slow.' },
  { cls: 'K', line: 6, rep: '—', repColor: 'muted', x: '', boxes: [], to: null, note: 'Now the same class with declare x. TypeScript emits nothing for that line, so there is no field until the constructor stores one.' },
  { cls: 'K', line: 3, rep: 'double', repColor: 'safe', x: 'address', boxes: [{ v: '0.5' }], to: 0, note: 'The first value x ever holds is a double, so the field gets the double representation. The value lives in a box that belongs to this object alone.' },
  { cls: 'K', line: 7, rep: 'double', repColor: 'safe', x: 'address', boxes: [{ v: '0.6' }], to: 0, note: 'Because nobody else can see that box, V8 can overwrite it in place. No allocation per update, and the loop stays fast.' },
];

export default function FieldSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const words = ['hidden class', 'properties', 'elements'];
  return (
    <StepFrame title="One TypeScript line, two field representations" steps={s} note={st.note}>
      <CodeTrace code={st.cls === 'P' ? CODE_A : CODE_B} line={st.line} />
      <Svg w={400} h={200} title="The object p as four words: hidden class, properties, elements, and the field x. The hidden class records x's representation. x may point to HeapNumber boxes on the right.">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>OBJECT p</T>
        <T x={262} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        {words.map((w, k) => (
          <Box key={w} x={10} y={24 + k * 34} w={170} h={30} r={3} fill={tok('ink', 0.06)} stroke={tok('ink', 0.3)}>
            <T x={20} y={39 + k * 34} size={12} mono fill={tok('muted')}>{w}</T>
          </Box>
        ))}
        <Box x={10} y={126} w={170} h={30} r={3} fill={st.x ? tok('f1', 0.15) : tok('panel')} stroke={tok('f1')} dash={!st.x}>
          <T x={20} y={141} size={13} mono weight={700} fill={tok('f1')}>x</T>
          <T x={44} y={141} size={12} mono>{st.x || '(not yet)'}</T>
        </Box>
        <T x={10} y={178} size={12}>x’s representation:</T>
        <T x={136} y={178} size={13} mono weight={700} fill={tok(st.repColor)}>{st.rep}</T>
        {st.boxes.map((b, k) => (
          <Box key={k} x={262} y={60 + k * 52} w={128} h={36} r={6} fill={tok('brand', b.dead ? 0.03 : 0.12)} stroke={b.dead ? tok('ink', 0.25) : tok('brand')} dash={b.dead}>
            <T x={270} y={71 + k * 52} size={9} fill={tok('muted')}>{st.rep === 'double' ? 'box owned by p' : 'HeapNumber'}{b.dead ? ' (garbage)' : ''}</T>
            <T x={270} y={86 + k * 52} size={13} mono opacity={b.dead ? 0.4 : 1}>{b.v}</T>
          </Box>
        ))}
        {st.to !== null && <Arrow x1={182} y1={141} x2={260} y2={78 + st.to * 52} />}
      </Svg>
    </StepFrame>
  );
}
