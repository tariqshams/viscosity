import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 127: how long each value lives, against how long the borrow
// inside the token must stay valid. The program is the one in the
// chapter; rustc 1.97 rejects it with E0597 (run in the chapter).
const FIXED = [
  'let src = String::from("let x");',
  'let t;',
  '{',
  '  let mut sc = Scanner::new(&src);',
  '  t = sc.next();',
  '}',
  'println!("{}", t.lexeme);',
];

const LINES = [
  'let t;',
  '{',
  '  let src = String::from("let x");',
  '  let mut sc = Scanner::new(&src);',
  '  t = sc.next();',
  '}',
  'println!("{}", t.lexeme);',
];

type Span = [number, number] | null;
type S = {
  line: number;
  src: Span;
  sc: Span;
  t: Span;
  need: Span;
  arrows: ('sc' | 't')[];
  bad?: boolean;
  fixed?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: 0, src: null, sc: null, t: [0, 0], need: null, arrows: [], note: 't is declared but has no value yet. Rust lets you fill it in later, once.' },
  { line: 2, src: [2, 2], sc: null, t: [0, 2], need: null, arrows: [], note: 'src is born inside the block. It owns the text "let x" on the heap, and will be dropped at the closing brace.' },
  { line: 3, src: [2, 3], sc: [3, 3], t: [0, 3], need: [3, 3], arrows: ['sc'], note: 'sc borrows src. Its type is Scanner<\'src>: \'src is the stretch of code during which that borrow must stay valid (the bracket on the right).' },
  { line: 4, src: [2, 4], sc: [3, 4], t: [0, 4], need: [3, 4], arrows: ['sc', 't'], note: 'next() returns a Token<\'src>. Its lexeme points into src’s text, not into sc. So t carries the same \'src as the scanner.' },
  { line: 5, src: [2, 5], sc: [3, 5], t: [0, 5], need: [3, 5], arrows: ['t'], note: 'The block ends. sc is dropped, which is fine: nothing borrows sc. src is dropped too, and t still points into its text.' },
  { line: 6, src: [2, 5], sc: [3, 5], t: [0, 6], need: [3, 6], arrows: ['t'], bad: true, note: 'Line 7 reads t.lexeme, so \'src must reach line 7. But src died on line 6, so t would point at nothing (the dashed arrow). The bracket sticks out past the owner’s bar: error E0597, “src does not live long enough”.' },
  { line: 0, fixed: true, src: [0, 6], sc: [3, 5], t: [1, 6], need: [3, 6], arrows: ['t'], note: 'The fix: declare src first, outside the block. Now the owner’s bar covers the whole bracket, so every use of the borrow is safe, and the program compiles. Nothing is checked at run time.' },
];

const ROW = 26;
const TOP = 28;
const y = (k: number) => TOP + k * ROW;
const COLS = [
  { key: 'src', x: 262, col: 'accent' },
  { key: 'sc', x: 302, col: 'safe' },
  { key: 't', x: 342, col: 'f4' },
] as const;

export default function LifetimeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Who outlives whom" steps={s} note={st.note}>
      <Svg w={400} h={230} title="Code lines on the left, the life of each variable as a bar on the right">
        {COLS.map((c) => (
          <T key={c.key} x={c.x} y={12} size={11} mono weight={700} anchor="middle" fill={tok(c.col)}>{c.key}</T>
        ))}
        <T x={392} y={12} size={11} mono weight={700} anchor="end" fill={tok('brand')}>'src</T>
        {(st.fixed ? FIXED : LINES).map((l, k) => (
          <g key={k}>
            {k === st.line && <rect x={0} y={y(k) - 11} width={250} height={22} fill={tok('brand', 0.15)} />}
            <T x={2} y={y(k)} size={11} mono fill={tok('muted')}>{k + 1}</T>
            <T x={14} y={y(k)} size={11} mono>{l.replace(/^ +/, (m) => '\u00a0'.repeat(m.length))}</T>
          </g>
        ))}
        {COLS.map((c) => {
          const sp = st[c.key];
          if (!sp) return null;
          const top = y(sp[0]) - 9;
          const bad = st.bad && c.key === 't';
          return (
            <Box key={c.key} x={c.x - 7} y={top} w={14} h={y(sp[1]) + 9 - top} r={3} fill={tok(c.col, 0.3)} stroke={bad ? tok('danger') : tok(c.col)} />
          );
        })}
        {st.need && (
          <g>
            <path d={`M378,${y(st.need[0]) - 9} h6 V${y(st.need[1]) + 9} h-6`} fill="none" stroke={st.bad ? tok('danger') : tok('brand')} strokeWidth={2} />
          </g>
        )}
        {st.arrows.includes('sc') && st.sc && (
          <Arrow x1={c2('sc') - 7} y1={y(3)} x2={c2('src') + 8} y2={y(3)} color={tok('safe')} />
        )}
        {st.arrows.includes('t') && (
          <Arrow x1={c2('t') - 7} y1={y(st.bad ? 6 : 4) + 4} x2={c2('src') + 8} y2={y(st.bad ? 6 : 4) + 4} bend={0.6} dash={st.bad} color={st.bad ? tok('danger') : tok('f4')} />
        )}
        {st.bad && (
          <T x={200} y={222} size={11} mono anchor="middle" fill={tok('danger')}>error[E0597]: `src` does not live long enough</T>
        )}
      </Svg>
    </StepFrame>
  );
}

function c2(k: 'src' | 'sc' | 't') {
  return COLS.find((c) => c.key === k)!.x;
}
