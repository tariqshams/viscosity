import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}
const a = makeCounter();
a();
a();
const b = makeCounter();
b();`;

type Page = { count?: number; live: boolean };
type S = {
  line: number;
  p1?: Page;
  p2?: Page;
  fa?: boolean;
  fb?: boolean;
  va?: boolean;
  vb?: boolean;
  running?: 'a' | 'b';
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 0, note: 'The definition is put on the shelf. Nothing runs yet.' },
  { line: 7, p1: { live: true }, note: 'makeCounter() is called, so a fresh page opens for this call, just like in chapter 2.' },
  { line: 1, p1: { count: 0, live: true }, note: 'let count = 0 writes count on that page.' },
  { line: 2, p1: { count: 0, live: true }, fa: true, note: 'The arrow function is created HERE, inside the call. It keeps an arrow to the page it was written in. That pairing is a closure.' },
  { line: 7, p1: { count: 0, live: false }, fa: true, va: true, note: 'makeCounter returns the function, and a points at it. The call is over, but its page is NOT thrown away: the function still points at it.' },
  { line: 8, p1: { count: 1, live: false }, fa: true, va: true, running: 'a', out: '1', note: 'a() runs the body. It finds count by following its arrow to the kept page, and adds 1. It returns 1.' },
  { line: 9, p1: { count: 2, live: false }, fa: true, va: true, running: 'a', out: '2', note: 'a() again. Same page, so count was remembered: now it is 2.' },
  { line: 10, p1: { count: 2, live: false }, p2: { count: 0, live: false }, fa: true, va: true, fb: true, vb: true, note: 'A second call to makeCounter opens a SECOND page with its own count = 0. b’s function is tied to that page.' },
  { line: 11, p1: { count: 2, live: false }, p2: { count: 1, live: false }, fa: true, va: true, fb: true, vb: true, running: 'b', out: '1', note: 'b() returns 1. a’s count is still 2. Two closures, two private pages, no sharing.' },
];

export default function ClosureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A function that keeps its page" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="Variables a and b point at function objects, and each function points at the page where it was created">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>NAMES</T>
        <T x={96} y={12} size={11} weight={700} fill={tok('muted')}>FUNCTIONS</T>
        <T x={262} y={12} size={11} weight={700} fill={tok('muted')}>PAGES</T>
        <Row y={50} name="a" v={st.va} f={st.fa} page={st.p1} label="page 1" hot={st.running === 'a'} />
        <Row y={128} name="b" v={st.vb} f={st.fb} page={st.p2} label="page 2" hot={st.running === 'b'} />
        {st.out && <T x={6} y={170} size={13} mono fill={tok('muted')}>returned: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}

function Row({ y, name, v, f, page, label, hot }: { y: number; name: string; v?: boolean; f?: boolean; page?: Page; label: string; hot: boolean }) {
  return (
    <g>
      {v && (
        <>
          <Box x={6} y={y - 16} w={46} h={32} stroke={tok('ink', 0.5)}>
            <T x={18} y={y} size={15} mono weight={700}>{name}</T>
            <circle cx={42} cy={y} r={4} fill={tok('ink', 0.8)} />
          </Box>
          <Arrow x1={44} y1={y} x2={94} y2={y} />
        </>
      )}
      {f && (
        <>
          <Box x={96} y={y - 18} w={120} h={36} r={6} fill={hot ? tok('brand', 0.2) : tok('brand', 0.08)} stroke={tok('brand')}>
            <T x={106} y={y} size={13} mono>{'() => {…}'}</T>
            <circle cx={204} cy={y} r={4} fill={tok('brand')} />
          </Box>
          <Arrow x1={206} y1={y} x2={258} y2={y} color={tok('brand')} />
        </>
      )}
      {page && (
        <Box x={260} y={y - 30} w={132} h={60} r={6} fill={page.live ? tok('accent', 0.12) : tok('safe', 0.1)} stroke={page.live ? tok('accent') : tok('safe')}>
          <T x={270} y={y - 16} size={11} weight={700} fill={page.live ? tok('accent') : tok('safe')}>{label}{page.live ? ' (call running)' : ' (kept)'}</T>
          <T x={270} y={y + 10} size={15} mono>count = <tspan fontWeight={700} fill={tok('brand')}>{page.count === undefined ? '' : page.count}</tspan></T>
        </Box>
      )}
    </g>
  );
}
