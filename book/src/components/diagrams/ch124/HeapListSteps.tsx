import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The companion VM's object list for this program, newest first, exactly as
// heap.objects held it when the program was run.
const CODE = `let s = "x";
for (let i = 0; i < 3; i = i + 1) {
  s = s + "a";
}
print s;`;

type O = { type: string; chars?: string };
const START: O[] = [{ type: 'native' }, { type: 'string', chars: 'clock' }, { type: 'string', chars: 'init' }];
const COMPILED: O[] = [{ type: 'string', chars: 'a' }, { type: 'string', chars: 'x' }, { type: 'string', chars: 's' }, { type: 'function' }, ...START];
const RUN: O[] = [{ type: 'closure' }, ...COMPILED];
const xa: O = { type: 'string', chars: 'xa' };
const xaa: O = { type: 'string', chars: 'xaa' };
const xaaa: O = { type: 'string', chars: 'xaaa' };

type S = { line: number | null; objs: O[]; fresh: number; s?: string; dead?: string[]; note: string };

const STATES: S[] = [
  { line: null, objs: START, fresh: 3, note: 'Before any of your code, the VM allocates three objects: the strings "init" and "clock", and the native function clock. Each new one went in at the head, so the oldest, "init", is at the end.' },
  { line: null, objs: COMPILED, fresh: 4, note: 'Compiling allocates four more: the function holding the script’s bytecode, the name "s" for the global, and the literals "x" and "a" for the constant pool. Literals become objects at compile time.' },
  { line: 0, objs: RUN, fresh: 1, s: 'x', note: 'Running starts by wrapping the script in a closure (chapter 132). let s = "x" allocates nothing: the global s points at the "x" object the compiler already made.' },
  { line: 2, objs: [xa, ...RUN], fresh: 1, s: 'xa', note: 's + "a" is OP_ADD on two strings. Their characters are joined and copyString allocates a brand-new object, "xa", at the head of the list. s now points there.' },
  { line: 2, objs: [xaa, xa, ...RUN], fresh: 1, s: 'xaa', note: 'Second time round: another new object, "xaa". Nothing points at "xa" any more, but it stays on the list.' },
  { line: 2, objs: [xaaa, xaa, xa, ...RUN], fresh: 1, s: 'xaaa', note: 'Third time: "xaaa". Every concatenation is one allocation, linked in at the head in constant time.' },
  { line: 4, objs: [xaaa, xaa, xa, ...RUN], fresh: 0, s: 'xaaa', dead: ['xa', 'xaa'], note: 'print s prints xaaa. Eleven objects are on the list; "xa" and "xaa" are garbage, reachable from nothing but the list itself. Only the list lets the VM find them again, which chapter 133’s collector will do.' },
];

export default function HeapListSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const H = 26;
  const top = 30;
  const label = (o: O) => (o.chars !== undefined ? `"${o.chars}"` : `<${o.type}>`);
  return (
    <StepFrame title="Every object on one list" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={top + 11 * H + 10} title="The heap's object list, newest object at the top, each pointing to the next older one">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>heap.objects</T>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS</T>
        <Arrow x1={40} y1={20} x2={96} y2={top + 10} />
        {st.objs.map((o, k) => {
          const y = top + k * H;
          const isDead = st.dead?.includes(o.chars ?? '');
          const isNew = k < st.fresh;
          const c = o.type === 'string' ? 'brand' : 'accent';
          return (
            <g key={k}>
              <Box x={98} y={y} w={150} h={H - 6} r={4} fill={tok(c, isNew ? 0.3 : 0.08)} stroke={isDead ? tok('ink', 0.3) : tok(c)} dash={isDead}>
                <T x={108} y={y + (H - 6) / 2} size={12} mono opacity={isDead ? 0.5 : 1}>{label(o)}</T>
                <T x={240} y={y + (H - 6) / 2} size={9} anchor="end" fill={tok('muted')}>{isNew ? 'new' : isDead ? 'garbage' : ''}</T>
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
              <Arrow x1={330} y1={44} x2={250} y2={y} bend={0.2} />
            </g>
          );
        })()}
        <T x={10} y={top + 11 * H} size={10} fill={tok('muted')}>each line down = one next pointer</T>
      </Svg>
    </StepFrame>
  );
}
