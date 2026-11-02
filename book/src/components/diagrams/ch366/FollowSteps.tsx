import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 366: shapes_and_uses in engine/rust/crates/core/src/analysis.rs,
// on a real VIR listing (print_func, trimmed) of
//   const ps = []; for (...) ps.push({ x: i, y: 0 });
//   function step(qs) { for (...) qs[i].y += qs[i].x; }
//   step(ps); console.log(ps[3].y);
// The worklist is a Vec used as a stack: pop() takes the end.
const VIR = `<module>:
  %23 = load ps
  %25 = record {x, y} %20, %24
  %26 = push %23, %25
  %30 = load step
  %31 = load ps
  %32 = call %30, %31
  %35 = load ps
  %37 = index.get %35, %36
step(%0):
  %4 = field.get %0 .length
  %6 = index.get %0, %2
  %8 = index.get %0, %2`;

type S = { line: number | null; work: string[]; gets: string[]; lens: string[]; pushes: string[]; fields: string; refs: string; note: string };

const STATES: S[] = [
  { line: null, work: ['%23', '%31', '%35'], gets: [], lens: [], pushes: [], fields: '', refs: '%23 %31 %35', note: 'find_collections made ps a candidate (its first store is array.empty) and mapped each of its loads to collection 0 in collection_of_load. The stack starts as those loads, in instruction order.' },
  { line: 8, work: ['%23', '%31'], gets: ['%37'], lens: [], pushes: [], fields: '', refs: '%23 %31 %35', note: 'pop() takes %35, the LAST load. Its only use is index.get with ps as the array: an element. Record it in index_gets, and remember element_of[%37] = 0 for the element checks later.' },
  { line: 6, work: ['%23', '%0'], gets: ['%37'], lens: [], pushes: [], fields: '', refs: '%23 %31 %35 %0', note: 'Pop %31: passed to step(). step is a known function (one store, only ever called directly), every call site passes ps there, and the parameter %0 is an SSA value. So %0 now refers to ps too: use_of_collection returns Some(%0), which is pushed.' },
  { line: 10, work: ['%23'], gets: ['%37'], lens: ['%4'], pushes: [], fields: '', refs: '%23 %31 %35 %0', note: 'Pop %0, inside step. Its first use reads .length: fine, and filed under length_reads (the bounds proof will need it).' },
  { line: 12, work: ['%23'], gets: ['%37', '%6', '%8'], lens: ['%4'], pushes: [], fields: '', refs: '%23 %31 %35 %0', note: 'Its other two uses are index.gets: two more elements, %6 and %8. The analysis now knows about elements in two functions.' },
  { line: 3, work: [], gets: ['%37', '%6', '%8'], lens: ['%4'], pushes: ['%26'], fields: '{x, y}', refs: '%23 %31 %35 %0', note: 'Pop %23, the FIRST load, last. push with one argument, and %25 is a fresh record.new: set_shape gives the collection its fields, and %25 has exactly one use, so it can’t be aliased.' },
  { line: null, work: [], gets: ['%37', '%6', '%8'], lens: ['%4'], pushes: ['%26'], fields: '{x, y}', refs: '%23 %31 %35 %0', note: 'Stack empty, no bailouts. Later passes check the elements’ uses and the numbers. The real explain: “ps (line 1) {x, y} → struct of arrays”, with the loop in step() touching 2 of 2 fields.' },
];

function Row({ y, label, items }: { y: number; label: string; items: string[] }) {
  return (
    <g>
      <T x={8} y={y} size={11} weight={700} fill={tok('muted')}>{label}</T>
      {items.length === 0 && <T x={112} y={y} size={12} fill={tok('muted')}>—</T>}
      {items.map((w, k) => (
        <Box key={k} x={108 + k * 50} y={y - 11} w={44} h={22} fill={tok('accent', 0.12)} stroke={tok('accent')}>
          <T x={130 + k * 50} y={y} size={12} mono anchor="middle">{w}</T>
        </Box>
      ))}
    </g>
  );
}

export default function FollowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Following ps through its uses" steps={s} note={st.note}>
      <CodeTrace code={VIR} line={st.line} />
      <Svg w={400} h={176} title="The worklist stack and what the collection pass has recorded so far">
        <Row y={16} label="STACK" items={st.work} />
        <Row y={46} label="INDEX_GETS" items={st.gets} />
        <Row y={76} label="LENGTH_READS" items={st.lens} />
        <Row y={106} label="PUSHES" items={st.pushes} />
        <T x={8} y={136} size={11} weight={700} fill={tok('muted')}>FIELDS</T>
        <T x={112} y={136} size={12} mono fill={st.fields ? tok('f1') : tok('muted')}>{st.fields || '— (no shape yet)'}</T>
        <T x={8} y={162} size={11} weight={700} fill={tok('muted')}>REFER TO ps</T>
        <T x={112} y={162} size={12} mono>{st.refs}</T>
      </Svg>
    </StepFrame>
  );
}
