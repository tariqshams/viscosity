// Chapter 110: mark-and-sweep dead code elimination on a small SSA listing.
// Everything starts presumed dead; the roots are instructions with effects;
// marking follows operands; whatever is never reached is swept away.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { id: '%0', text: '%0 = param w' },
  { id: '%1', text: '%1 = param h' },
  { id: '%2', text: '%2 = binop + %0, %1' },
  { id: '%3', text: '%3 = binop * %2, %2' },
  { id: '%4', text: '%4 = binop * %0, %1' },
  { id: 'c', text: 'call log, %4', root: true },
  { id: 'r', text: 'return %4', root: true },
];

type S = { live: string[]; work: string[]; swept?: boolean; hot?: string; note: string };

const STATES: S[] = [
  { live: [], work: [], note: 'Start pessimistic about the code and optimistic about deleting it: every instruction is presumed dead until something proves it is needed.' },
  { live: ['c', 'r'], work: ['c', 'r'], note: 'The roots are the instructions whose effect the program can observe: the call (it prints) and the return (the caller gets the value). They are live no matter what.' },
  { live: ['c', 'r', '%4'], work: ['r', '%4'], hot: 'c', note: 'Take the call off the worklist. Its operand %4 is needed, so mark %4 live and queue it.' },
  { live: ['c', 'r', '%4'], work: ['%4'], hot: 'r', note: 'The return also uses %4, which is already marked. Nothing new.' },
  { live: ['c', 'r', '%4', '%0', '%1'], work: ['%0', '%1'], hot: '%4', note: '%4 = w * h uses %0 and %1, so both parameters are live too.' },
  { live: ['c', 'r', '%4', '%0', '%1'], work: [], note: 'The worklist is empty. %3 uses %2, but %3 was never marked, so that use proves nothing: a dead instruction can’t keep anything alive.' },
  { live: ['c', 'r', '%4', '%0', '%1'], work: [], swept: true, note: 'Sweep: delete every unmarked instruction. %2 and %3 go together in one pass. Deleting only “unused” values would take two rounds here: first %3, then %2.' },
];

export default function DceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const RH = 30;
  return (
    <StepFrame title="Mark from the roots, then sweep" steps={s} note={st.note}>
      <Svg w={400} h={ROWS.length * RH + 54} title="An instruction listing; live instructions are marked, dead ones are swept away">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>INSTRUCTIONS</T>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>STATUS</T>
        {ROWS.map((r, k) => {
          const y = 24 + k * RH;
          const live = st.live.includes(r.id);
          const gone = st.swept && !live;
          const hot = st.hot === r.id;
          return (
            <g key={r.id} opacity={gone ? 0.35 : 1}>
              <Box x={10} y={y} w={270} h={RH - 6} r={4}
                fill={live ? tok('safe', 0.14) : tok('panel')}
                stroke={hot ? tok('brand') : live ? tok('safe') : tok('line')}>
                <T x={20} y={y + (RH - 6) / 2} size={13} mono>{r.text}</T>
              </Box>
              {gone && <line x1={16} y1={y + 12} x2={274} y2={y + 12} stroke={tok('danger')} strokeWidth={2} />}
              <T x={300} y={y + (RH - 6) / 2} size={12} weight={live ? 700 : 400}
                fill={live ? tok('safe') : gone ? tok('danger') : tok('muted')}>
                {gone ? 'deleted' : live ? (r.root ? 'live (root)' : 'live') : 'dead?'}
              </T>
            </g>
          );
        })}
        <T x={10} y={ROWS.length * RH + 40} size={13} mono fill={tok('muted')}>
          worklist: [{st.work.map((w) => (w === 'c' ? 'call' : w === 'r' ? 'return' : w)).join(', ')}]
        </T>
      </Svg>
    </StepFrame>
  );
}
