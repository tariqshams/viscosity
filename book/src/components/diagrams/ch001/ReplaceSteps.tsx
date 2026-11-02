import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function double(n) {
  return n * 2;
}

const t = double(3) + double(4);
console.log(t);`;

/** One piece of the expression being worked out; `hot` marks the part
 *  JavaScript is working on right now. */
type Part = { text: string; hot?: boolean };
type S = { line: number; expr: Part[]; inside?: string; t?: number; out?: string; note: string };

const STATES: S[] = [
  { line: 0, expr: [], note: 'JavaScript reads the definition of double and puts it on the shelf. Nothing is worked out yet: there is no n, and no answer.' },
  { line: 4, expr: [{ text: 'double(3)', hot: true }, { text: ' + double(4)' }], note: 'To give t a value, JavaScript works out the right-hand side from left to right, so the first thing it meets is the call double(3).' },
  { line: 1, expr: [{ text: 'double(3)', hot: true }, { text: ' + double(4)' }], inside: 'n = 3, so n * 2 is 6', note: 'The call hands the argument 3 to the parameter n and runs the body. return n * 2 works out to 6.' },
  { line: 4, expr: [{ text: '6', hot: true }, { text: ' + double(4)' }], note: 'return sends 6 back, and the call double(3) is replaced by the value 6, exactly as if you had typed 6 there yourself.' },
  { line: 1, expr: [{ text: '6 + ' }, { text: 'double(4)', hot: true }], inside: 'n = 4, so n * 2 is 8', note: 'Now the second call runs the same body with a different argument: this time n is 4, and the answer is 8.' },
  { line: 4, expr: [{ text: '6 + ' }, { text: '8', hot: true }], note: 'The second call is replaced by 8. What is left is plain arithmetic, with no calls in it.' },
  { line: 4, expr: [{ text: '14', hot: true }], t: 14, note: '6 + 8 is 14, and that number is stored in t. The two calls have finished; only their answers were used.' },
  { line: 5, expr: [{ text: '14' }], t: 14, out: '14', note: 'console.log(t) prints 14. (console.log is itself a function: you have been calling functions all along.)' },
];

export default function ReplaceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A call becomes its value" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={120} title="The right-hand side of the assignment, rewritten as each call is replaced by the value it returns">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>WORKING OUT THE RIGHT-HAND SIDE</T>
        <Box x={4} y={24} w={392} h={40} fill={tok('panel')} stroke={tok('ink', 0.4)}>
          {st.expr.length ? (
            <text x={16} y={45} fontSize={17} className="mono" dominantBaseline="middle">
              {st.expr.map((p, k) => (
                <tspan key={k} fill={p.hot ? tok('brand') : undefined} fontWeight={p.hot ? 700 : 400}>{p.text}</tspan>
              ))}
            </text>
          ) : (
            <T x={200} y={44} size={12} anchor="middle" fill={tok('muted')}>nothing to work out yet</T>
          )}
        </Box>
        {st.inside && (
          <T x={8} y={84} size={13} mono fill={tok('f1')} weight={700}>inside the call: {st.inside}</T>
        )}
        {st.t !== undefined && <T x={8} y={106} size={14} mono>t = {st.t}</T>}
        {st.out && <T x={392} y={106} size={13} mono anchor="end">prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
