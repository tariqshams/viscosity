import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 273: running the hand-lowered async function, one step at a
// time, with its saved state and the microtask queue.
const CODE = `function step(v) {
  switch (state) {
    case 0: state = 1;
      get('a').then(step); return;
    case 1: a = v; state = 2;
      get('b').then(step); return;
    case 2: b = v;
      resolve(a + b);
  }
}`;

type S = { line: number | null; state: number; a?: number; b?: number; who: string; queue: string[]; out?: string; note: string };

const STATES: S[] = [
  { line: null, state: 0, who: 'caller', queue: [], note: 'total(get) has made the promise it will hand back, and the record that outlives every call: state = 0, a and b empty.' },
  { line: 2, state: 1, who: 'step', queue: [], note: 'The first call, step(), runs piece 0: it sets state to 1, asks for a, and registers step itself as the callback. That callback is the continuation.' },
  { line: 3, state: 1, who: 'caller', queue: ['step(1)'], note: 'step returns at once. total(get) returns its promise to the caller, which carries on. Nothing is blocked; get(\'a\') settles and step(1) waits in the microtask queue.' },
  { line: 4, state: 2, a: 1, who: 'step', queue: [], note: 'The event loop runs step(1). The switch reads state 1, jumps to piece 1, stores a = 1 and asks for b. a survives because it lives in the record, not on the stack.' },
  { line: 5, state: 2, a: 1, who: 'loop', queue: ['step(2)'], note: 'step returns again. The stack is empty; the only memory of this half-finished function is the record (state 2, a = 1).' },
  { line: 7, state: 2, a: 1, b: 2, who: 'step', queue: [], out: '3', note: 'step(2) runs piece 2: b = 2, and resolve(a + b) settles the promise total(get) returned long ago with 3.' },
];

export default function AwaitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="An async function, lowered to a state machine" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={118} title="The saved record (state, a, b), who is running, and the microtask queue">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SAVED RECORD (on the heap)</T>
        <Cell x={8} y={22} name="state" v={String(st.state)} />
        <Cell x={82} y={22} name="a" v={st.a === undefined ? '' : String(st.a)} />
        <Cell x={156} y={22} name="b" v={st.b === undefined ? '' : String(st.b)} />
        <T x={240} y={12} size={11} weight={700} fill={tok('muted')}>RUNNING NOW</T>
        <Box x={240} y={22} w={152} h={30} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={316} y={37} size={12} mono anchor="middle">{st.who === 'loop' ? 'event loop' : st.who}</T>
        </Box>
        <T x={8} y={86} size={11} weight={700} fill={tok('muted')}>MICROTASK QUEUE</T>
        <Box x={8} y={94} w={220} h={22} dash={!st.queue.length}>
          <T x={16} y={105} size={12} mono>{st.queue.join(', ') || ' '}</T>
        </Box>
        {st.out && <T x={240} y={105} size={12} mono>promise → {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}

function Cell({ x, y, name, v }: { x: number; y: number; name: string; v: string }) {
  return (
    <g>
      <Box x={x} y={y} w={66} h={46} fill={v ? tok('panel') : 'transparent'} dash={!v}>
        <T x={x + 33} y={y + 13} size={11} anchor="middle" fill={tok('muted')}>{name}</T>
        <T x={x + 33} y={y + 32} size={15} mono anchor="middle">{v}</T>
      </Box>
    </g>
  );
}
