import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 279: a macro expander at work on two made-up macros, unless and
// twice. It finds a macro call, fills the macro's template with the
// argument trees, and looks again, until no macro call is left.
type S = { code: string; line: number | null; tpl?: { name: string; text: string; holes: string }; note: string };

const SRC = `unless n > 0 {
  twice { log(n); }
}`;
const STEP1 = `if !(n > 0) {
  twice { log(n); }
}`;
const DONE = `if !(n > 0) {
  log(n);
  log(n);
}`;

const STATES: S[] = [
  { code: SRC, line: null, note: 'The parser has built a tree for this program. unless and twice are not part of the language: they are macros, defined somewhere else.' },
  { code: SRC, line: 0, tpl: { name: 'unless c body', text: 'if !(c) body', holes: 'c = n > 0   body = { twice ... }' }, note: 'The expander walks the tree and meets a call of the macro unless. It takes the macro’s template, which has two holes, c and body.' },
  { code: STEP1, line: 0, note: 'Each hole is filled with the tree the call was given: c with the tree for n > 0, body with the whole block. The call is replaced by the result.' },
  { code: STEP1, line: 1, tpl: { name: 'twice b', text: 'b; b;', holes: 'b = log(n);' }, note: 'The expander looks again at what it produced, and finds another macro call, twice, that came in with the body.' },
  { code: DONE, line: null, note: 'No macro calls are left. Only now does the program go on to the resolver, the type checker and code generation, which never see unless or twice.' },
];

export default function ExpandSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Expanding macros until none are left" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={92} title="The template of the macro being expanded, with its holes and what fills them">
        <Box x={4} y={6} w={392} h={80} dash={!st.tpl} fill={st.tpl ? tok('f2', 0.1) : 'transparent'} stroke={st.tpl ? tok('f2') : tok('line')}>
          <T x={14} y={24} size={11} weight={700} fill={tok('muted')}>{st.tpl ? `MACRO ${st.tpl.name}` : 'NO MACRO BEING EXPANDED'}</T>
          {st.tpl && <T x={14} y={46} size={13} mono>{`template: ${st.tpl.text}`}</T>}
          {st.tpl && <T x={14} y={68} size={12} mono fill={tok('f2')}>{st.tpl.holes}</T>}
        </Box>
      </Svg>
    </StepFrame>
  );
}
