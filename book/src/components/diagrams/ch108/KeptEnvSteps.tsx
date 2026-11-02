// Chapter 108: a Drip function keeps the environment it was declared in,
// and that environment outlives the call that made it.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn makeCounter() {
  let n = 0;
  fn count() {
    n += 1;
    return n;
  }
  return count;
}
let a = makeCounter();
print a();
print a();`;

type S = {
  line: number;
  g: string[];
  e1?: { rows: string[]; live: boolean };
  fn?: boolean;
  e2?: string;
  find?: boolean;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 0, g: ['makeCounter = fn …'], note: 'Declaring makeCounter makes a DripFunction. Its closure field is the environment that was current at that moment: the globals.' },
  { line: 8, g: ['makeCounter = fn …'], e1: { rows: [], live: true }, note: 'Calling makeCounter() makes a fresh environment for the call. Its parent is makeCounter’s closure, the globals.' },
  { line: 1, g: ['makeCounter = fn …'], e1: { rows: ['n = 0'], live: true }, note: 'let n = 0 defines n in the call’s environment.' },
  { line: 2, g: ['makeCounter = fn …'], e1: { rows: ['n = 0', 'count = fn count'], live: true }, fn: true, note: 'Declaring count makes a second DripFunction. The current environment is now the call’s, so that is what count stores as its closure.' },
  { line: 8, g: ['makeCounter = fn …', 'a = fn count'], e1: { rows: ['n = 0', 'count = fn count'], live: false }, fn: true, note: 'makeCounter returns. The interpreter goes back to the globals, but the call’s environment is not lost: count’s closure still points at it.' },
  { line: 9, g: ['makeCounter = fn …', 'a = fn count'], e1: { rows: ['n = 0', 'count = fn count'], live: false }, fn: true, e2: 'a() call', note: 'a() makes a new environment for this call. Its parent is count’s closure, the kept environment, not the globals and not the caller.' },
  { line: 3, g: ['makeCounter = fn …', 'a = fn count'], e1: { rows: ['n = 1', 'count = fn count'], live: false }, fn: true, e2: 'a() call', find: true, out: '1', note: 'n is not in the call’s environment, so the lookup follows the parent link one step and finds it in the kept one. n becomes 1.' },
  { line: 10, g: ['makeCounter = fn …', 'a = fn count'], e1: { rows: ['n = 2', 'count = fn count'], live: false }, fn: true, e2: 'second a() call', find: true, out: '1, 2', note: 'The second call gets its own new environment, with the same parent. Same n, so it prints 2. The memory lives in the kept environment, not in any call.' },
];

export default function KeptEnvSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const e1c = st.e1?.live ? tok('accent') : tok('safe');
  return (
    <StepFrame title="The environment a closure keeps alive" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={250} title="Environments as boxes with parent arrows; the count function points at the environment of the makeCounter call">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>ENVIRONMENTS</T>
        <T x={226} y={10} size={11} weight={700} fill={tok('muted')}>FUNCTION VALUES</T>
        <Box x={6} y={22} w={196} h={22 + st.g.length * 20}>
          <T x={16} y={36} size={11} weight={700} fill={tok('muted')}>globals</T>
          {st.g.map((r, k) => <T key={r} x={16} y={56 + k * 20} size={13} mono>{r}</T>)}
        </Box>
        {st.e1 && (
          <>
            <Box x={6} y={120} w={196} h={62} fill={st.find ? tok('brand', 0.14) : st.e1.live ? tok('accent', 0.1) : tok('safe', 0.1)} stroke={e1c}>
              <T x={16} y={134} size={11} weight={700} fill={e1c}>makeCounter call {st.e1.live ? '(running)' : '(kept)'}</T>
              {st.e1.rows.map((r, k) => <T key={r} x={16} y={154 + k * 20} size={13} mono>{r}</T>)}
            </Box>
            <Arrow x1={60} y1={120} x2={60} y2={24 + 22 + st.g.length * 20} />
            <T x={66} y={106} size={11} fill={tok('muted')}>parent</T>
          </>
        )}
        {st.fn && (
          <>
            <Box x={226} y={128} w={166} h={46} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={236} y={143} size={13} mono weight={700}>{'fn count'}</T>
              <circle cx={238} cy={162} r={4} fill={tok('brand')} />
              <T x={248} y={162} size={11} fill={tok('muted')}>closure</T>
            </Box>
            <Arrow x1={236} y1={162} x2={204} y2={160} color={tok('brand')} />
          </>
        )}
        {st.e2 && (
          <>
            <Box x={6} y={206} w={196} h={36} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={16} y={224} size={11} weight={700} fill={tok('accent')}>{st.e2} (running)</T>
            </Box>
            <Arrow x1={140} y1={206} x2={140} y2={184} color={st.find ? tok('brand') : tok('ink', 0.7)} />
          </>
        )}
        {st.out && <T x={226} y={224} size={13} mono fill={tok('muted')}>printed: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
