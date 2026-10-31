import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function area(w, h) {
  const a = w * h;
  return a;
}

const r = area(3, 4);
console.log(r);`;

type S = { line: number; page: null | { w?: number; h?: number; a?: number; returning?: boolean }; r?: number; out?: string; note: string };

const STATES: S[] = [
  { line: 0, page: null, note: 'JavaScript reads the function first, but nothing runs yet. A function definition is a recipe on a shelf: written down, not cooked.' },
  { line: 5, page: null, note: 'Line 6 calls area with the arguments 3 and 4. JavaScript is about to run the recipe.' },
  { line: 0, page: { w: 3, h: 4 }, note: 'The call opens a fresh page. The parameters w and h are written on it, holding the arguments: w = 3, h = 4.' },
  { line: 1, page: { w: 3, h: 4, a: 12 }, note: 'The body runs on that page. The local variable a = 3 × 4 = 12 lives only here.' },
  { line: 2, page: { w: 3, h: 4, a: 12, returning: true }, note: 'return a hands the value 12 back to whoever called. The function stops here.' },
  { line: 5, page: null, r: 12, note: 'The page is thrown away: w, h and a are gone. Only the returned value survives, and it is stored in r.' },
  { line: 6, page: null, r: 12, out: '12', note: 'console.log(r) prints 12.' },
];

export default function CallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What happens during a call" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={120} title="The call's page of local variables, and the outer variable r">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>THE CALL’S PAGE (only while area runs)</T>
        <Box x={4} y={24} w={250} h={88} dash={!st.page} fill={st.page ? tok('brand', 0.08) : 'transparent'} stroke={st.page ? tok('brand') : tok('line')}>
          {st.page ? (
            <>
              <Var x={16} y={42} name="w" value={st.page.w} />
              <Var x={96} y={42} name="h" value={st.page.h} />
              <Var x={176} y={42} name="a" value={st.page.a} />
              {st.page.returning && <T x={16} y={98} size={12} weight={700} fill={tok('brand')}>returning 12 →</T>}
            </>
          ) : (
            <T x={129} y={68} size={12} anchor="middle" fill={tok('muted')}>no call running</T>
          )}
        </Box>
        <T x={276} y={14} size={11} weight={700} fill={tok('muted')}>OUTSIDE</T>
        <Var x={276} y={42} name="r" value={st.r} />
        {st.out && <T x={276} y={98} size={13} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}

function Var({ x, y, name, value }: { x: number; y: number; name: string; value?: number }) {
  return (
    <g>
      <T x={x} y={y} size={13} mono weight={700}>{name}</T>
      <Box x={x} y={y + 10} w={64} h={30} fill={value === undefined ? 'transparent' : tok('panel')} stroke={value === undefined ? tok('line') : tok('ink', 0.5)} dash={value === undefined}>
        <T x={x + 32} y={y + 25.5} size={15} mono anchor="middle">{value === undefined ? '' : String(value)}</T>
      </Box>
    </g>
  );
}
