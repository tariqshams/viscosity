import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Lazy parsing of the chapter's lazy.js, following the V8 blog's
// description of the preparser (2019) and the real --log-function-events
// output shown in chapter 111 (Node v22.23.4, V8 12.4).
const CODE = `function used() { return 1; }
function unused() { return 2; }
const eager = (function () {
  return 3;
});
used();`;

type St = 'unseen' | 'pre' | 'full' | 'bytes';
type S = { line: number | null; fns: [St, St, St]; work: string; note: string };

const NAMES = ['used', 'unused', 'eager'];
const LABEL: Record<St, string> = {
  unseen: 'not reached yet',
  pre: 'preparsed: checked, skipped',
  full: 'full parse: tree built',
  bytes: 'compiled to bytecode',
};
const COLOR: Record<St, string> = { unseen: 'muted', pre: 'warn', full: 'accent', bytes: 'safe' };

const STATES: S[] = [
  { line: null, fns: ['unseen', 'unseen', 'unseen'], work: 'start', note: 'The top level of the file is about to run, so it must be parsed and compiled. The question is what to do with each function body on the way.' },
  { line: 0, fns: ['pre', 'unseen', 'unseen'], work: 'preparse', note: 'At used, V8 switches to the preparser. It reads every token of the body, checks the syntax and notes which variables it uses, but builds no tree and no bytecode.' },
  { line: 1, fns: ['pre', 'pre', 'unseen'], work: 'preparse', note: 'unused gets the same cheap treatment. V8 can’t know yet that nobody will ever call it, and it doesn’t need to.' },
  { line: 2, fns: ['pre', 'pre', 'full'], work: 'full parse', note: 'Here the parser sees “(function”. A parenthesized function is probably about to be called, so V8 guesses yes and parses it fully, straight away.' },
  { line: 2, fns: ['pre', 'pre', 'bytes'], work: 'compile', note: 'eager is compiled to bytecode along with the top level. If the guess is right, nothing is done twice.' },
  { line: 5, fns: ['full', 'pre', 'bytes'], work: 'full parse', note: 'The top level runs and calls used(). It has no bytecode yet, so V8 now parses it a second time, fully, building its tree.' },
  { line: 5, fns: ['bytes', 'pre', 'bytes'], work: 'compile', note: 'Then it compiles used to bytecode and runs it in Ignition. Lazy functions that do get called pay for two parses.' },
  { line: null, fns: ['bytes', 'pre', 'bytes'], work: 'done', note: 'The script ends. unused was only ever preparsed: no tree, no bytecode, no memory spent on code that never ran. A real page can ship a lot of code like that.' },
];

export default function LazySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Lazy parsing, function by function" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Three rows, one per function (used, unused, eager), each showing its current state: not reached, preparsed, fully parsed, or compiled to bytecode.">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>FUNCTION</T>
        <T x={120} y={12} size={11} weight={700} fill={tok('muted')}>STATE</T>
        <T x={390} y={12} size={11} anchor="end" mono fill={tok('brand')}>{st.work}</T>
        {NAMES.map((n, k) => {
          const f = st.fns[k];
          const y = 26 + k * 40;
          return (
            <g key={n}>
              <T x={10} y={y + 16} size={13} mono weight={700}>{n}</T>
              <Box x={110} y={y} w={280} h={32} r={5} fill={tok(COLOR[f], f === 'unseen' ? 0.04 : 0.16)} stroke={tok(COLOR[f])} dash={f === 'unseen'}>
                <T x={122} y={y + 16} size={12} fill={f === 'unseen' ? tok('muted') : tok('ink')}>{LABEL[f]}</T>
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
