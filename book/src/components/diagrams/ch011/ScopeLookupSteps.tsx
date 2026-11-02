import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const rate = 2;
function price(n) {
  if (n > 9) {
    const extra = 1;
    return n * rate + extra;
  }
  return n * rate;
}
price(10);`;

type Room = 'block' | 'fn' | 'prog';
type S = { line: number; fn: boolean; block: boolean; name?: string; checked: Room[]; found?: Room; value?: string; note: string };

const STATES: S[] = [
  { line: 8, fn: true, block: false, checked: [], note: 'price(10) is called. Its page (a scope) opens inside the program’s scope, holding n = 10.' },
  { line: 2, fn: true, block: false, name: 'n', checked: ['fn'], found: 'fn', value: '10', note: 'n > 9 needs n. The search starts in the innermost scope, the function’s, and finds n there at once: 10.' },
  { line: 3, fn: true, block: true, checked: [], note: 'The if’s braces open a block scope inside the function’s scope, and const extra = 1 is written there.' },
  { line: 4, fn: true, block: true, name: 'n', checked: ['block', 'fn'], found: 'fn', value: '10', note: 'Now n is looked up from inside the block: not in the block, so step outward to the function’s scope, which has it.' },
  { line: 4, fn: true, block: true, name: 'rate', checked: ['block', 'fn', 'prog'], found: 'prog', value: '2', note: 'rate: not in the block, not in the function, so out again to the program’s scope, which has it: 2.' },
  { line: 4, fn: true, block: true, name: 'extra', checked: ['block'], found: 'block', value: '1', note: 'extra is in the very first scope searched. The answer is 10 × 2 + 1 = 21.' },
  { line: 8, fn: false, block: false, checked: [], note: 'The call returns 21, and its scopes are thrown away. Out here, only rate and price remain; n and extra cannot be looked up from the program at all.' },
];

export default function ScopeLookupSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = (r: Room) => (st.found === r ? tok('safe') : st.checked.includes(r) ? tok('danger') : undefined);
  return (
    <StepFrame title="Looking a name up, scope by scope" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="Three nested scopes, the program, the function price and the if block, and the search for a name moving outward through them">
        <Box x={4} y={4} w={392} h={154} r={10} fill={tok('accent', 0.06)} stroke={col('prog') ?? tok('accent')}>
          <T x={16} y={20} size={11} weight={700} fill={tok('accent')}>PROGRAM SCOPE</T>
          <T x={16} y={40} size={13} mono>rate = 2</T>
          <T x={120} y={40} size={13} mono>price = (a function)</T>
          {st.fn && (
            <Box x={16} y={54} w={368} h={94} r={8} fill={tok('brand', 0.07)} stroke={col('fn') ?? tok('brand')}>
              <T x={28} y={70} size={11} weight={700} fill={tok('brand')}>price’s SCOPE</T>
              <T x={28} y={90} size={13} mono>n = 10</T>
              {st.block && (
                <Box x={150} y={64} w={222} h={74} r={6} fill={tok('safe', 0.08)} stroke={col('block') ?? tok('safe')}>
                  <T x={162} y={80} size={11} weight={700} fill={tok('safe')}>if BLOCK SCOPE</T>
                  <T x={162} y={102} size={13} mono>extra = 1</T>
                </Box>
              )}
            </Box>
          )}
        </Box>
        {st.name ? (
          <T x={6} y={176} size={12} mono>
            looking up <tspan fontWeight={700}>{st.name}</tspan>: {st.checked.map((r) => (r === 'block' ? 'block' : r === 'fn' ? 'function' : 'program')).join(' → ')}
            {st.value && <tspan fill={tok('safe')} fontWeight={700}>{`, found ${st.value}`}</tspan>}
          </T>
        ) : (
          <T x={6} y={176} size={12} fill={tok('muted')}>{st.fn ? 'no lookup on this step' : 'no call running'}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
