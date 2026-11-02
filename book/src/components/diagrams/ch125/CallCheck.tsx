// Checking area(3, "4") against area : fn(number, number) -> number:
// callee is a function, the argument count matches, then each argument
// is compared with its parameter type, in order.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Mark = 'idle' | 'ok' | 'bad' | 'now';
type S = { callee: Mark; count: Mark; a1: Mark; a2: Mark; note: string };
const STATES: S[] = [
  { callee: 'now', count: 'idle', a1: 'idle', a2: 'idle', note: 'First, the callee. typeOf(area) looks area up in Γ and finds fn(number, number) -> number: a function type, so it may be called. (For price, a number, this would stop with: cannot call a number.)' },
  { callee: 'ok', count: 'now', a1: 'idle', a2: 'idle', note: 'Next, the count. The signature has two parameter types and the call passes two arguments. With one, the message would be area() takes 2 arguments but got 1.' },
  { callee: 'ok', count: 'ok', a1: 'now', a2: 'idle', note: 'Now each argument against its parameter, left to right. The first argument, 3, has type number; the first parameter wants a number. They match.' },
  { callee: 'ok', count: 'ok', a1: 'ok', a2: 'bad', note: 'The second argument, "4", has type string; the second parameter wants a number. No match: argument 2 of area() must be a number, not a string. Had it matched, the call would have type number, the signature’s result.' },
];
const COL: Record<Mark, string> = { idle: tok('line'), ok: tok('safe'), bad: tok('danger'), now: tok('brand') };
const TXT: Record<Mark, string> = { idle: '', ok: '✓', bad: '✗', now: '?' };

export default function CallCheck() {
  const s = useSteps(STATES);
  const st = s.state;
  const cell = (x: number, y: number, w: number, top: string, mid: string, m: Mark) => (
    <Box x={x} y={y} w={w} h={46} stroke={COL[m]} fill={m === 'now' ? tok('brand', 0.1) : tok('panel')}>
      <T x={x + w / 2} y={y + 14} size={11} anchor="middle" fill={tok('muted')}>{top}</T>
      <T x={x + w / 2} y={y + 32} size={13} mono anchor="middle">{mid}</T>
      <T x={x + w - 8} y={y + 14} size={13} anchor="end" weight={700} fill={COL[m]}>{TXT[m]}</T>
    </Box>
  );
  return (
    <StepFrame title='Checking the call area(3, "4")' steps={s} note={st.note}>
      <Svg w={400} h={180} title={`Callee ${st.callee}, count ${st.count}, argument 1 ${st.a1}, argument 2 ${st.a2}.`}>
        <T x={200} y={14} size={13} mono anchor="middle" fill={tok('muted')}>area : fn(number, number) -&gt; number</T>
        {cell(8, 30, 186, 'callee', 'area is a fn', st.callee)}
        {cell(206, 30, 186, 'count', '2 params, 2 args', st.count)}
        {cell(8, 92, 186, 'argument 1', '3 : number', st.a1)}
        {cell(206, 92, 186, 'argument 2', '"4" : string', st.a2)}
        <T x={101} y={154} size={11} anchor="middle" fill={tok('muted')}>parameter 1 wants number</T>
        <T x={299} y={154} size={11} anchor="middle" fill={tok('muted')}>parameter 2 wants number</T>
        {st.a2 === 'bad' && <T x={200} y={172} size={11} anchor="middle" weight={700} fill={tok('danger')}>argument 2 of area() must be a number, not a string</T>}
      </Svg>
    </StepFrame>
  );
}
