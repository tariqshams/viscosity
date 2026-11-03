// Operator traits, Drop and derive: the order in which Drop runs. The
// program is the chapter's runnable example (drop-order), and the printed
// lines are exactly what rustc 1.97 printed for it. Rules from the Rust
// Reference ("Destructors"): locals go in reverse order of declaration; a
// value's own Drop::drop runs first, then its fields, in declaration order;
// `let _ = e` binds nothing, so e is dropped at the end of the statement.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn main() {
    let _a = Noisy("a");
    let _p = Pair {
        left: Noisy("left"),
        right: Noisy("right"),
    };
    let _ = Noisy("underscore");
    let b = Noisy("b");
    drop(b);
    println!("main ends");
}`;

type V = 'a' | 'p' | 'left' | 'right' | 'b';
type S = { line: number; live: V[]; going?: V[]; out: string[]; note: string };

const OUT = [
  'drop underscore',
  'drop b',
  'main ends',
  'drop pair (left, right alive)',
  'drop left',
  'drop right',
  'drop a',
];

const STATES: S[] = [
  { line: 1, live: ['a'], out: [], note: '_a owns a Noisy, whose Drop impl prints a line. A name that starts with _ is still a name: _a owns its value until the end of main.' },
  { line: 2, live: ['a', 'p', 'left', 'right'], out: [], note: '_p owns a Pair, and the Pair owns its two fields. Pair has a Drop impl of its own, which prints and then leaves the fields alone.' },
  { line: 6, live: ['a', 'p', 'left', 'right'], out: OUT.slice(0, 1), note: 'let _ = binds nothing: _ is a pattern that matches without taking ownership. The new Noisy has no owner, so it is dropped at the end of this statement.' },
  { line: 7, live: ['a', 'p', 'left', 'right', 'b'], out: OUT.slice(0, 1), note: 'b owns a Noisy.' },
  { line: 8, live: ['a', 'p', 'left', 'right'], going: ['b'], out: OUT.slice(0, 2), note: 'drop(b) moves b into std::mem::drop, an empty function; its parameter goes out of scope as it returns, and that runs Noisy::drop. b.drop() would not compile (E0040).' },
  { line: 9, live: ['a', 'p', 'left', 'right'], out: OUT.slice(0, 3), note: 'Two values are still owned, by _a and _p, and nothing has dropped them yet.' },
  { line: 10, live: ['a', 'left', 'right'], going: ['p'], out: OUT.slice(0, 4), note: 'The closing brace drops locals in reverse order of declaration, so _p goes first. Its own Drop::drop runs before anything else, while both fields are still there to be read.' },
  { line: 10, live: ['a'], going: ['left', 'right'], out: OUT.slice(0, 6), note: 'Then the fields, in the order they are declared: left, then right. That is the opposite of the rule for locals, and you cannot change it from inside drop.' },
  { line: 10, live: [], going: ['a'], out: OUT, note: 'Last, _a. Every value was dropped exactly once, at a point you can find in the source without running it.' },
];

const SLOTS: { v: V; label: string; x: number; y: number; w: number }[] = [
  { v: 'a', label: '_a: Noisy("a")', x: 8, y: 22, w: 170 },
  { v: 'p', label: '_p: Pair', x: 8, y: 54, w: 170 },
  { v: 'left', label: 'left: Noisy', x: 24, y: 80, w: 154 },
  { v: 'right', label: 'right: Noisy', x: 24, y: 106, w: 154 },
  { v: 'b', label: 'b: Noisy("b")', x: 8, y: 140, w: 170 },
];

export default function DropOrderSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="When Drop runs, and in what order" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The values main owns, and the lines printed as each is dropped">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>OWNED BY main</T>
        <T x={196} y={10} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {SLOTS.map(({ v, label, x, y, w }) => {
          const live = st.live.includes(v);
          const going = st.going?.includes(v);
          if (!live && !going) return null;
          return (
            <Box key={v} x={x} y={y} w={w} h={22} r={3} dash={going}
              fill={going ? tok('danger', 0.12) : tok('accent', 0.12)} stroke={going ? tok('danger') : tok('accent')}>
              <T x={x + 8} y={y + 11} size={11} mono>{label}</T>
            </Box>
          );
        })}
        <Box x={192} y={20} w={204} h={150} r={3} fill={tok('panel')} stroke={tok('line')}>
          {st.out.map((l, i) => (
            <T key={i} x={200} y={32 + i * 19} size={10} mono weight={i >= (STATES[Math.max(0, s.i - 1)].out.length) && s.i > 0 ? 700 : 400}
              fill={i >= (STATES[Math.max(0, s.i - 1)].out.length) && s.i > 0 ? tok('danger') : undefined}>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
