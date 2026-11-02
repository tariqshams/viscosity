import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 353-b: the three lifetime elision rules (Rust Reference,
// "Lifetime elision"), applied one at a time to three signatures. The
// compiler never looks at the body; when the rules leave an output
// lifetime unnamed, rustc 1.97 reports E0106.
type Rule = 'idle' | 'apply' | 'skip';
type S = { sig: string[]; rules: [Rule, Rule, Rule]; result?: { ok: boolean; text: string }; note: string };

const STATES: S[] = [
  { sig: ['fn first(s: &str) -> &str'], rules: ['idle', 'idle', 'idle'], note: 'One reference goes in and one comes out, and no lifetime is written. The compiler fills them in with three rules, using only the signature, never the body.' },
  { sig: ["fn first<'a>(s: &'a str)", '    -> &str'], rules: ['apply', 'idle', 'idle'], note: 'Rule 1: every reference parameter gets its own lifetime. s gets one, called \'a here. The output is still unnamed.' },
  { sig: ["fn first<'a>(s: &'a str)", "    -> &'a str"], rules: ['apply', 'apply', 'idle'], result: { ok: true, text: 'done: the result borrows from s' }, note: 'Rule 2: there is exactly one input lifetime, so every output gets it. The answer borrows from s, which is what first_word-style functions need.' },
  { sig: ["fn longer<'a, 'b>(a: &'a str,", "    b: &'b str) -> &str"], rules: ['apply', 'idle', 'idle'], note: 'A second signature, with two reference inputs. Rule 1 gives them two different lifetimes, \'a and \'b.' },
  { sig: ["fn longer<'a, 'b>(a: &'a str,", "    b: &'b str) -> &str"], rules: ['apply', 'skip', 'skip'], result: { ok: false, text: 'E0106: missing lifetime specifier' }, note: 'Rule 2 needs exactly one input lifetime; there are two. Rule 3 needs &self; there is none. The output is still unnamed, so this is E0106, and you must write the lifetimes yourself.' },
  { sig: ["fn get<'a, 'b>(&'a self,", "    k: &'b str) -> &str"], rules: ['apply', 'skip', 'idle'], note: 'A method this time. Rule 1 names &self\'s lifetime \'a and k\'s \'b. Rule 2 does not apply: there are two inputs.' },
  { sig: ["fn get<'a, 'b>(&'a self,", "    k: &'b str) -> &'a str"], rules: ['apply', 'skip', 'apply'], result: { ok: true, text: 'done: the result borrows from self' }, note: 'Rule 3: in a method with &self or &mut self, every output gets self\'s lifetime. Usually right (a getter returns part of self), but not always: the next section shows when it is wrong.' },
];

const RULES = ['1. each input reference gets its own', '2. one input lifetime: outputs get it', '3. &self or &mut self: outputs get its'];

export default function ElisionSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The three elision rules, one at a time" steps={s} note={st.note}>
      <Svg w={400} h={226} title="A function signature, and which of the three elision rules apply to it">
        <Box x={4} y={6} w={392} h={50} fill={tok('panel')} stroke={tok('ink', 0.4)}>
          {st.sig.map((l, k) => (
            <T key={k} x={14} y={22 + k * 20} size={12} mono>{l.replace(/^ +/, (m) => ' '.repeat(m.length))}</T>
          ))}
        </Box>
        {RULES.map((r, k) => {
          const state = st.rules[k];
          const y = 68 + k * 38;
          const col = state === 'apply' ? 'safe' : state === 'skip' ? 'muted' : 'line';
          return (
            <g key={k}>
              <Box x={4} y={y} w={392} h={30} fill={state === 'apply' ? tok('safe', 0.15) : 'transparent'} stroke={tok(col)} dash={state === 'idle'}>
                <T x={14} y={y + 15} size={12} fill={state === 'skip' ? tok('muted') : undefined}>{r}</T>
                <T x={386} y={y + 15} size={11} anchor="end" weight={700} fill={tok(state === 'apply' ? 'safe' : 'muted')}>
                  {state === 'apply' ? 'applies' : state === 'skip' ? 'does not apply' : ''}
                </T>
              </Box>
            </g>
          );
        })}
        {st.result && (
          <T x={200} y={196} size={13} anchor="middle" weight={700} fill={tok(st.result.ok ? 'safe' : 'danger')}>{st.result.text}</T>
        )}
        <T x={200} y={218} size={11} anchor="middle" fill={tok('muted')}>the rules read only the signature, never the body</T>
      </Svg>
    </StepFrame>
  );
}
