import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 384b: the token trees a derive receives for
//   struct Point { x: f64, y: f64 }
// The top level (Ident struct, Ident Point, one brace Group) is what a
// derive macro printed with rustc 1.97.0 in the chapter's scratch
// workspace; the inside follows the Rust Reference's description of
// token trees (Ident, Punct, Literal, Group).
type Node = { t: string; kind: 'Ident' | 'Punct' | 'Group' };
const TOP: Node[] = [
  { t: 'struct', kind: 'Ident' },
  { t: 'Point', kind: 'Ident' },
  { t: '{ … }', kind: 'Group' },
];
const INNER: Node[] = [
  { t: 'x', kind: 'Ident' }, { t: ':', kind: 'Punct' }, { t: 'f64', kind: 'Ident' }, { t: ',', kind: 'Punct' },
  { t: 'y', kind: 'Ident' }, { t: ':', kind: 'Punct' }, { t: 'f64', kind: 'Ident' },
];
const COL = { Ident: 'f1', Punct: 'f3', Group: 'f2' } as const;

type S = { top: number; inner: number; hi: number[]; note: string };
const STATES: S[] = [
  { top: 0, inner: 0, hi: [], note: 'The source text: struct Point { x: f64, y: f64 }. The compiler has already scanned it into tokens and matched the brackets; that is all the structure a macro gets.' },
  { top: 2, inner: 0, hi: [0, 1], note: 'Top level, trees 1 and 2: Ident struct and Ident Point. A keyword is just an Ident; nothing says “this starts a struct”.' },
  { top: 3, inner: 0, hi: [2], note: 'Tree 3 is a Group with brace delimiters. Everything between { and } is inside it, so the top level has only three trees.' },
  { top: 3, inner: 7, hi: [], note: 'Open the group: seven more trees, flat. x, :, f64, the comma, y, :, f64. No tree says “field”; the macro (or syn) must find the pattern “name, colon, type” itself.' },
  { top: 3, inner: 7, hi: [-1, -5], note: 'The field names are the identifiers that start each comma-separated piece. With paths like std::string::String or types like HashMap<K, V> that rule gets harder, which is the exercise.' },
];

export default function TokenTreeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Token trees of a struct" steps={s} note={st.note}>
      <Svg w={400} h={200} title="The top-level token trees of a struct, and the trees inside its brace group">
        <T x={8} y={16} size={12} mono>struct Point {'{'} x: f64, y: f64 {'}'}</T>
        <T x={8} y={44} size={11} weight={700} fill={tok('muted')}>top level</T>
        {TOP.slice(0, st.top).map((n, k) => (
          <Box key={k} x={8 + k * 100} y={54} w={92} h={34} r={4}
            fill={tok(COL[n.kind], st.hi.includes(k) ? 0.3 : 0.12)} stroke={tok(COL[n.kind])}>
            <T x={54 + k * 100} y={66} size={11} anchor="middle" fill={tok('muted')}>{n.kind}</T>
            <T x={54 + k * 100} y={80} size={12} mono anchor="middle">{n.t}</T>
          </Box>
        ))}
        {st.inner > 0 && <T x={8} y={112} size={11} weight={700} fill={tok('muted')}>inside the Group</T>}
        {INNER.slice(0, st.inner).map((n, k) => {
          const hit = st.hi.includes(-(k + 1));
          return (
            <Box key={k} x={8 + k * 55} y={122} w={50} h={44} r={4}
              fill={tok(COL[n.kind], hit ? 0.35 : 0.12)} stroke={hit ? tok('brand') : tok(COL[n.kind])}>
              <T x={33 + k * 55} y={136} size={11} anchor="middle" fill={tok('muted')}>{n.kind}</T>
              <T x={33 + k * 55} y={154} size={12} mono anchor="middle">{n.t}</T>
            </Box>
          );
        })}
        {st.inner > 0 && <T x={392} y={188} size={11} anchor="end" fill={tok('muted')}>no “field” node: just trees</T>}
      </Svg>
    </StepFrame>
  );
}
