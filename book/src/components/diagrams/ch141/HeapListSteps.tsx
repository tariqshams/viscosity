import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The companion VM's object list for this program, newest first, exactly as
// heap.objects held it when the program was run (the eleven objects the VM
// makes before any code runs are drawn as one box).
const CODE = `let s = "x";
for i in 0..3 {
  s = s + "a";
}
print s;`;

type O = { type: string; chars?: string; group?: string };
const START: O[] = [{ type: 'start', group: '11 start-up objects' }];
const COMPILED: O[] = [{ type: 'string', chars: 'a' }, { type: 'string', chars: 's' }, { type: 'string', chars: 'x' }, { type: 'function' }, ...START];
const RUN: O[] = [{ type: 'closure' }, ...COMPILED];
const xa: O = { type: 'string', chars: 'xa' };
const xaa: O = { type: 'string', chars: 'xaa' };
const xaaa: O = { type: 'string', chars: 'xaaa' };

type S = { line: number | null; objs: O[]; fresh: number; s?: string; dead?: string[]; note: string };

const STATES: S[] = [
  { line: null, objs: START, fresh: 1, note: 'Before any of your code, the VM makes eleven objects: the string "init", and for each of clock, len, push, pop and str, its name as a string and the native function itself. Each went in at the head of the list.' },
  { line: null, objs: COMPILED, fresh: 4, note: 'Compiling makes four more: the function that holds the script’s bytecode, then the strings "x", "s" and "a", in the order the compiler meets them. Literals and names become objects at compile time.' },
  { line: 0, objs: RUN, fresh: 1, s: 'x', note: 'Running starts by wrapping the script in a closure (the chapter on upvalues explains why). let s = "x" makes nothing new: the global s refers to the "x" object the compiler already made.' },
  { line: 2, objs: [xa, ...RUN], fresh: 1, s: 'xa', note: 's + "a" is add on two strings. The characters are joined, and a brand-new object, "xa", is linked in at the head. s now refers to it.' },
  { line: 2, objs: [xaa, xa, ...RUN], fresh: 1, s: 'xaa', note: 'Second time round: another new object, "xaa". Nothing refers to "xa" any more, but it stays on the list.' },
  { line: 2, objs: [xaaa, xaa, xa, ...RUN], fresh: 1, s: 'xaaa', note: 'Third time: "xaaa". Every join is one allocation, linked in at the head in the same small, fixed amount of work.' },
  { line: 4, objs: [xaaa, xaa, xa, ...RUN], fresh: 0, s: 'xaaa', dead: ['xa', 'xaa'], note: 'print s prints xaaa. Nineteen objects are on the list, and "xa" and "xaa" are garbage: nothing but the list itself can reach them. Only the list lets the VM find them again, which the collector in “Reclaiming memory” will do.' },
];

export default function HeapListSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const H = 28;
  const top = 30;
  const rows = 9;
  const label = (o: O) => (o.group ?? (o.chars !== undefined ? `"${o.chars}"` : `<${o.type}>`));
  return (
    <StepFrame title="Every object on one list" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={top + rows * H + 18} title="The heap's object list, newest object at the top, each pointing to the next older one">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>heap.objects</T>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>GLOBAL</T>
        <Arrow x1={40} y1={20} x2={96} y2={top + 10} />
        {st.objs.map((o, k) => {
          const y = top + k * H;
          const isDead = st.dead?.includes(o.chars ?? '');
          const isNew = k < st.fresh;
          const c = o.type === 'string' ? 'brand' : o.group ? 'muted' : 'accent';
          return (
            <g key={k}>
              <Box x={98} y={y} w={180} h={H - 6} r={4} fill={tok(c, isNew ? 0.3 : 0.08)} stroke={isDead ? tok('ink', 0.3) : tok(c)} dash={isDead}>
                <T x={108} y={y + (H - 6) / 2} size={12} mono opacity={isDead ? 0.5 : 1}>{label(o)}</T>
                {!o.group && <T x={270} y={y + (H - 6) / 2} size={11} anchor="end" fill={tok('muted')}>{isNew ? 'new' : isDead ? 'garbage' : ''}</T>}
              </Box>
              {k < st.objs.length - 1 && <line x1={110} y1={y + H - 6} x2={110} y2={y + H} stroke={tok('ink', 0.6)} strokeWidth={2} />}
            </g>
          );
        })}
        {st.s && (() => {
          const k = st.objs.findIndex((o) => o.chars === st.s);
          const y = top + k * H + (H - 6) / 2;
          return (
            <g>
              <Box x={330} y={28} w={40} h={24} r={4} stroke={tok('ink', 0.5)}>
                <T x={350} y={40} size={13} mono weight={700} anchor="middle">s</T>
              </Box>
              <Arrow x1={330} y1={44} x2={280} y2={y} bend={0.2} />
            </g>
          );
        })()}
        <T x={10} y={top + rows * H + 8} size={11} fill={tok('muted')}>each short line down is one next pointer</T>
      </Svg>
    </StepFrame>
  );
}
