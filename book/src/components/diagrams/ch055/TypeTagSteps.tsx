import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let a = 1;
let b = 2;
print a + b;
b = "2";
print a + b;`;

type V = { type: 'number' | 'string'; text: string };
type S = {
  line: number; a?: V; b?: V; check?: 'ok' | 'fail';
  out: string[]; error?: string; note: string;
};

const ONE: V = { type: 'number', text: '1' };
const TWO: V = { type: 'number', text: '2' };
const STR: V = { type: 'string', text: '"2"' };

const STATES: S[] = [
  { line: 0, a: ONE, out: [], note: 'let a = 1 makes a variable and puts the value 1 in it. The variable has no type of its own. The value does: it carries a tag that says “number”.' },
  { line: 1, a: ONE, b: TWO, out: [], note: 'b holds another number, 2, with its own tag.' },
  { line: 2, a: ONE, b: TWO, check: 'ok', out: ['3'], note: 'To run +, the interpreter first reads both tags. Number and number: add them. print shows 3.' },
  { line: 3, a: ONE, b: STR, out: ['3'], note: 'b = "2" puts a string into the same variable. Nothing objects. In Drip, a variable can hold any kind of value, and the kind can change.' },
  { line: 4, a: ONE, b: STR, check: 'fail', out: ['3'], error: 'Operands must be two numbers or two strings.', note: 'Now + reads the tags again: number and string. Neither rule fits, so the program stops with a runtime error on line 5. Notice that line 3 already ran and printed 3: the problem was found only when this line ran.' },
];

function Val({ x, y, v, name }: { x: number; y: number; v?: V; name: string }) {
  const col = v?.type === 'string' ? 'accent' : 'brand';
  return (
    <g>
      <Box x={x} y={y} w={44} h={40} stroke={tok('ink', 0.5)}>
        <T x={x + 22} y={y + 20} size={17} mono weight={700} anchor="middle">{name}</T>
      </Box>
      {v && (
        <g>
          <Arrow x1={x + 46} y1={y + 20} x2={x + 74} y2={y + 20} width={1.5} />
          <Box x={x + 76} y={y} w={96} h={40} r={6} fill={tok(col, 0.12)} stroke={tok(col)}>
            <T x={x + 84} y={y + 13} size={10} mono weight={700} fill={tok(col)}>{v.type}</T>
            <T x={x + 84} y={y + 29} size={15} mono weight={700}>{v.text}</T>
          </Box>
        </g>
      )}
    </g>
  );
}

export default function TypeTagSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Types travel with values" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="Variables a and b point at values that carry a type tag. The + operator reads both tags before it does anything.">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>VARIABLES AND THEIR VALUES</T>
        <Val x={10} y={26} v={st.a} name="a" />
        <Val x={10} y={80} v={st.b} name="b" />
        {st.check && (
          <g>
            <Box x={222} y={40} w={170} h={66} r={8} fill={st.check === 'ok' ? tok('safe', 0.12) : tok('danger', 0.12)} stroke={st.check === 'ok' ? tok('safe') : tok('danger')}>
              <T x={307} y={58} size={12} weight={700} anchor="middle">+ checks the tags</T>
              <T x={307} y={78} size={11} mono anchor="middle">{st.a?.type} + {st.b?.type}</T>
              <T x={307} y={95} size={12} weight={700} anchor="middle" fill={st.check === 'ok' ? tok('safe') : tok('danger')}>{st.check === 'ok' ? '→ add: 3' : '→ no rule fits'}</T>
            </Box>
          </g>
        )}
        <T x={10} y={146} size={13} mono fill={tok('muted')}>output: {st.out.join(', ')}</T>
        {st.error && <T x={10} y={170} size={12} mono weight={700} fill={tok('danger')}>{st.error}</T>}
      </Svg>
    </StepFrame>
  );
}
