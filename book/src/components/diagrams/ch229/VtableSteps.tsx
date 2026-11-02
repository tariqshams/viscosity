import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 229: what is behind `&dyn Plugin`. Each reference is a data
// pointer plus a vtable pointer (The Rust Reference, "Trait objects");
// a vtable holds one function pointer per trait method for that type.
// Slot order and layout here are illustrative.
const CODE = `let ps: Vec<&dyn Plugin> =
    vec![&Js, &Py];
for p in &ps {
    println!("{}", p.id());
}`;

type Hi = 'none' | 'js' | 'py';
type S = { line: number | null; hi: Hi; slot?: 'id' | 'handles'; out?: string; note: string };

const STATES: S[] = [
  { line: 0, hi: 'none', note: 'ps holds two references of one type, &dyn Plugin, even though they point at a Js and a Py. Each reference is two words: 16 bytes on this machine.' },
  { line: 2, hi: 'js', note: 'The first p: its data pointer leads to the Js value; its vtable pointer leads to the table the compiler made for “Plugin for Js”.' },
  { line: 3, hi: 'js', slot: 'id', out: 'javascript', note: 'p.id() doesn’t search for a method called id. It reads id’s fixed slot in that vtable, finds Js’s id, and calls it with the data pointer as self.' },
  { line: 3, hi: 'py', slot: 'id', out: 'python', note: 'The same machine code runs for the second p. Only the vtable pointer differs, so the same slot now leads to Py’s id.' },
  { line: null, hi: 'none', slot: 'handles', note: 'handles was a default method, written once in the trait. Each vtable still gets its own entry for it: the default body, compiled for that type.' },
];

const VT = [
  { who: 'js', name: 'Plugin for Js', y: 30, fns: ['Js::id', 'Js::exts', 'handles (default)'], col: 'f3' },
  { who: 'py', name: 'Plugin for Py', y: 140, fns: ['Py::id', 'Py::exts', 'handles (default)'], col: 'f4' },
] as const;

export default function VtableSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Two pointers per trait object" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={250} title="Fat pointers in a Vec, each pointing at a value and at a vtable">
        <T x={8} y={14} size={11} weight={700} fill={tok('brand')}>ps</T>
        {VT.map((v, k) => {
          const y = 30 + k * 110;
          const on = st.hi === v.who;
          return (
            <g key={v.who}>
              <Box x={8} y={y} w={44} h={30} r={3} fill={on ? tok(v.col, 0.2) : tok('panel')} stroke={on ? tok(v.col) : tok('line')}>
                <T x={30} y={y + 15} size={10} mono anchor="middle">data</T>
              </Box>
              <Box x={54} y={y} w={52} h={30} r={3} fill={on ? tok(v.col, 0.2) : tok('panel')} stroke={on ? tok(v.col) : tok('line')}>
                <T x={80} y={y + 15} size={10} mono anchor="middle">vtable</T>
              </Box>
              <Box x={20} y={y + 58} w={60} h={28} r={3} stroke={on ? tok(v.col) : tok('line')}>
                <T x={50} y={y + 72} size={11} mono anchor="middle">{v.who === 'js' ? 'Js' : 'Py'}</T>
              </Box>
              <Arrow x1={30} y1={y + 30} x2={40} y2={y + 56} color={on ? tok(v.col) : tok('ink', 0.4)} />
              <Arrow x1={106} y1={y + 15} x2={196} y2={v.y + 30} color={on ? tok(v.col) : tok('ink', 0.4)} />
              <T x={198} y={v.y - 8} size={10} weight={700} fill={tok(v.col)}>{v.name}</T>
              {v.fns.map((f, j) => {
                const lit = (on && st.slot === 'id' && j === 0) || (st.slot === 'handles' && j === 2);
                return (
                  <Box key={f} x={198} y={v.y + j * 26} w={150} h={24} r={2} fill={lit ? tok(v.col, 0.25) : 'transparent'} stroke={lit ? tok(v.col) : tok('line')}>
                    <T x={206} y={v.y + j * 26 + 12} size={10} mono>{f}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        {st.out && <T x={200} y={240} size={12} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
