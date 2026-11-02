import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 363-b: two arenas, two handle types. Both handles below hold the
// number 0, but one is a Gc<Class> and the other a Gc<Instance>, so the
// compiler only lets each index its own arena. The E0308 text and the
// 4-byte size are real rustc 1.97 output of the chapter's example.
const CODE = `let k = classes.insert(Ship);
let a = insts.insert(Instance {
    class: k, hp: 10.0 });
insts[a].hp += 1.0;
let c = insts[a].class;
classes[c].name;
insts[k]; // E0308`;

type S = { line: number; k?: boolean; a?: boolean; look?: 'insts' | 'classes' | 'bad'; note: string };

const STATES: S[] = [
  { line: 0, k: true, note: 'insert puts Ship in slot 0 of the classes arena and returns a handle: k is a Gc<Class> holding the number 0.' },
  { line: 1, k: true, a: true, note: 'An instance goes into slot 0 of the instances arena: a is a Gc<Instance>, also holding 0. Same number, different types. Its class field stores the handle k.' },
  { line: 3, k: true, a: true, look: 'insts', note: 'insts[a] works: the instances arena accepts only Gc<Instance>, and a is one. It finds slot 0 and the hp is changed in place.' },
  { line: 5, k: true, a: true, look: 'classes', note: 'Copy the class handle out (a 4-byte number), then index the classes arena with it. A Gc<Class> into the classes arena: allowed.' },
  { line: 6, k: true, a: true, look: 'bad', note: 'insts[k] would read slot 0 of the instances arena with a class’s number. With a bare usize that would quietly return the wrong object; here it does not compile: E0308, expected Gc<Instance>, found Gc<Class>.' },
];

export default function HandleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const lit = (w: 'insts' | 'classes') => st.look === w || (st.look === 'bad' && w === 'insts');
  return (
    <StepFrame title="Same number, different types" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Two arenas and two handles that both hold slot number 0">
        <T x={8} y={14} size={11} weight={700} fill={tok('f2')}>classes: Arena&lt;Class&gt;</T>
        <Box x={8} y={22} w={170} h={34} fill={lit('classes') ? tok('f2', 0.18) : tok('panel')} stroke={tok('f2')}>
          <T x={20} y={39} size={12} mono>0: {st.k ? 'Ship' : '-'}</T>
        </Box>
        <T x={210} y={14} size={11} weight={700} fill={tok('f1')}>insts: Arena&lt;Instance&gt;</T>
        <Box x={210} y={22} w={182} h={34} fill={st.look === 'bad' ? tok('danger', 0.12) : lit('insts') ? tok('f1', 0.18) : tok('panel')} stroke={st.look === 'bad' ? tok('danger') : tok('f1')}>
          <T x={222} y={39} size={12} mono>0: {st.a ? (st.line >= 3 ? 'hp 11, class k' : 'hp 10, class k') : '-'}</T>
        </Box>
        <T x={8} y={80} size={11} weight={700} fill={tok('muted')}>HANDLES (4 bytes each)</T>
        {st.k && <Box x={8} y={90} w={170} h={30} fill={tok('panel')} stroke={tok('f2')}><T x={20} y={105} size={12} mono>k: Gc&lt;Class&gt; = 0</T></Box>}
        {st.a && <Box x={210} y={90} w={182} h={30} fill={tok('panel')} stroke={tok('f1')}><T x={222} y={105} size={12} mono>a: Gc&lt;Instance&gt; = 0</T></Box>}
        {st.look === 'bad' && <T x={200} y={140} size={11} mono anchor="middle" fill={tok('danger')}>expected `Gc&lt;Instance&gt;`, found `Gc&lt;Class&gt;`</T>}
      </Svg>
    </StepFrame>
  );
}
