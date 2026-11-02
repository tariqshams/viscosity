// Chapter 82: super is found in an environment made when the subclass was
// declared, so it names the superclass of the class the method was
// written in, not the superclass of the instance's class.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class A {
  m() { print "A.m"; }
}
class B < A {
  m() {
    print "B.m";
    super.m();
  }
}
class C < B {}
C().m();`;

type S = {
  line: number;
  classes: number; // how many of A, B, C exist
  superEnv?: boolean;
  inst?: boolean;
  find?: 'B' | 'A';
  thisEnv?: boolean;
  call?: boolean;
  hop?: boolean;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 0, classes: 1, note: 'class A: an ordinary class with one method. Its methods capture the globals.' },
  { line: 3, classes: 2, superEnv: true, note: 'class B < A: the interpreter evaluates A and checks it is a class. Then it makes a new environment holding super = A, and declares B’s methods inside it. So B.m captures that environment.' },
  { line: 9, classes: 3, superEnv: true, note: 'class C < B gets a super environment of its own (super = B), but C has no methods, so nothing captures it.' },
  { line: 10, classes: 3, superEnv: true, inst: true, find: 'B', note: 'C().m: the instance has no field m. findMethod asks C (no m), then C’s superclass B: found. Inheritance is just this walk up the superclass links.' },
  { line: 10, classes: 3, superEnv: true, inst: true, thisEnv: true, call: true, out: 'B.m', note: 'B.m is bound to the C instance as usual: a this-environment whose parent is B.m’s closure, the super environment. The call prints B.m.' },
  { line: 6, classes: 3, superEnv: true, inst: true, thisEnv: true, call: true, hop: true, out: 'B.m', note: 'super.m(): the resolver recorded distance 2. Two hops from the call: this-environment, then super environment. super = A. And this is one hop less: distance 1.' },
  { line: 6, classes: 3, superEnv: true, inst: true, thisEnv: true, call: true, hop: true, find: 'A', out: 'B.m, A.m', note: 'A.findMethod(m) finds A.m, which is bound to the same C instance and called. Prints A.m. Had super meant “the superclass of this’s class”, it would have been B, and B.m would call itself forever.' },
];

export default function SuperSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hot = tok('brand');
  const cls = ['A', 'B', 'C'].slice(0, st.classes);
  return (
    <StepFrame title="Looking up super" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={254} title="Environments on the left: the call, the this-environment, the super environment and the globals. Classes on the right: C inherits from B, which inherits from A, and the C instance.">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>ENVIRONMENTS</T>
        <T x={236} y={10} size={11} weight={700} fill={tok('muted')}>CLASSES (↓ superclass)</T>
        {cls.map((c, k) => {
          const y = 22 + (2 - k) * 52;
          const on = st.find === c;
          const methods = c === 'C' ? '(no methods)' : 'm()';
          return (
            <g key={c}>
              <Box x={236} y={y} w={110} h={38} fill={on ? tok('brand', 0.16) : tok('panel')} stroke={on ? hot : tok('line')}>
                <T x={244} y={y + 12} size={11} weight={700} fill={tok('muted')}>class {c}</T>
                <T x={244} y={y + 28} size={12} mono>{methods}</T>
              </Box>
              {k > 0 && <Arrow x1={290} y1={y + 38} x2={290} y2={y + 52} />}
            </g>
          );
        })}
        {st.inst && (
          <>
            <Box x={236} y={190} w={110} h={34} stroke={tok('ink', 0.5)}>
              <T x={244} y={207} size={12} mono>C instance</T>
            </Box>
            <Arrow x1={346} y1={200} x2={348} y2={44} bend={-0.3} />
          </>
        )}
        {st.call && (
          <>
            <Box x={6} y={22} w={200} h={34} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={14} y={39} size={11} weight={700} fill={tok('accent')}>B.m call (running)</T>
            </Box>
            <Arrow x1={60} y1={56} x2={60} y2={72} color={st.hop ? hot : tok('ink', 0.7)} />
            {st.hop && <T x={212} y={39} size={11} mono fill={hot}>0</T>}
          </>
        )}
        {st.thisEnv && (
          <>
            <Box x={6} y={74} w={200} h={40} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={14} y={87} size={11} weight={700} fill={tok('safe')}>bind environment</T>
              <T x={14} y={104} size={13} mono>this = C instance</T>
            </Box>
            <Arrow x1={60} y1={114} x2={60} y2={132} color={st.hop ? hot : tok('ink', 0.7)} />
            {st.hop && <T x={212} y={94} size={11} mono fill={hot}>1</T>}
          </>
        )}
        {st.superEnv && (
          <>
            <Box x={6} y={134} w={200} h={40} fill={st.hop ? tok('brand', 0.16) : tok('panel')} stroke={st.hop ? hot : tok('ink', 0.5)}>
              <T x={14} y={147} size={11} weight={700} fill={tok('muted')}>made by class B</T>
              <T x={14} y={164} size={13} mono>super = A</T>
            </Box>
            <Arrow x1={60} y1={174} x2={60} y2={192} />
            {st.hop && <T x={212} y={154} size={11} mono fill={hot}>2</T>}
          </>
        )}
        <Box x={6} y={194} w={200} h={40}>
          <T x={14} y={207} size={11} weight={700} fill={tok('muted')}>globals</T>
          <T x={14} y={224} size={13} mono>{cls.join(', ')}</T>
        </Box>
        {st.out && <T x={6} y={248} size={12} mono fill={tok('muted')}>printed: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
