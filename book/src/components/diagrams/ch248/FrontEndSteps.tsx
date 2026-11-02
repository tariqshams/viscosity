import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The three kinds of front-end test in packages/frontend-js/test, with
// real outcomes: the round-trip snippet, the corpus file basic_soa.js
// (run in two fresh vm contexts), and the acorn-vs-mini comparison. The
// last step is this chapter's own experiment on 515 third-party files.
type K = 'id' | 'diff' | 'mini' | 'scale';
type S = { k: K; stage: number; note: string };
const STATES: S[] = [
  { k: 'id', stage: 0, note: 'Test 1, the round trip. The input is a 57-byte program with an array of numbers and a comment. There is no array of objects, so there is nothing to transform.' },
  { k: 'id', stage: 1, note: 'Compile it through the whole pipeline: parse, resolve, lower, analyze, plan, emit. The plan transforms nothing, so the emitter has no prelude and returns its input.' },
  { k: 'id', stage: 2, note: 'Compare with toBe: every one of the 57 bytes, the comment and the final newline included, must be equal. They are.' },
  { k: 'diff', stage: 0, note: 'Test 2, differential, once per corpus file. basic_soa.js says // viscosity: ps=soa in its header, and the plan agrees.' },
  { k: 'diff', stage: 1, note: 'Run the original in a fresh vm context with its own globals, recording console.log lines and any uncaught error: out ["507000 1000 11.5 6"], no error.' },
  { k: 'diff', stage: 2, note: 'Run the compiled code (1617 bytes now, with the container class) in another fresh context. Same lines, no error: pass. The original is the oracle.' },
  { k: 'mini', stage: 0, note: 'Test 3, parser equivalence, once per corpus and benchmark file (45 in all): compile with acorn, compile with the hand-written mini parser.' },
  { k: 'mini', stage: 2, note: 'The compiled code and the explanation must be byte-identical. If the mini parser built a slightly different tree, a different edit or decision would show up here.' },
  { k: 'scale', stage: 2, note: 'Not in the repository: this chapter ran the round trip over all 515 JavaScript files in the engine’s node_modules, with the resolver fix taken out again. 498 came back byte-identical, none changed, 17 crashed, all on export default class. With the fix, all 515 pass.' },
];

const TITLE: Record<K, string> = {
  id: 'round trip: compile(src) === src',
  diff: 'differential: run(src) = run(code)',
  mini: 'parsers: acorn = mini',
  scale: 'experiment: 515 real files',
};

export default function FrontEndSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const on = (n: number) => st.stage >= n;
  const box = (n: number, bad = false) => ({
    fill: st.stage === n ? tok(bad ? 'danger' : 'brand', 0.14) : 'transparent',
    stroke: on(n) ? tok(bad ? 'danger' : 'brand') : tok('line'),
    dash: !on(n),
  });
  const left = st.k === 'id' ? 'snippet (57 B)' : st.k === 'diff' ? 'basic_soa.js' : st.k === 'mini' ? 'corpus file' : '515 files';
  const mid = st.k === 'id' ? 'compile' : st.k === 'diff' ? 'compile, run ×2' : st.k === 'mini' ? 'acorn | mini' : 'compile each';
  const res = st.k === 'id' ? 'equal: pass' : st.k === 'diff' ? 'same output: pass' : st.k === 'mini' ? 'same code: pass' : '498 = · 17 crash';
  return (
    <StepFrame title="Three ways to test a front-end" steps={s} note={st.note}>
      <Svg w={400} h={210} title="A test input is compiled and its result compared against the input, the original's behaviour, or the other parser's output">
        <T x={200} y={14} size={12} anchor="middle" weight={700} fill={tok('brand')}>{TITLE[st.k]}</T>
        <Box x={8} y={50} w={110} h={46} {...box(0)}>
          <T x={63} y={73} size={11} mono anchor="middle">{left}</T>
        </Box>
        <Arrow x1={118} y1={73} x2={142} y2={73} />
        <Box x={144} y={50} w={112} h={46} {...box(1)}>
          <T x={200} y={73} size={11} anchor="middle">{mid}</T>
        </Box>
        <Arrow x1={256} y1={73} x2={280} y2={73} />
        <Box x={282} y={50} w={110} h={46} {...box(2, st.k === 'scale')}>
          <T x={337} y={73} size={11} anchor="middle" weight={700}
            fill={on(2) ? (st.k === 'scale' ? tok('danger') : tok('safe')) : tok('muted')}>{on(2) ? res : '…'}</T>
        </Box>
        {st.k === 'id' && (
          <g>
            <Arrow x1={63} y1={96} x2={300} y2={150} dash bend={0.2} />
            <T x={20} y={168} size={11} mono fill={tok('muted')}>const a = [1, 2, 3];</T>
            <T x={20} y={182} size={11} mono fill={tok('muted')}>// a comment</T>
            <T x={20} y={196} size={11} mono fill={tok('muted')}>console.log(a.length);</T>
            <T x={300} y={168} size={11} anchor="middle" fill={tok('muted')}>input is the expected output</T>
          </g>
        )}
        {st.k === 'diff' && (
          <g>
            <Box x={8} y={120} w={186} h={70} stroke={on(1) ? tok('ink', 0.5) : tok('line')} dash={!on(1)}>
              <T x={18} y={136} size={11} weight={700} fill={tok('muted')}>FRESH CONTEXT A: ORIGINAL</T>
              <T x={18} y={160} size={11} mono>{on(1) ? 'out: 507000 1000 11.5 6' : 'not run yet'}</T>
              <T x={18} y={178} size={11} mono>{on(1) ? 'error: null' : ''}</T>
            </Box>
            <Box x={206} y={120} w={186} h={70} stroke={on(2) ? tok('ink', 0.5) : tok('line')} dash={!on(2)}>
              <T x={216} y={136} size={11} weight={700} fill={tok('muted')}>FRESH CONTEXT B: COMPILED</T>
              <T x={216} y={160} size={11} mono>{on(2) ? 'out: 507000 1000 11.5 6' : 'not run yet'}</T>
              <T x={216} y={178} size={11} mono>{on(2) ? 'error: null' : ''}</T>
            </Box>
          </g>
        )}
        {st.k === 'mini' && (
          <g>
            <T x={200} y={140} size={11} anchor="middle" mono>expect(m.code).toBe(a.code)</T>
            <T x={200} y={160} size={11} anchor="middle" mono>expect(m.explain).toBe(a.explain)</T>
            <T x={200} y={186} size={11} anchor="middle" fill={tok('muted')}>40 corpus files + 5 benchmark programs</T>
          </g>
        )}
        {st.k === 'scale' && (
          <g>
            <T x={200} y={140} size={11} anchor="middle" mono>export default class A {'{}'}</T>
            <T x={200} y={160} size={11} anchor="middle" mono fill={tok('danger')}>TypeError: Cannot read properties</T>
            <T x={200} y={176} size={11} anchor="middle" mono fill={tok('danger')}>of undefined (reading 'owner')</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
