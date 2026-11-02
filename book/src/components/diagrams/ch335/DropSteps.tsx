// Chapter 335: when values are dropped. Stack slots on the left, grouped
// by the scope (block) that owns them; heap text on the right. At each
// closing brace the scope's owners are dropped in reverse order of
// declaration, and assigning to a mut variable drops its old value first.
// Both rules are the Rust Reference's ("Destructors"), and the order was
// checked by running an equivalent program with rustc 1.97.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn main() {
    let a = String::from("a");
    {
        let b = String::from("bb");
        let c = String::from("ccc");
    } // c, then b, dropped
    let mut d = String::from("d1");
    d = String::from("d2");
} // d, then a, dropped`;

type H = 'a' | 'bb' | 'ccc' | 'd1' | 'd2';
type S = { line: number; inner: boolean; vars: { name: string; owns: H; inner?: boolean }[]; freed: H[]; hl?: H; note: string };

const A = { name: 'a', owns: 'a' as H };
const B = { name: 'b', owns: 'bb' as H, inner: true };
const C = { name: 'c', owns: 'ccc' as H, inner: true };

const STATES: S[] = [
  { line: 0, inner: false, vars: [], freed: [], note: 'main starts with nothing. On the left, the variables (stack slots), grouped by the block that owns them; on the right, the heap.' },
  { line: 1, inner: false, vars: [A], freed: [], hl: 'a', note: 'a owns a String: its slot on the stack holds a pointer, a length and a capacity, and the text "a" lives on the heap. The arrow is ownership.' },
  { line: 3, inner: true, vars: [A, B], freed: [], hl: 'bb', note: 'A new block opens a new scope. b is declared inside it, so b belongs to the inner scope.' },
  { line: 4, inner: true, vars: [A, B, C], freed: [], hl: 'ccc', note: 'c too. Two owners in the inner scope now, declared b first, then c.' },
  { line: 5, inner: true, vars: [A, B], freed: ['ccc'], hl: 'ccc', note: 'The closing brace ends the inner scope, and its owners are dropped in REVERSE order of declaration: c first. Its heap text is freed at once.' },
  { line: 5, inner: false, vars: [A], freed: ['ccc', 'bb'], hl: 'bb', note: 'Then b. Nothing traced the heap and nothing counted references: the drop points were fixed by the shape of the code, before it ever ran.' },
  { line: 6, inner: false, vars: [A, { name: 'd', owns: 'd1' }], freed: ['ccc', 'bb'], hl: 'd1', note: 'let mut d owns "d1".' },
  { line: 7, inner: false, vars: [A, { name: 'd', owns: 'd2' }], freed: ['ccc', 'bb', 'd1'], hl: 'd1', note: 'Assigning a new String to d drops the old one first: "d1" is freed right here, mid-scope, because nothing owns it any more.' },
  { line: 8, inner: false, vars: [A], freed: ['ccc', 'bb', 'd1', 'd2'], hl: 'd2', note: 'main’s closing brace ends the outer scope. Reverse order again: d first, so "d2" is freed...' },
  { line: 8, inner: false, vars: [], freed: ['ccc', 'bb', 'd1', 'd2', 'a'], hl: 'a', note: '...then a. Every allocation was freed exactly once, at a point you can see in the source. That is the whole of rule three.' },
];

const HEAP: H[] = ['a', 'bb', 'ccc', 'd1', 'd2'];

export default function DropSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const shown = HEAP.filter((h) => st.vars.some((v) => v.owns === h) || st.freed.includes(h));
  const hy = (h: H) => 30 + shown.indexOf(h) * 30;
  const outer = st.vars.filter((v) => !v.inner);
  const inner = st.vars.filter((v) => v.inner);
  const vy = (k: number, isInner: boolean) => (isInner ? 92 + k * 30 : 30 + k * 30);
  return (
    <StepFrame title="Owners, scopes and drops" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="Stack slots grouped by scope, and heap text that is freed when its owner is dropped">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STACK (by scope)</T>
        <T x={250} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <Box x={4} y={20} w={150} h={150} fill="transparent" stroke={tok('line')} dash />
        <T x={150} y={164} size={11} anchor="end" fill={tok('muted')}>main</T>
        {st.inner && (
          <g>
            <Box x={12} y={80} w={134} h={70} fill={tok('brand', 0.06)} stroke={tok('brand')} dash />
            <T x={146} y={72} size={11} anchor="end" fill={tok('brand')}>inner block</T>
          </g>
        )}
        {[...outer.map((v, k) => ({ v, y: vy(k, false) })), ...inner.map((v, k) => ({ v, y: vy(k, true) }))].map(({ v, y }) => (
          <g key={v.name}>
            <T x={24} y={y + 12} size={13} mono weight={700}>{v.name}</T>
            <Box x={40} y={y} w={80} h={24} fill={tok('panel')} stroke={tok('ink', 0.5)}>
              <T x={80} y={y + 12} size={11} mono anchor="middle">ptr len cap</T>
            </Box>
            <Arrow x1={120} y1={y + 12} x2={244} y2={hy(v.owns) + 12} color={st.hl === v.owns ? tok('brand') : tok('ink', 0.5)} />
          </g>
        ))}
        {shown.map((h) => {
          const freed = st.freed.includes(h);
          return (
            <g key={h}>
              <Box x={248} y={hy(h)} w={70} h={24} dash={freed} fill={freed ? 'transparent' : tok('accent', 0.12)} stroke={freed ? tok('muted') : tok('accent')}>
                <T x={283} y={hy(h) + 12} size={13} mono anchor="middle" opacity={freed ? 0.35 : 1}>"{h}"</T>
              </Box>
              {freed && <T x={326} y={hy(h) + 12} size={11} fill={st.hl === h ? tok('danger') : tok('muted')} weight={st.hl === h ? 700 : 400}>freed</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
