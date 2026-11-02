import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Simplified from consume() and expected() in companion/ts/src/parser.ts.
const CODE = `function consume(t, what) {
  if (check(t)) advance();
  else expected(what, t === ';'
    ? previous : current);
}
function expected(what, at) {
  errorAt(at, \`expected \${what}, \` +
    \`found \${describe(current)}\`);
}`;

// The tokens of: let x = 1 / print x; (one row per source line)
const TOKS: { t: string; line: number }[] = [
  { t: 'let', line: 1 }, { t: 'x', line: 1 }, { t: '=', line: 1 }, { t: '1', line: 1 },
  { t: 'print', line: 2 }, { t: 'x', line: 2 }, { t: ';', line: 2 }, { t: 'end', line: 2 },
];

type S = { line: number | null; cur: number; ask?: string; at?: number; errors: string[]; note: string };

const MSG = "line 1: expected ';' after the variable declaration, found 'print'";

const STATES: S[] = [
  { line: null, cur: 0, errors: [], note: 'The parser meets let, so it is reading a variable declaration. The grammar says what must come: let, a name, then (optionally) = and a value, then a ;.' },
  { line: 1, cur: 1, ask: "a name", errors: [], note: "consume('identifier', …) checks that the next token is a name. It is (x), so consume takes it with advance() and moves on." },
  { line: null, cur: 4, errors: [], note: 'The = is there, so the parser reads the value: the Pratt loop takes 1, peeks at print, finds it has no binding power, and stops. The value is just 1.' },
  { line: 2, cur: 4, ask: "';'", at: 3, errors: [], note: "Now consume(';', \"';' after the variable declaration\"). check(';') is false: the next token is print. So consume calls expected(), and because the missing token is a ;, it passes previous (the 1, on line 1) as the place to report." },
  { line: 6, cur: 4, ask: "';'", at: 3, errors: [MSG], note: "expected() builds the message from three things: the line of the token it was given (1), the words it was told to expect, and the token actually found, named in quotes ('print'). errorAt hands it to the reporter." },
  { line: 4, cur: 4, errors: [MSG], note: 'consume returns without taking anything and without throwing. The let statement is finished with what the parser has, and the parser carries on at print (exactly how it picks up again is the next chapter’s business).' },
  { line: null, cur: 7, errors: [MSG], note: 'print x; parses cleanly. At the end there is one error in the list, so Drip prints it and runs nothing: not even the print. Exit code 65.' },
];

export default function ConsumeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="consume: checking for a token the grammar needs" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={208} title="The tokens of let x = 1 and print x semicolon, on two lines. The parser takes tokens until it needs a semicolon and finds print; it reports the error on line 1, where the semicolon belongs.">
        {[1, 2].map((ln) => {
          let x = 30;
          return (
            <g key={ln}>
              <T x={8} y={(ln - 1) * 40 + 20} size={11} mono fill={tok('muted')}>{ln}</T>
              {TOKS.map((tk, k) => {
                if (tk.line !== ln) return null;
                const w = 16 + tk.t.length * 8.5;
                const y = (ln - 1) * 40 + 6;
                const taken = k < st.cur;
                const isCur = k === st.cur;
                const isAt = k === st.at;
                const g = (
                  <g key={k}>
                    <Box x={x} y={y} w={w} h={28} fill={isCur && st.at !== undefined ? tok('danger', 0.14) : taken ? tok('safe', 0.12) : tok('panel')} stroke={isAt ? tok('safe') : isCur ? tok('brand') : taken ? tok('safe') : tok('ink', 0.4)}>
                      <T x={x + w / 2} y={y + 14} size={tk.t === 'end' ? 11 : 14} mono anchor="middle" weight={isCur ? 700 : 400}>{tk.t}</T>
                    </Box>
                    {isCur && <T x={x + w / 2} y={y + 35} size={9.5} anchor="middle" fill={tok('brand')}>current</T>}
                    {isAt && <T x={x + w / 2} y={y + 35} size={9.5} anchor="middle" fill={tok('safe')}>previous</T>}
                  </g>
                );
                x += w + 6;
                return g;
              })}
            </g>
          );
        })}
        {st.ask && (
          <Box x={8} y={90} w={384} h={26} fill={st.at !== undefined ? tok('danger', 0.1) : tok('safe', 0.12)} stroke={st.at !== undefined ? tok('danger') : tok('safe')}>
            <T x={200} y={103} size={12.5} mono anchor="middle" weight={700}>
              {st.at !== undefined ? `want ${st.ask}, next is 'print' → report` : `want ${st.ask}, next is 'x' → take it`}
            </T>
          </Box>
        )}
        <T x={8} y={138} size={11} weight={700} fill={tok('muted')}>ERRORS REPORTED</T>
        {st.errors.length === 0
          ? <T x={8} y={158} size={12} fill={tok('muted')}>none yet</T>
          : (
            <>
              <T x={8} y={158} size={11.5} mono fill={tok('danger')}>line 1: expected ';' after the</T>
              <T x={20} y={174} size={11.5} mono fill={tok('danger')}>variable declaration, found 'print'</T>
            </>
          )}
        <T x={8} y={198} size={11} fill={tok('muted')}>{st.cur === 7 ? 'end: errors reported, so nothing runs (exit 65)' : ''}</T>
      </Svg>
    </StepFrame>
  );
}
