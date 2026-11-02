// Chapter 83: an upvalue points at a stack slot while its function runs
// (open), then copies the value into itself when the function returns
// (closed). Follows the companion VM: captureUpvalue, closeUpvalues and
// readUpvalue in companion/ts/src/vm/vm.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn counter() {
  let n = 0;
  fn count() {
    n += 1;
    return n;
  }
  return count;
}
let a = counter();
print a();`;

type S = {
  line: number;
  stack: string[];
  /** index of the running frame's slot 0 */
  base: number;
  frame: string;
  up?: { slot: number; closed: string };
  open?: boolean;
  closure?: boolean;
  hot?: number;
  globals?: string;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 8, stack: ['<script>', 'counter'], base: 1, frame: 'counter', note: 'call 0 runs counter: a new frame starts at stack slot 1, and its slot 0 holds the function being called.' },
  { line: 1, stack: ['<script>', 'counter', 'n = 0'], base: 1, frame: 'counter', hot: 2, note: 'let n = 0 is a local, so const 0 leaves it in the next stack slot: slot 2. There is no heap object for it yet.' },
  { line: 2, stack: ['<script>', 'counter', 'n = 0', '<fn count>'], base: 1, frame: 'counter', up: { slot: 2, closed: '–' }, open: true, closure: true, hot: 2, note: 'closure fn count, with the pair local 1. The VM captures slot base + 1 = 2: no open upvalue exists for it, so it makes one and puts it on the open list. The upvalue is open: it points at the slot.' },
  { line: 6, stack: ['<script>', 'counter', 'n = 0', '<fn count>'], base: 1, frame: 'counter', up: { slot: -1, closed: '0' }, closure: true, note: 'return: before the frame goes, closeUpvalues(1) closes every open upvalue at slot 1 or above. The value 0 is copied into the upvalue, and its slot becomes −1 (the next chapter looks at this step closely).' },
  { line: 8, stack: ['<script>'], base: 0, frame: 'script', up: { slot: -1, closed: '0' }, closure: true, globals: 'a = <fn count>', note: 'The frame is gone, and slots 1 to 3 are free for the next call to reuse. The closure’s upvalue no longer needs them: it holds n itself.' },
  { line: 3, stack: ['<script>', '<fn count>'], base: 1, frame: 'count', up: { slot: -1, closed: '1' }, closure: true, globals: 'a = <fn count>', out: '1', note: 'a() runs count. load.upvalue 0 sees slot −1, so it reads closed (0); store.upvalue 0 writes 1 back into the same field. The counter lives on the heap now.' },
];

const SX = 8;
const SW = 132;
const SH = 26;
const SY = 34;

export default function UpvalueSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slotY = (i: number) => SY + i * SH;
  const isOpen = st.up && st.up.slot !== -1;
  const upColor = isOpen ? tok('accent') : tok('safe');
  return (
    <StepFrame title="An upvalue, open then closed" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={232} title="The value stack on the left, an upvalue object in the middle, the count closure on the right">
        <T x={SX} y={14} size={11} weight={700} fill={tok('muted')}>VALUE STACK</T>
        <T x={214} y={14} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        {[0, 1, 2, 3].map((i) => {
          const v = st.stack[i];
          const live = v !== undefined;
          return (
            <g key={i}>
              <Box x={SX + 22} y={slotY(i)} w={SW - 22} h={SH - 4} r={3}
                fill={i === st.hot ? tok('brand', 0.14) : live ? tok('panel') : tok('line', 0.15)}
                stroke={i === st.hot ? tok('brand') : tok('line')} dash={!live}>
                <T x={SX + 30} y={slotY(i) + 11} size={12} mono opacity={live ? 1 : 0.5}>{live ? v : 'free'}</T>
              </Box>
              <T x={SX + 14} y={slotY(i) + 11} size={11} mono anchor="end" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        <T x={SX} y={slotY(4) + 8} size={11} fill={tok('muted')}>frame: {st.frame} (slots from {st.base})</T>

        {st.up && (
          <>
            <Box x={214} y={44} w={124} h={58} fill={isOpen ? tok('accent', 0.1) : tok('safe', 0.12)} stroke={upColor}>
              <T x={224} y={58} size={11} weight={700} fill={upColor}>upvalue {isOpen ? '(open)' : '(closed)'}</T>
              <T x={224} y={76} size={12} mono>slot: {st.up.slot}</T>
              <T x={224} y={92} size={12} mono>closed: {st.up.closed}</T>
            </Box>
            {isOpen && <Arrow x1={214} y1={76} x2={SX + SW + 2} y2={slotY(st.up.slot) + 11} color={tok('accent')} />}
          </>
        )}
        {st.open && (
          <>
            <T x={344} y={36} size={10} mono fill={tok('muted')} anchor="end">openUpvalues</T>
            <Arrow x1={300} y1={40} x2={300} y2={46} color={tok('accent')} />
          </>
        )}
        {st.closure && (
          <>
            <Box x={240} y={136} w={150} h={44} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={250} y={150} size={12} mono weight={700}>{'closure <fn count>'}</T>
              <T x={250} y={168} size={11} mono fill={tok('muted')}>upvalues[0]</T>
            </Box>
            <Arrow x1={276} y1={136} x2={276} y2={104} color={tok('brand')} />
          </>
        )}
        {st.globals && <T x={214} y={202} size={12} mono>globals: {st.globals}</T>}
        {st.out && <T x={214} y={222} size={12} mono fill={tok('muted')}>printed: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
