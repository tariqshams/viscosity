import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 286: two C files compiled on their own, then linked; after an
// edit to one file, only that file is compiled again. The symbol lists
// are the real `nm` output (clang 18, x86-64).
type S = {
  sq: 'src' | 'obj' | 'edit';
  main: 'src' | 'obj';
  linked: boolean;
  reuse?: boolean;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { sq: 'src', main: 'src', linked: false, note: 'Two source files. sq.c defines sq; main.c only declares it (int sq(int x);) and calls it. Neither file can see the other.' },
  { sq: 'obj', main: 'src', linked: false, note: 'clang -c sq.c compiles one file on its own. The object file sq.o lists one symbol it defines: T sq (T means "in the code section").' },
  { sq: 'obj', main: 'obj', linked: false, note: 'clang -c main.c needs only the declaration to type-check the call. main.o defines main and lists U sq: undefined here, needed from somewhere else.' },
  { sq: 'obj', main: 'obj', linked: true, out: '49', note: 'The linker pairs U sq with T sq, fills the hole in main and writes one program, which prints 49.' },
  { sq: 'edit', main: 'obj', linked: false, note: 'Now change sq.c. Only sq.c is compiled again; main.o is reused as it is, because nothing it was compiled against has changed.' },
  { sq: 'obj', main: 'obj', linked: true, reuse: true, out: '49', note: 'One compile and one link, instead of compiling everything. With thousands of files, this is the whole point.' },
];

export default function SeparateSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const srcBox = (x: number, name: string, line: string, hot: boolean) => (
    <Box x={x} y={8} w={170} h={46} fill={hot ? tok('brand', 0.1) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x + 10} y={24} size={12} mono weight={700}>{name}</T>
      <T x={x + 10} y={42} size={11} mono>{line}</T>
    </Box>
  );
  const objBox = (x: number, name: string, syms: string[], on: boolean, faded?: boolean) => (
    <Box x={x} y={84} w={170} h={56} dash={!on} fill={on ? tok('f3', faded ? 0.05 : 0.12) : 'transparent'} stroke={on ? tok('f3') : tok('line')}>
      <T x={x + 10} y={100} size={12} mono weight={700}>{on ? name : ''}</T>
      {on && syms.map((y, k) => <T key={k} x={x + 10} y={118 + k * 14} size={11} mono>{y}</T>)}
    </Box>
  );
  return (
    <StepFrame title="Compile each file alone, link once" steps={s} note={st.note}>
      <Svg w={400} h={226} title="sq.c and main.c are compiled separately into sq.o and main.o, which the linker joins into one program">
        {srcBox(10, 'sq.c', st.sq === 'edit' ? 'return x*x; // edited' : 'int sq(int x) {...}', st.sq === 'edit')}
        {srcBox(220, 'main.c', 'int sq(int x); sq(7)', false)}
        {st.sq !== 'src' && <Arrow x1={95} y1={56} x2={95} y2={82} />}
        {st.main !== 'src' && <Arrow x1={305} y1={56} x2={305} y2={82} />}
        {objBox(10, 'sq.o', ['T sq'], st.sq === 'obj')}
        {objBox(220, 'main.o', ['T main', 'U sq'], st.main === 'obj', st.sq === 'edit' || st.reuse)}
        {(st.sq === 'edit' || st.reuse) && <T x={305} y={150} size={11} anchor="middle" fill={tok('muted')}>reused, not recompiled</T>}
        {st.linked && <Arrow x1={95} y1={142} x2={180} y2={176} />}
        {st.linked && <Arrow x1={305} y1={142} x2={220} y2={176} />}
        <Box x={120} y={176} w={160} h={40} dash={!st.linked} fill={st.linked ? tok('brand', 0.1) : 'transparent'} stroke={st.linked ? tok('brand') : tok('line')}>
          <T x={200} y={196} size={12} mono anchor="middle">{st.linked ? `prog: prints ${st.out}` : 'linker'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
