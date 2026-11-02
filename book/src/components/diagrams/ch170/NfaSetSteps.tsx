// Simulating an NFA that recognises the keyword "if" or a name, by
// tracking the set of states it could be in (pins on the map).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { Fsm, type Ed, type St } from './Fsm';

const STS: St[] = [
  { id: '0', x: 40, y: 120 },
  { id: '1', x: 130, y: 60 },
  { id: '2', x: 230, y: 60 },
  { id: '3', x: 330, y: 60, accept: true, label: '3' },
  { id: '4', x: 130, y: 180 },
  { id: '5', x: 260, y: 180, accept: true },
];
const EDS: Ed[] = [
  { from: '0', to: '1', label: 'ε' },
  { from: '0', to: '4', label: 'ε' },
  { from: '1', to: '2', label: 'i' },
  { from: '2', to: '3', label: 'f' },
  { from: '4', to: '5', label: 'letter' },
  { from: '5', to: '5', label: 'letter', loop: 'down' },
];

type S = { input: string; pos: number; set: string[]; hot: string[]; verdict?: string; note: string };
const STATES: S[] = [
  { input: 'if', pos: 0, set: ['0'], hot: [], note: 'One machine for two token rules: the top branch spells the keyword if, the bottom one any name. The machine starts with one pin, on state 0.' },
  { input: 'if', pos: 0, set: ['0', '1', '4'], hot: ['0>1:ε', '0>4:ε'], note: 'ε-moves read nothing, so they are free: from 0 the machine could already be in 1 or in 4. Adding every state reachable by ε-moves is called taking the ε-closure.' },
  { input: 'if', pos: 1, set: ['2', '5'], hot: ['1>2:i', '4>5:letter'], note: 'Read “i”. From 1 there is an arrow labelled i, to 2; from 4, “i” is a letter, so to 5. State 0 has no arrow for i, so its pin is dropped.' },
  { input: 'if', pos: 2, set: ['3', '5'], hot: ['2>3:f', '5>5:letter'], note: 'Read “f”. 2 goes to 3, and 5 loops back to 5. Two pins, and both states are accepting.' },
  { input: 'if', pos: 2, set: ['3', '5'], hot: [], verdict: 'accept: keyword if or name', note: 'The input ends with a pin on an accepting state, so the NFA accepts. Two rules matched the same text; a scanner generator breaks the tie (two chapters on).' },
  { input: 'ifs', pos: 0, set: ['0', '1', '4'], hot: [], note: 'Now “ifs”. Same start: the ε-closure of {0}.' },
  { input: 'ifs', pos: 2, set: ['3', '5'], hot: [], note: 'After “i” and “f”, the pins are on 3 and 5 as before.' },
  { input: 'ifs', pos: 3, set: ['5'], hot: ['5>5:letter'], note: 'Read “s”. State 3 has no arrows at all, so that pin is dropped; 5 loops. Only the name branch is still alive.' },
  { input: 'ifs', pos: 3, set: ['5'], hot: [], verdict: 'accept: name only', note: 'The input ends on 5, accepting: “ifs” is a name, and no longer a keyword. Never once did the machine have to guess.' },
];

export default function NfaSetSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="An NFA as a set of pins" steps={s} note={st.note}>
      <Svg w={400} h={290} title="An NFA for if or a name, with the current set of possible states highlighted">
        {[...st.input].map((c, k) => (
          <Box key={k} x={12 + k * 30} y={4} w={26} h={26} fill={k < st.pos ? tok('ink', 0.06) : tok('panel')} stroke={tok('ink', 0.35)}>
            <T x={25 + k * 30} y={18} size={14} mono anchor="middle" fill={k < st.pos ? tok('muted') : undefined}>{c}</T>
          </Box>
        ))}
        <T x={110} y={18} size={12} mono>{'pins: { ' + st.set.join(', ') + ' }'}</T>
        <g transform="translate(0,26)">
          <Fsm states={STS} edges={EDS} start="0" on={st.set} hot={st.hot} />
        </g>
        <T x={330} y={118} size={10} anchor="middle" fill={tok('muted')}>keyword if</T>
        <T x={300} y={206} size={10} anchor="start" fill={tok('muted')}>name</T>
        {st.verdict && <T x={392} y={280} size={12} anchor="end" weight={700} fill={tok('safe')}>{st.verdict}</T>}
      </Svg>
    </StepFrame>
  );
}
