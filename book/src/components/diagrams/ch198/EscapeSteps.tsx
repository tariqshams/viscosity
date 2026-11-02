import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Viscosity's escape check, one use at a time: every use of the array, and
// every use of an element it hands out, is either one it can rewrite or an
// escape site. The program and the bailout text are real (viscosity explain).
const CODE = `const ps = [];
for (let i = 0; i < 100; i++)
  ps.push({ x: i, vx: 1 });
for (let i = 0; i < ps.length; i++)
  ps[i].x += ps[i].vx;
console.log(ps[3]);`;

type Verdict = 'wait' | 'ok' | 'elem' | 'esc';
type Row = { who: 'array' | 'element'; use: string; kind: string };

const ROWS: Row[] = [
  { who: 'array', use: 'ps.push({...})', kind: 'push' },
  { who: 'array', use: 'ps.length', kind: 'length' },
  { who: 'array', use: 'ps[i]', kind: 'index.get' },
  { who: 'element', use: 'ps[i].x  (read, write)', kind: 'field' },
  { who: 'element', use: 'ps[i].vx', kind: 'field.get' },
  { who: 'array', use: 'ps[3]', kind: 'index.get' },
  { who: 'element', use: 'console.log(ps[3])', kind: 'call' },
];

type S = { line: number | null; v: Verdict[]; note: string; end?: 'aos' | 'soa' };
const W: Verdict = 'wait';

const STATES: S[] = [
  { line: 0, v: [W, W, W, W, W, W, W], note: 'Start with the array. Viscosity collects every use of ps (its def-use list) and checks them one by one. Nothing is decided yet.' },
  { line: 2, v: ['ok', W, W, W, W, W, W], note: 'ps.push of a fresh object literal: fine. Viscosity can turn it into a push of plain values into each column. This use also tells it the record’s fields, x and vx.' },
  { line: 3, v: ['ok', 'ok', W, W, W, W, W], note: 'ps.length: fine. The new storage keeps its own length.' },
  { line: 4, v: ['ok', 'ok', 'elem', W, W, W, W], note: 'ps[i] hands out an element. That element is a new value to watch: if it escapes, the old layout can be observed through it. So its uses join the list.' },
  { line: 4, v: ['ok', 'ok', 'elem', 'ok', 'ok', W, W], note: 'The element is only used for .x and .vx: field reads and writes, which become ps.x[i] and ps.vx[i]. The element never leaves this line.' },
  { line: 5, v: ['ok', 'ok', 'elem', 'ok', 'ok', 'elem', W], note: 'ps[3] hands out another element. Follow its uses too.' },
  { line: 5, v: ['ok', 'ok', 'elem', 'ok', 'ok', 'elem', 'esc'], end: 'aos', note: 'The element is passed to a call. console.log will print the whole object, and after the rewrite there is no object. That is an escape site, so the verdict is: “unsafe: line 6: an element is passed to a method call”.' },
  { line: 5, v: ['ok', 'ok', 'elem', 'ok', 'ok', 'elem', 'ok'], end: 'soa', note: 'Change the last line to console.log(ps[3].x). Now the element is only used for a field read, nothing escapes, and Viscosity picks struct of arrays.' },
];

const LABEL: Record<Verdict, string> = { wait: '…', ok: 'safe', elem: 'follow', esc: 'ESCAPE' };
const COLOR: Record<Verdict, string> = { wait: 'muted', ok: 'safe', elem: 'brand', esc: 'danger' };

export default function EscapeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const code = st.end === 'soa' ? CODE.replace('console.log(ps[3]);', 'console.log(ps[3].x);') : CODE;
  return (
    <StepFrame title="Tracing uses to an escape site" steps={s} note={st.note}>
      <CodeTrace code={code} line={st.line} />
      <Svg w={400} h={290} title="The uses of ps and of its elements, each marked safe, follow or escape">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>USE</T>
        <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>VERDICT</T>
        {ROWS.map((r, k) => {
          const v = st.v[k];
          const y = 24 + k * 34;
          const indent = r.who === 'element' ? 22 : 0;
          const c = COLOR[v];
          return (
            <Box key={k} x={4 + indent} y={y} w={392 - indent} h={28} fill={v === 'wait' ? 'transparent' : tok(c, 0.1)} stroke={v === 'wait' ? tok('line') : tok(c)} dash={v === 'wait'}>
              <T x={12 + indent} y={y + 14} size={12} mono>{r.use}</T>
              <T x={300} y={y + 14} size={10} mono anchor="end" fill={tok('muted')}>{r.kind}</T>
              <T x={388} y={y + 14} size={12} weight={700} anchor="end" fill={tok(c)}>{LABEL[v]}</T>
            </Box>
          );
        })}
        <T x={200} y={272} size={13} weight={700} anchor="middle" fill={st.end === 'aos' ? tok('danger') : st.end === 'soa' ? tok('safe') : tok('muted')}>
          {st.end === 'aos' ? 'ps → kept as array of objects' : st.end === 'soa' ? 'ps → struct of arrays' : 'no verdict yet'}
        </T>
      </Svg>
    </StepFrame>
  );
}
