import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The container class Viscosity emits for `ps` with records {x, vx}
// (containerClass in engine/ts/packages/frontend-js/src/emit.ts), exactly
// as `viscosity build` prints it, with each member reflowed onto several
// lines to fit a phone. Nothing else is changed.
const CODE = `class __Vsc_ps {
  constructor(cap = 16) {
    this.length = 0; this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  static of(...v) {
    const c = new __Vsc_ps(
      Math.max(16, v.length / 2));
    for (let i = 0; i < v.length; i += 2)
      c.push(v[i + 0], v[i + 1]);
    return c;
  }
  push(v0, v1) {
    const n = this.length;
    if (n === this.cap) this.grow();
    this.x[n] = v0; this.vx[n] = v1;
    return (this.length = n + 1);
  }
  grow() { … }
}`;

type S = { line: number | null; members: string[]; note: string };

const STATES: S[] = [
  { line: 0, members: [], note: 'One class per transformed collection, named __Vsc_ plus the collection’s name. The __Vsc_ prefix is there so it cannot clash with a name in your program.' },
  { line: 2, members: ['length = 0', 'cap = 16'], note: 'The constructor sets two counters: length, how many elements are in use (0), and cap, how many slots each column has room for (16 unless told otherwise).' },
  { line: 3, members: ['length = 0', 'cap = 16', 'x: Float64Array(16)'], note: 'Then one column per field. x is provably always a number, so it gets a Float64Array: 16 raw doubles side by side, all starting at 0.' },
  { line: 4, members: ['length = 0', 'cap = 16', 'x: Float64Array(16)', 'vx: Float64Array(16)'], note: 'The same for vx. The columns are named after the fields, so the program can later read ps.x[i] and ps.vx[i].' },
  { line: 13, members: ['length = 0', 'cap = 16', 'x: Float64Array(16)', 'vx: Float64Array(16)'], note: 'push takes one value per field, in the shape’s field order: v0 is x, v1 is vx. So ps.push({ x: i, vx: 1 }) in your program becomes ps.push(i, 1).' },
  { line: 15, members: ['length = 0', 'cap = 16', 'x: Float64Array(16)', 'vx: Float64Array(16)'], note: 'If every slot is used, grow() first makes bigger columns (the chapter Growing collections takes it apart). Usually there is room, and this line does nothing.' },
  { line: 16, members: ['length = 0', 'cap = 16', 'x: [0, …]', 'vx: [1, …]'], note: 'The values go into slot n of every column: the same index in each. That shared index is what keeps a record’s fields together after its object is gone.' },
  { line: 17, members: ['length = 1', 'cap = 16', 'x: [0, …]', 'vx: [1, …]'], note: 'length goes up by one, and the new length is returned, exactly as Array.prototype.push returns it, so code that used the result still gets the same number.' },
  { line: 6, members: ['length = 1', 'cap = 16', 'x: [0, …]', 'vx: [1, …]'], note: 'static of replaces an array literal: [{x: 1, vx: 2}, {x: 3, vx: 4}] becomes __Vsc_ps.of(1, 2, 3, 4), every field of every record, flattened, and pushed two at a time.' },
];

export default function ContainerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The generated container, member by member" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={128} title="The container object's members after this step">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>A NEW __Vsc_ps OBJECT HOLDS</T>
        <Box x={6} y={22} w={388} h={100} dash={st.members.length === 0} fill={st.members.length ? tok('brand', 0.06) : 'transparent'} stroke={st.members.length ? tok('brand') : tok('line')}>
          {st.members.length === 0 && <T x={200} y={72} size={12} anchor="middle" fill={tok('muted')}>nothing yet: a class is only a recipe</T>}
          {st.members.map((m, k) => {
            const col = k === 2 ? tok('f1') : k === 3 ? tok('f3') : undefined;
            return <T key={k} x={20 + (k % 2) * 190} y={46 + Math.floor(k / 2) * 40} size={13} mono fill={col}>{m}</T>;
          })}
        </Box>
      </Svg>
    </StepFrame>
  );
}
