import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 297: one program, four uses of First[T], compiled three ways.
// The Go row matches the symbols go build -gcflags=-S printed for this
// program with Go 1.24.7: First[go.shape.int], First[go.shape.float64]
// and one First[go.shape.*uint8] shared by *A and *B.
type Copy = { label: string; uses: string };
type S = { title: string; copies: Copy[]; extra: string; note: string };

const USES = ['int', 'float64', '*A', '*B'];

const STATES: S[] = [
  { title: 'The program', copies: [], extra: 'one generic function, four types', note: 'One generic function, First[T], returns xs[0]. The program calls it with four types: int, float64, and two pointer types, *A and *B.' },
  { title: 'Specialise (Rust, C++)', copies: USES.map((u) => ({ label: u, uses: u })), extra: '4 copies: each knows its type exactly', note: 'Specialisation makes one copy per type. Each copy uses the right registers and sizes, and can inline the type’s methods; four types cost four copies of the code.' },
  { title: 'Erase (Java, OCaml)', copies: [{ label: 'Object', uses: 'all four' }], extra: '1 copy; int and float64 must be boxed', note: 'Erasure makes one copy that works on one uniform kind of value, a single pointer-sized word. Pointers fit already; int and float64 are boxed (put in a heap object) so they fit too.' },
  { title: 'By shape (Go)', copies: [{ label: 'shape.int', uses: 'int' }, { label: 'shape.float64', uses: 'float64' }, { label: 'shape.*uint8', uses: '*A, *B' }], extra: '3 copies + a dictionary per call', note: 'Go’s middle path: one copy per gcshape. Every pointer type has the same shape, so *A and *B share a copy; a hidden dictionary argument tells it which type it really has.' },
];

export default function StrategySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Three ways to compile one generic function" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The four uses of First, and the copies of compiled code each strategy makes for them">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>THE PROGRAM CALLS First WITH</T>
        {USES.map((u, k) => (
          <Box key={u} x={6 + k * 98} y={22} w={92} h={28}>
            <T x={52 + k * 98} y={36} size={12} mono anchor="middle">{u}</T>
          </Box>
        ))}
        <T x={6} y={72} size={11} weight={700} fill={tok('muted')}>COMPILED COPIES: {st.title.toUpperCase()}</T>
        {st.copies.length === 0 && (
          <Box x={6} y={84} w={388} h={110} dash fill="transparent">
            <T x={200} y={139} size={12} anchor="middle" fill={tok('muted')}>step on to compile it</T>
          </Box>
        )}
        {st.copies.map((c, k) => {
          const w = st.copies.length === 1 ? 388 : st.copies.length === 3 ? 126 : 92;
          const x = 6 + k * (w + (st.copies.length === 3 ? 5 : st.copies.length === 1 ? 0 : 6));
          return (
            <Box key={c.label} x={x} y={84} w={w} h={110} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={x + w / 2} y={102} size={11} anchor="middle" fill={tok('muted')}>copy for</T>
              <T x={x + w / 2} y={122} size={12} mono anchor="middle" weight={700}>{c.label}</T>
              <T x={x + w / 2} y={140} size={11} anchor="middle" fill={tok('muted')}>serves</T>
              <T x={x + w / 2} y={160} size={12} mono anchor="middle">{c.uses}</T>
            </Box>
          );
        })}
        <T x={6} y={220} size={12}>{st.extra}</T>
      </Svg>
    </StepFrame>
  );
}
