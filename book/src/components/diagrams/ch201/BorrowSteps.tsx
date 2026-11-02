import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Many readers or one writer. Shared borrows (&) are drawn in the "safe"
// colour, the mutable borrow (&mut) in "warn", and an overlap the borrow
// checker rejects in "danger". The bars underneath show how long each
// borrow lives: from where it is made to its last use.

const OK = `let mut s = String::from("tea");
let a = &s;
let b = &s;
println!("{a} and {b}");
let w = &mut s;
w.push_str("pot");
println!("{s}");`;

const BAD = `let mut s = String::from("tea");
let a = &s;
let b = &s;
println!("{a} and {b}");
let w = &mut s;
w.push_str("pot");
println!("{a}");`;

type Ref = 'a' | 'b' | 'w';
type S = {
  code: string; line: number; val: string;
  live: Ref[]; ended: Ref[]; clash?: boolean; note: string;
};

const STATES: S[] = [
  { code: OK, line: 0, val: '"tea"', live: [], ended: [], note: 's owns the string. Nobody else can see it yet.' },
  { code: OK, line: 1, val: '"tea"', live: ['a'], ended: [], note: 'a = &s makes a shared borrow: an arrow that can read s but doesn’t own it. s still owns the string.' },
  { code: OK, line: 2, val: '"tea"', live: ['a', 'b'], ended: [], note: 'A second shared borrow. Two readers at once is fine: reading never disturbs another reader.' },
  { code: OK, line: 3, val: '"tea"', live: [], ended: ['a', 'b'], note: 'This println! is the last use of a and b, so both borrows end here, not at the closing brace. Their bars stop.' },
  { code: OK, line: 4, val: '"tea"', live: ['w'], ended: ['a', 'b'], note: 'w = &mut s is a mutable borrow: the one writer. It is allowed because no reader is still alive.' },
  { code: OK, line: 5, val: '"teapot"', live: ['w'], ended: ['a', 'b'], note: 'push_str changes the string through w. No reader can be surprised, because there are none.' },
  { code: OK, line: 6, val: '"teapot"', live: [], ended: ['a', 'b', 'w'], note: 'w was last used on the line before, so s is free again. It prints teapot.' },
  { code: BAD, line: 6, val: '"teapot"', live: ['a', 'w'], ended: ['b'], clash: true, note: 'Now change the last line to print a. a must live until here, so its bar overlaps w’s: a reader and a writer at once. The borrow checker rejects the program (error E0502).' },
];

// Rows of the timeline: which code lines each borrow covers.
function span(r: Ref, st: S): [number, number] | null {
  const bad = st.code === BAD;
  if (r === 'a') return st.line >= 1 ? [1, bad ? 6 : 3] : null;
  if (r === 'b') return st.line >= 2 ? [2, 3] : null;
  return st.line >= 4 ? [4, 5] : null;
}

export default function BorrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const ry = { a: 34, b: 74, w: 114 } as const;
  const name = (r: Ref) => (st.clash && r !== 'b' ? 'danger' : r === 'w' ? 'warn' : 'safe');
  const colour = (r: Ref) => tok(name(r));
  const shown = (r: Ref) => st.live.includes(r) || st.ended.includes(r);
  const lx = (line: number) => 70 + line * 46;
  return (
    <StepFrame title="Many readers or one writer" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={260} title="References a, b and w point at the String s. Shared borrows are one colour, the mutable borrow another; a bar chart shows how long each borrow lives.">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>BORROWS</T>
        <T x={250} y={12} size={11} weight={700} fill={tok('muted')}>OWNER</T>
        {(['a', 'b', 'w'] as const).map((r) => shown(r) && (
          <g key={r} opacity={st.live.includes(r) ? 1 : 0.3}>
            <Box x={10} y={ry[r] - 15} w={86} h={30} stroke={colour(r)} fill={tok(name(r), 0.12)}>
              <T x={20} y={ry[r]} size={15} mono weight={700}>{r}</T>
              <T x={40} y={ry[r]} size={12} mono fill={tok('muted')}>{r === 'w' ? '&mut' : '&'}</T>
            </Box>
            <Arrow x1={96} y1={ry[r]} x2={246} y2={74} color={colour(r)} dash={!st.live.includes(r)} bend={r === 'a' ? 0.2 : r === 'w' ? -0.2 : 0} />
          </g>
        ))}
        <Box x={248} y={50} w={142} h={48} r={8} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={258} y={64} size={11} fill={tok('muted')}>s: String</T>
          <T x={258} y={84} size={15} mono weight={700}>{st.val}</T>
        </Box>
        {st.clash && (
          <Box x={248} y={106} w={142} h={30} r={6} fill={tok('danger', 0.15)} stroke={tok('danger')}>
            <T x={319} y={121} size={12} weight={700} anchor="middle" fill={tok('danger')}>rejected: E0502</T>
          </Box>
        )}
        <T x={10} y={152} size={11} weight={700} fill={tok('muted')}>HOW LONG EACH BORROW LIVES (code lines 2–7)</T>
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <T key={l} x={lx(l) - 23} y={172} size={11} mono anchor="middle" fill={l === st.line ? tok('brand') : tok('muted')}>{l + 1}</T>
        ))}
        {(['a', 'b', 'w'] as const).map((r, k) => {
          const sp = span(r, st);
          const y = 186 + k * 22;
          return (
            <g key={r}>
              <T x={14} y={y + 7} size={12} mono weight={700}>{r}</T>
              {sp && <rect x={lx(sp[0]) - 44} y={y} width={(sp[1] - sp[0] + 1) * 46 - 2} height={14} rx={3} fill={colour(r)} opacity={0.75} />}
            </g>
          );
        })}
        {st.line >= 1 && <line x1={lx(st.line) - 23} x2={lx(st.line) - 23} y1={180} y2={252} stroke={tok('brand')} strokeWidth={1.5} strokeDasharray="3 3" />}
      </Svg>
    </StepFrame>
  );
}
