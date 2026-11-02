// Chapter 242: why two Rc values that point at each other are never
// freed. Stack variables on the left, Rc allocations on the right, each
// with its strong count. The counts and the missing "free" lines match
// the program in the chapter, run with rustc 1.97.0 (it prints
// "c has 2 owners" and never "free c" or "free d"). The last step shows
// what a tracing collector (chapter 114) would do with the same objects.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `{
    let c = new("c");
    let d = new("d");
    c.borrow_mut().field =
        Some(Rc::clone(&d));
    d.borrow_mut().field =
        Some(Rc::clone(&c));
} // c and d go out of scope`;

type S = {
  line: number | null;
  vars: { c: boolean; d: boolean };
  objs: { c: boolean; d: boolean };
  count: { c: number; d: number };
  cd?: boolean; // c.field -> d
  dc?: boolean; // d.field -> c
  hl?: 'c' | 'd';
  leak?: boolean;
  gc?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: 1, vars: { c: true, d: false }, objs: { c: true, d: false }, count: { c: 1, d: 0 }, hl: 'c', note: 'Rc::new puts the object on the heap with a strong count of 1. The variable c is its only owner.' },
  { line: 2, vars: { c: true, d: true }, objs: { c: true, d: true }, count: { c: 1, d: 1 }, hl: 'd', note: 'The same for d. Two objects, one owner each.' },
  { line: 3, vars: { c: true, d: true }, objs: { c: true, d: true }, count: { c: 1, d: 2 }, cd: true, hl: 'd', note: 'Rc::clone(&d) copies the pointer, not the object, and adds 1 to d’s count. c’s field is now a second owner of d: count 2.' },
  { line: 5, vars: { c: true, d: true }, objs: { c: true, d: true }, count: { c: 2, d: 2 }, cd: true, dc: true, hl: 'c', note: 'Now d’s field owns c as well. Both counts are 2. This is an ordinary Drip program: two objects whose fields point at each other.' },
  { line: 7, vars: { c: true, d: false }, objs: { c: true, d: true }, count: { c: 2, d: 1 }, cd: true, dc: true, hl: 'd', note: 'The scope ends. Variables drop in reverse order, so d goes first and takes 1 off d’s count. It falls to 1, not 0, because c’s field still owns d.' },
  { line: 7, vars: { c: false, d: false }, objs: { c: true, d: true }, count: { c: 1, d: 1 }, cd: true, dc: true, hl: 'c', leak: true, note: 'Then c: its count falls to 1 too. No variable can reach either object now, yet each keeps the other alive. Neither count will ever reach 0, so neither Drop runs: a leak.' },
  { line: null, vars: { c: false, d: false }, objs: { c: false, d: false }, count: { c: 1, d: 1 }, cd: true, dc: true, gc: true, note: 'A tracing collector asks a different question: what can the roots reach? Nothing reaches c or d, so mark-and-sweep frees both, however they point at each other. That is the question a VM needs answered.' },
];

export default function CycleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const box = { c: 30, d: 130 } as const;
  return (
    <StepFrame title="A cycle of Rc pointers" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="Two variables, two Rc objects with strong counts, and the field pointers between the objects">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>STACK</T>
        <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>HEAP (Rc allocations)</T>
        {(['c', 'd'] as const).map((k) => {
          const y = box[k];
          const live = st.vars[k];
          const hl = st.hl === k;
          if (st.count[k] === 0) return null;
          const col = st.gc ? tok('safe') : st.leak ? tok('danger') : hl ? tok('brand') : tok('line');
          return (
            <g key={k}>
              <Box x={10} y={y + 10} w={60} h={30} r={4} stroke={live ? tok('brand') : tok('line')} opacity={live ? 1 : 0.55}>
                <T x={40} y={y + 25} size={13} mono anchor="middle">{live ? k : 'gone'}</T>
              </Box>
              {live && <Arrow x1={70} y1={y + 25} x2={198} y2={y + 25} color={tok('brand')} />}
              <Box x={200} y={y} w={130} h={50} r={5} fill={hl ? tok('brand', 0.12) : tok('panel')} stroke={col} dash={st.gc}>
                <T x={210} y={y + 15} size={12} mono weight={700}>Obj {k}</T>
                <T x={210} y={y + 35} size={12} mono fill={st.leak ? tok('danger') : tok('ink')}>
                  {st.gc ? 'freed' : `strong: ${st.count[k]}`}
                </T>
              </Box>
            </g>
          );
        })}
        {st.cd && <Arrow x1={315} y1={80} x2={315} y2={128} bend={-0.6} color={st.gc ? tok('ink', 0.3) : tok('f3')} />}
        {st.cd && <T x={364} y={104} size={10} mono anchor="middle" fill={tok('f3')}>field</T>}
        {st.dc && <Arrow x1={240} y1={130} x2={240} y2={82} bend={-0.6} color={st.gc ? tok('ink', 0.3) : tok('f4')} />}
        {st.dc && <T x={196} y={104} size={10} mono anchor="middle" fill={tok('f4')}>field</T>}
        {st.leak && <T x={200} y={194} size={11} weight={700} fill={tok('danger')}>unreachable, never freed</T>}
        {st.gc && <T x={200} y={194} size={11} weight={700} fill={tok('safe')}>unreachable from the roots: swept</T>}
      </Svg>
    </StepFrame>
  );
}
