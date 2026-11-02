import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// How rustc reads operators: innermost first, each operator becomes a
// trait method call, and each call needs an impl whose Rhs matches the
// right-hand type; Output gives the result type.

type S = { src: string; out: string[]; look?: { want: string; got: string; ok: boolean }; note: string };

const STATES: S[] = [
  { src: 'p.pos += p.vel * dt;', out: ['p.pos += p.vel * dt;'], note: 'p.pos and p.vel are V2s, dt is an f64. Two operators: * binds tighter than +=, so rustc deals with p.vel * dt first.' },
  { src: 'p.pos += p.vel * dt;', out: ['p.pos += Mul::mul(p.vel, dt);'], look: { want: 'impl Mul<f64> for V2', got: 'Output = V2', ok: true }, note: 'p.vel * dt becomes Mul::mul(p.vel, dt). The left type (V2) picks the impl and the right type (f64) must match its Rhs. Found: the product is a V2. p.vel is passed by value, but V2 is Copy, so p.vel stays usable.' },
  { src: 'p.pos += p.vel * dt;', out: ['AddAssign::add_assign(', '    &mut p.pos,', '    Mul::mul(p.vel, dt));'], look: { want: 'impl AddAssign<V2> for V2', got: '(no Output: in place)', ok: true }, note: '+= becomes AddAssign::add_assign with a mutable borrow of the left side. There is no Output: the call updates p.pos and produces ().' },
  { src: 'let o = &heap[h];', out: ['let o = &*Index::index(&heap, h);'], look: { want: 'impl Index<Gc<T>> for Heap', got: 'Output = T', ok: true }, note: 'Indexing too: heap[h] is *Index::index(&heap, h). drip-rs implements Index<Gc<T>> for Heap with Output = T, so a handle to a closure gives a closure object, a handle to a string a string.' },
  { src: 'let c = a + b;', out: ['let c = Add::add(a, b);'], look: { want: 'impl Add<V2> for V2', got: 'none found', ok: false }, note: 'No impl, no operator: rustc stops with error[E0369]: cannot add `V2` to `V2`, and notes that an implementation of Add might be missing.' },
];

export default function DesugarSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Operators are trait calls" steps={s} note={st.note}>
      <Svg w={400} h={190} title="The source line, what rustc rewrites it into, and the impl it looks for">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>YOU WRITE</T>
        <Box x={8} y={20} w={384} h={26} r={3}>
          <T x={16} y={33} size={12} mono>{st.src}</T>
        </Box>
        <T x={8} y={62} size={11} weight={700} fill={tok('muted')}>RUSTC READS</T>
        <Box x={8} y={70} w={384} h={14 + st.out.length * 16} r={3} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          {st.out.map((l, i) => <T key={i} x={16} y={84 + i * 16} size={12} mono>{l}</T>)}
        </Box>
        {st.look && (
          <g>
            <T x={8} y={142} size={11} weight={700} fill={tok('muted')}>IMPL NEEDED</T>
            <Box x={8} y={150} w={384} h={30} r={3} fill={tok(st.look.ok ? 'safe' : 'danger', 0.1)} stroke={tok(st.look.ok ? 'safe' : 'danger')}>
              <T x={16} y={165} size={11} mono>{st.look.want}</T>
              <T x={384} y={165} size={11} mono anchor="end" weight={700} fill={tok(st.look.ok ? 'safe' : 'danger')}>{st.look.ok ? '✓ ' : '✗ '}{st.look.got}</T>
            </Box>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
