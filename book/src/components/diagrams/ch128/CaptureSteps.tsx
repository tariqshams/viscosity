import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 128: what a closure value holds. Without `move`, `tick` is a
// little struct holding a mutable borrow of `count`; with `move`, it holds
// its own copy (i32 is Copy). Both programs were run with rustc 1.97: the
// first prints 2, the second prints 2 and then 0.
const BORROW = `let mut count = 0;
let mut tick = || {
    count += 1;
    count
};
tick();
tick();
println!("{count}"); // 2`;

const MOVED = `let mut count = 0;
let mut tick = move || {
    count += 1;
    count
};
tick();
println!("{}", tick()); // 2
println!("{count}"); // 0`;

type S = {
  moved: boolean;
  line: number;
  outer: number;
  closure: null | { borrow: boolean; own?: number; live: boolean };
  out?: string;
  note: string;
};

const STATES: S[] = [
  { moved: false, line: 0, outer: 0, closure: null, note: 'count is an ordinary local variable on the stack, holding 0.' },
  { moved: false, line: 1, outer: 0, closure: { borrow: true, live: true }, note: 'Making the closure runs nothing. It builds a small value, roughly a struct with one field: a mutable borrow of count (the arrow). The body changes count, so a shared borrow would not do.' },
  { moved: false, line: 5, outer: 1, closure: { borrow: true, live: true }, note: 'Calling tick runs the body through that borrow, so the real count becomes 1. Calling it changes something, which is why the binding needs let mut.' },
  { moved: false, line: 6, outer: 2, closure: { borrow: true, live: true }, note: 'A second call: count is 2. This is the last use of tick, so its borrow ends here.' },
  { moved: false, line: 7, outer: 2, closure: { borrow: true, live: false }, out: '2', note: 'With the closure’s borrow over, main may read count again. It prints 2: the closure changed the real variable.' },
  { moved: true, line: 1, outer: 0, closure: { borrow: false, own: 0, live: true }, note: 'The same code with move. Now the closure’s struct holds its own count. An i32 is Copy, so the outer count is copied in, not taken away.' },
  { moved: true, line: 6, outer: 0, closure: { borrow: false, own: 2, live: true }, out: '2', note: 'Two calls change the closure’s own count, so the second call returns 2. The outer count is untouched.' },
  { moved: true, line: 7, outer: 0, closure: { borrow: false, own: 2, live: true }, out: '2, then 0', note: 'The outer count is still 0. With move, a closure owns what it captured, which is what lets it outlive the function that made it.' },
];

export default function CaptureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const c = st.closure;
  return (
    <StepFrame title="What a closure carries" steps={s} note={st.note}>
      <CodeTrace code={st.moved ? MOVED : BORROW} line={st.line} />
      <Svg w={400} h={120} title="The variable count, and the closure value tick with what it holds">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>MAIN’S VARIABLES</T>
        <T x={20} y={42} size={13} mono weight={700}>count</T>
        <Box x={20} y={52} w={70} h={34} fill={tok('panel')} stroke={tok('accent')}>
          <T x={55} y={69} size={16} mono anchor="middle">{String(st.outer)}</T>
        </Box>
        <T x={170} y={14} size={11} weight={700} fill={tok('muted')}>THE CLOSURE VALUE tick</T>
        {c ? (
          <Box x={170} y={30} w={220} h={70} fill={c.live ? tok('brand', 0.08) : 'transparent'} stroke={c.live ? tok('brand') : tok('line')} dash={!c.live}>
            <T x={182} y={50} size={12} mono>{c.borrow ? 'count: &mut i32' : 'count: i32'}</T>
            {c.borrow ? (
              <T x={182} y={78} size={11} fill={tok('muted')}>{c.live ? 'a borrow of main’s count' : 'borrow over (last use)'}</T>
            ) : (
              <Box x={182} y={62} w={60} h={28} fill={tok('panel')} stroke={tok('f4')}>
                <T x={212} y={76} size={15} mono anchor="middle">{String(c.own)}</T>
              </Box>
            )}
          </Box>
        ) : (
          <T x={280} y={65} size={12} anchor="middle" fill={tok('muted')}>not made yet</T>
        )}
        {c && c.borrow && c.live && <Arrow x1={176} y1={50} x2={94} y2={66} color={tok('brand')} bend={0.3} />}
        {st.out && <T x={20} y={110} size={12} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
