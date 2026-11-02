import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 283: two stackful coroutines, each with a stack of its own, and
// the one stack-pointer register that says which stack is in use.
type S = { a: string[]; b: string[]; run: 'A' | 'B' | 'sched'; savedA?: boolean; savedB?: boolean; note: string };

const STATES: S[] = [
  { a: ['main', 'walk', 'visit'], b: [], run: 'A', note: 'Coroutine A is running. Its own stack holds three frames: main called walk, which called visit. The CPU\'s stack pointer (sp) points at A\'s top frame.' },
  { a: ['main', 'walk', 'visit', 'yield'], b: [], run: 'A', note: 'Deep inside visit, A calls yield. Nothing special is needed in walk or main: yield is an ordinary call that will not return until A is resumed.' },
  { a: ['main', 'walk', 'visit', 'yield'], b: [], run: 'sched', savedA: true, note: 'yield saves A\'s registers and its sp in A\'s record, then loads the scheduler\'s. All three of A\'s frames stay where they are, on A\'s stack.' },
  { a: ['main', 'walk', 'visit', 'yield'], b: ['main', 'read'], run: 'B', savedA: true, note: 'The scheduler loads B\'s saved sp and registers. B carries on with its own stack, main then read, as if it had never stopped.' },
  { a: ['main', 'walk', 'visit', 'yield'], b: ['main', 'read', 'yield'], run: 'sched', savedA: true, savedB: true, note: 'B yields in turn. Its sp is saved, and the scheduler picks A again.' },
  { a: ['main', 'walk', 'visit'], b: ['main', 'read', 'yield'], run: 'A', savedB: true, note: 'Loading A\'s sp brings back the whole chain at once: yield returns inside visit, and visit, walk and main carry on. Switching cost a handful of register moves, however deep A was.' },
];

export default function SwitchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const stack = (x: number, name: string, fr: string[], on: boolean, saved?: boolean) => (
    <g>
      <T x={x + 60} y={14} size={12} weight={700} anchor="middle" fill={on ? tok('brand') : tok('muted')}>{`coroutine ${name}`}</T>
      <Box x={x} y={22} w={120} h={150} stroke={on ? tok('brand') : tok('line')} fill="transparent" />
      {fr.map((f, k) => (
        <Box key={k} x={x + 8} y={150 - k * 30} w={104} h={24} fill={f === 'yield' ? tok('f6', 0.15) : tok('panel')} stroke={f === 'yield' ? tok('f6') : tok('ink', 0.4)}>
          <T x={x + 60} y={162 - k * 30} size={12} mono anchor="middle">{f}</T>
        </Box>
      ))}
      {saved && <T x={x + 60} y={186} size={11} anchor="middle" fill={tok('muted')}>sp saved in record</T>}
      {on && fr.length > 0 && <Arrow x1={200} y1={214} x2={x + 60} y2={176} color={tok('brand')} />}
    </g>
  );
  return (
    <StepFrame title="Switching between two stacks" steps={s} note={st.note}>
      <Svg w={400} h={240} title="Two coroutine stacks, A and B, and the CPU stack pointer pointing at whichever one is running">
        {stack(10, 'A', st.a, st.run === 'A', st.savedA)}
        {stack(270, 'B', st.b, st.run === 'B', st.savedB)}
        <Box x={150} y={204} w={100} h={30} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={200} y={219} size={12} mono anchor="middle">{st.run === 'sched' ? 'sp: scheduler' : `sp → ${st.run}`}</T>
        </Box>
        <T x={200} y={110} size={11} anchor="middle" fill={tok('muted')}>one CPU,</T>
        <T x={200} y={124} size={11} anchor="middle" fill={tok('muted')}>many stacks</T>
      </Svg>
    </StepFrame>
  );
}
