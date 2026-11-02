import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 319-b: the steps of a Proxy's [[Get]] in the ECMAScript
// specification, followed for one read that the trap tries to change.
const CODE = `const t = { n: 5 };
Object.defineProperty(t, 'id',
  { value: 1 }); // fixed for good
const p = new Proxy(t, {
  get: (o, k) => k === 'id' ? 2 : o[k] * 10,
});
p.n;   // 50
p.id;  // TypeError`;

type S = { line: number | null; step: string; val?: string; bad?: boolean; ok?: boolean; note: string };

const STATES: S[] = [
  { line: 6, step: 'find the trap', note: 'p.n is a [[Get]] on a proxy. First step in the specification: look up "get" on the handler. There is one; had there been none, the read would go straight to the target.' },
  { line: 6, step: 'call the trap', val: '50', note: 'Call the trap with the target and the key. It returns o.n * 10, which is 50.' },
  { line: 6, step: 'check, return', val: '50', ok: true, note: 'Then the check: is n on the target non-configurable and non-writable? No, it is an ordinary property, so the proxy may report anything. The read gives 50.' },
  { line: 7, step: 'call the trap', val: '2', note: 'p.id: the trap returns 2. But defineProperty made id non-writable and non-configurable (its defaults), with value 1.' },
  { line: 7, step: 'TypeError', val: '2', bad: true, note: 'Object.is(2, 1) is false, so [[Get]] throws: "property \'id\' is a read-only and non-configurable data property on the proxy target but the proxy did not return its actual value". A promise made by the target cannot be broken by a proxy.' },
];

export default function ProxySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A proxy's [[Get]], step by step" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={70} title="The current step of the proxy get algorithm and the value the trap returned">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STEP</T>
        <Box x={8} y={22} w={200} h={30} fill={st.bad ? tok('danger', 0.12) : st.ok ? tok('safe', 0.12) : tok('brand', 0.1)} stroke={st.bad ? tok('danger') : st.ok ? tok('safe') : tok('brand')}>
          <T x={108} y={37} size={12} mono anchor="middle">{st.step}</T>
        </Box>
        <T x={232} y={12} size={11} weight={700} fill={tok('muted')}>TRAP RETURNED</T>
        <Box x={232} y={22} w={80} h={30} dash={!st.val}>
          <T x={272} y={37} size={13} mono anchor="middle">{st.val ?? ''}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
