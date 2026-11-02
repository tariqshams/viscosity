import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One Option<String>, matched five ways. The pill row shows the default
// binding mode after rustc has looked through any references; the picture
// shows whether s took the string (move) or points at it (a borrow).

type Mode = 'move' | 'ref' | 'ref mut';
type S = { code: string; mode: Mode; ty: string; moved: boolean; extra?: string; note: string };

const STATES: S[] = [
  {
    code: `match v {\n    Some(s) => ..., // s: String\n    None => ...,\n}`,
    mode: 'move', ty: 's : String', moved: true,
    note: 'v is matched by value. The mode starts as move and nothing changes it, so s takes the String out of v. v is now partially moved: using it again is error E0382.',
  },
  {
    code: `match &v {\n    Some(s) => ..., // s: &String\n    None => ...,\n}`,
    mode: 'ref', ty: 's : &String', moved: false,
    note: 'Now the value is a &Option<String>, but the pattern Some(..) is not a reference pattern. rustc looks through the & and switches the mode to ref, so s borrows the string and v stays whole.',
  },
  {
    code: `match &mut v {\n    Some(s) => s.push('!'),\n    None => {}\n}`,
    mode: 'ref mut', ty: 's : &mut String', moved: false,
    note: 'Through &mut the mode becomes ref mut, so s is a &mut String: it may change the string inside v (push adds a !), and nobody else may look at v meanwhile.',
  },
  {
    code: `match v {\n    Some(ref s) => ..., // &String\n    None => ...,\n}`,
    mode: 'move', ty: 's : &String', moved: false, extra: 'ref',
    note: 'Matched by value again, so the default mode is move; but the word ref asks for a borrow for this one name. This is the fix rustc suggests for E0382. ref matches nothing; it only changes how s is bound.',
  },
  {
    code: `let pair = (Some(v), 7);\nmatch &pair {\n    (Some(s), n) => ..., // &String, &i32\n    _ => ...,\n}`,
    mode: 'ref', ty: 's : &String   n : &i32', moved: false,
    note: 'The mode is decided from the outside in and then kept: once rustc has looked through the & on the pair, every name inside, however deep, is bound in ref mode. Even the number n is a &i32.',
  },
];

const MODES: Mode[] = ['move', 'ref', 'ref mut'];

export default function BindingSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const borrow = !st.moved;
  return (
    <StepFrame title="Move, ref and ref mut: one pattern, three outcomes" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.code.split('\n').findIndex((l) => l.includes('Some(s') || l.includes('Some(ref'))} />
      <Svg w={400} h={170} title="The default binding mode, and whether s owns the string or points at it inside v">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>DEFAULT BINDING MODE</T>
        {MODES.map((m, i) => (
          <Box key={m} x={8 + i * 92} y={24} w={84} h={26} r={13}
            fill={st.mode === m ? tok('brand', 0.18) : tok('panel')} stroke={st.mode === m ? tok('brand') : tok('line')}>
            <T x={50 + i * 92} y={37} size={12} mono weight={st.mode === m ? 700 : 400} anchor="middle">{m}</T>
          </Box>
        ))}
        {st.extra && <T x={290} y={37} size={11} fill={tok('accent')}>+ explicit ref</T>}

        <T x={8} y={70} size={11} weight={700} fill={tok('muted')}>{st.code.startsWith('let pair') ? 'pair.0' : 'v'}</T>
        <Box x={8} y={78} w={170} h={50} r={4}>
          <T x={18} y={103} size={12} mono>Some(</T>
          <Box x={62} y={88} w={94} h={30} r={3} dash={st.moved}
            fill={st.moved ? tok('panel') : tok('f1', 0.15)} stroke={st.moved ? tok('line') : tok('f1')}>
            <T x={109} y={103} size={12} mono anchor="middle" fill={st.moved ? tok('muted') : undefined}>
              {st.moved ? '(moved)' : st.mode === 'ref mut' ? '"drip!"' : '"drip"'}
            </T>
          </Box>
          <T x={162} y={103} size={12} mono>)</T>
        </Box>

        <T x={250} y={70} size={11} weight={700} fill={tok('muted')}>s</T>
        <Box x={250} y={78} w={140} h={50} r={4} fill={borrow ? tok('panel') : tok('f1', 0.15)} stroke={borrow ? tok('line') : tok('f1')}>
          <T x={320} y={103} size={12} mono anchor="middle">{borrow ? (st.mode === 'ref mut' ? '&mut ●' : '& ●') : '"drip"'}</T>
        </Box>
        {borrow
          ? <Arrow x1={262} y1={112} x2={158} y2={112} bend={0.4} color={st.mode === 'ref mut' ? tok('danger') : tok('brand')} />
          : <Arrow x1={160} y1={96} x2={248} y2={96} color={tok('f1')} />}
        <T x={8} y={152} size={12} mono weight={700}>{st.ty}</T>
      </Svg>
    </StepFrame>
  );
}
