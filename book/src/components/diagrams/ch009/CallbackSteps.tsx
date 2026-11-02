import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function pluck(xs, get) {
  const out = [];
  for (let i = 0; i < xs.length; i++) {
    out.push(get(xs[i]));
  }
  return out;
}
function getX(p) { return p.x; }
pluck([{ x: 1 }, { x: 4 }], getX);`;

type S = { line: number; page: boolean; i?: number; call?: string; ret?: number; out: number[]; done?: boolean; note: string };

const STATES: S[] = [
  { line: 0, page: false, out: [], note: 'Defining pluck runs nothing. Notice that its second parameter, get, will be called inside it like a function.' },
  { line: 7, page: false, out: [], note: 'Defining getX makes a function value and stores an arrow to it in the name getX. Still nothing has run.' },
  { line: 8, page: true, out: [], note: 'The call passes getX with no brackets, so the function itself is handed over. On pluck’s page, get now points at the same function as getX.' },
  { line: 3, page: true, i: 0, call: 'get(xs[0])  =  getX({ x: 1 })', ret: 1, out: [1], note: 'pluck decides when to call it: get(xs[0]) runs getX with p = { x: 1 }, which returns 1, and push adds it to out.' },
  { line: 3, page: true, i: 1, call: 'get(xs[1])  =  getX({ x: 4 })', ret: 4, out: [1, 4], note: 'Next pass, next item: getX returns 4. pluck runs the loop; the callback supplies only the work for one item.' },
  { line: 5, page: true, out: [1, 4], done: true, note: 'The loop is over, and pluck returns [1, 4]. Pass a different function and the same loop collects something else.' },
];

export default function CallbackSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Handing a function to a function" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="pluck's page holds xs, get and out; get points at the function getX, which pluck calls once per item">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>PLUCK’S PAGE</T>
        <Box x={4} y={20} w={170} h={110} dash={!st.page} fill={st.page ? tok('brand', 0.06) : 'transparent'} stroke={st.page ? tok('brand') : tok('line')}>
          {st.page ? (
            <>
              <T x={14} y={40} size={13} mono>xs = [{'{x:1}'},{'{x:4}'}]</T>
              <Box x={14} y={52} w={60} h={26} stroke={tok('ink', 0.5)}>
                <T x={22} y={65.5} size={13} mono weight={700}>get</T>
                <circle cx={64} cy={65} r={4} fill={tok('ink', 0.8)} />
              </Box>
              <T x={14} y={96} size={13} mono>i = {st.i === undefined ? '' : st.i}</T>
              <T x={14} y={118} size={13} mono>out = [{st.out.join(', ')}]</T>
            </>
          ) : (
            <T x={89} y={76} size={12} anchor="middle" fill={tok('muted')}>not called yet</T>
          )}
        </Box>
        {st.line >= 7 || st.page ? (
          <>
            <T x={228} y={12} size={11} weight={700} fill={tok('muted')}>A FUNCTION VALUE</T>
            <Box x={228} y={24} w={166} h={48} r={8} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={238} y={40} size={11} weight={700} fill={tok('accent')}>getX</T>
              <T x={238} y={58} size={13} mono>(p) {'{'} return p.x; {'}'}</T>
            </Box>
          </>
        ) : null}
        {st.page && <Arrow x1={64} y1={65} x2={226} y2={56} color={tok('accent')} />}
        {st.call && (
          <>
            <T x={6} y={150} size={13} mono>{st.call}</T>
            <T x={6} y={168} size={13} mono weight={700} fill={tok('safe')}>returns {st.ret}</T>
          </>
        )}
        {st.done && <T x={6} y={158} size={13} mono weight={700} fill={tok('safe')}>pluck returns [1, 4]</T>}
      </Svg>
    </StepFrame>
  );
}
