import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function square(x) {
  return x * x;
}
function hypot(a, b) {
  const s = square(a) + square(b);
  return Math.sqrt(s);
}
console.log(hypot(3, 4));`;

/** One call's page: which function, its variables, and what it is returning. */
type Page = { fn: string; vars: [string, number | undefined][]; ret?: number };
type S = { line: number; pages: Page[]; out?: string; note: string };

const H = (s?: number): Page => ({ fn: 'hypot', vars: [['a', 3], ['b', 4], ['s', s]] });

const STATES: S[] = [
  { line: 7, pages: [], note: 'The last line calls hypot(3, 4). Both definitions are on the shelf, but no call is running yet, so there are no pages.' },
  { line: 3, pages: [H()], note: 'hypot gets a fresh page: a = 3 and b = 4. Its local variable s has no value yet.' },
  { line: 0, pages: [H(), { fn: 'square', vars: [['x', 3]] }], note: 'square(a) is a call, so square gets its own page on top, with x = 3. hypot’s page waits underneath, unchanged.' },
  { line: 1, pages: [H(), { fn: 'square', vars: [['x', 3]], ret: 9 }], note: 'square returns 3 * 3 = 9.' },
  { line: 0, pages: [H(), { fn: 'square', vars: [['x', 4]] }], note: 'That page is thrown away, and square(a) has become 9. Now square(b) runs on a brand-new page, where x = 4. The old x = 3 is gone for good.' },
  { line: 1, pages: [H(), { fn: 'square', vars: [['x', 4]], ret: 16 }], note: 'square returns 4 * 4 = 16.' },
  { line: 4, pages: [H(25)], note: 'Back on hypot’s page, the line is now 9 + 16, so s = 25. hypot never saw either x; it only got the two answers.' },
  { line: 5, pages: [{ ...H(25), ret: 5 }], note: 'Math.sqrt(s) is a call too (to a function built into JavaScript), and it gives 5. hypot returns 5.' },
  { line: 7, pages: [], out: '5', note: 'hypot’s page is thrown away as well, and console.log prints 5. Three calls ran, three pages came and went, and no names clashed.' },
];

export default function NestedCalls() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Calls inside calls: a pile of pages" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The pages of the calls that are running, the newest on top">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>PAGES OF RUNNING CALLS (newest on top)</T>
        {st.pages.length === 0 && (
          <Box x={4} y={24} w={392} h={100} dash fill="transparent" stroke={tok('line')}>
            <T x={200} y={74} size={12} anchor="middle" fill={tok('muted')}>no call running</T>
          </Box>
        )}
        {st.pages.map((p, d) => {
          const top = d === st.pages.length - 1;
          const y = 78 - d * 54;
          return (
            <g key={d} opacity={top ? 1 : 0.55}>
              <Box x={4 + d * 16} y={y} w={300} h={46} fill={top ? tok('brand', 0.08) : tok('panel')} stroke={top ? tok('brand') : tok('line')}>
                <T x={16 + d * 16} y={y + 23} size={13} mono weight={700}>{p.fn}</T>
                {p.vars.map(([n, v], k) => (
                  <T key={n} x={86 + d * 16 + k * 72} y={y + 23} size={13} mono>{n} = {v === undefined ? '?' : v}</T>
                ))}
              </Box>
              {p.ret !== undefined && <T x={316 + d * 16} y={y + 23} size={13} mono weight={700} fill={tok('brand')}>→ {p.ret}</T>}
              {!top && <T x={316 + d * 16} y={y + 23} size={11} fill={tok('muted')}>waiting</T>}
            </g>
          );
        })}
        {st.out && <T x={8} y={142} size={13} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
