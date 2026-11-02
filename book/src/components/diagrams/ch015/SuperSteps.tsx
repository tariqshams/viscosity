import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class Node {
  constructor(line) {
    this.line = line;
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
}
const n = new Num(3, 42);`;

type S = {
  line: number;
  running: null | 'Num' | 'Node';
  obj: null | { line?: number; value?: number };
  named?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: 11, running: null, obj: null, note: 'new Num(3, 42) asks for a new Num. Num extends Node, so a Num is a Node with something extra, and both constructors will take part.' },
  { line: 6, running: 'Num', obj: null, note: 'Num’s constructor starts, with line = 3 and value = 42. There is no object for this to mean yet: in a subclass, the parent builds the object first.' },
  { line: 7, running: 'Num', obj: null, note: 'super(line) calls the parent’s constructor, Node’s, handing it 3. Num’s constructor waits on this line until Node’s is finished.' },
  { line: 2, running: 'Node', obj: { line: 3 }, note: 'Node’s constructor runs on the new object and stores this.line = 3. It knows nothing about value; that part is Num’s job.' },
  { line: 8, running: 'Num', obj: { line: 3, value: 42 }, note: 'Back in Num’s constructor, after super(line). Now this is ready, so this.value = 42 adds the extra property.' },
  { line: 11, running: null, obj: { line: 3, value: 42 }, named: true, note: 'The finished object is stored in n: one object with both properties, made by Num and set up by both constructors, parent first.' },
];

export default function SuperSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hot = (c: 'Num' | 'Node') => st.running === c;
  return (
    <StepFrame title="new Num(3, 42): the parent goes first" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Which constructor is running, and the object being built">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>RUNNING NOW</T>
        {(['Num', 'Node'] as const).map((c, k) => (
          <Box key={c} x={4} y={24 + k * 56} w={150} h={44} r={6}
            fill={hot(c) ? tok('brand', 0.12) : 'transparent'}
            stroke={hot(c) ? tok('brand') : tok('line')} dash={!hot(c)}>
            <T x={79} y={46 + k * 56} size={13} mono weight={700} anchor="middle"
              fill={hot(c) ? tok('brand') : tok('muted')}>{c}’s constructor</T>
          </Box>
        ))}
        {st.running === 'Node' && <Arrow x1={79} y1={68} x2={79} y2={80} color={tok('brand')} />}
        <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>
          {st.named ? 'THE OBJECT, NOW IN n' : 'THE NEW OBJECT'}
        </T>
        <Box x={196} y={24} w={198} h={100} r={8} dash={!st.obj}
          fill={st.obj ? tok('panel') : 'transparent'} stroke={st.obj ? tok('ink', 0.5) : tok('line')}>
          {st.obj ? (
            <>
              <Field x={208} y={40} label="line" v={st.obj.line} c="f1" />
              <Field x={208} y={78} label="value" v={st.obj.value} c="f3" />
            </>
          ) : (
            <T x={295} y={74} size={12} anchor="middle" fill={tok('muted')}>not made yet</T>
          )}
        </Box>
        {st.named && <T x={295} y={140} size={12} anchor="middle" fill={tok('brand')}>n instanceof Num and Node</T>}
      </Svg>
    </StepFrame>
  );
}

function Field({ x, y, label, v, c }: { x: number; y: number; label: string; v?: number; c: string }) {
  const has = v !== undefined;
  return (
    <g>
      <rect x={x} y={y} width={174} height={28} rx={3}
        fill={has ? tok(c, 0.85) : 'transparent'} stroke={has ? 'none' : tok('line')}
        strokeDasharray={has ? undefined : '5 4'} />
      <T x={x + 10} y={y + 14.5} size={13} mono weight={700} fill={has ? tok('panel') : tok('muted')}>
        {has ? `${label}: ${v}` : `${label}: (not yet)`}
      </T>
    </g>
  );
}
