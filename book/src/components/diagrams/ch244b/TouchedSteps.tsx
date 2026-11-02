import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 244b: "which fields does this loop touch?", answered on VIR.
// The listing is the real loop body (block b6) that the JavaScript plugin
// produces for
//   for (let i = 0; i < ps.length; i++) ps[i].x += ps[i].vx;
// (printFunc output; %14 is the loop index phi from the header).
const VIR = `b6:
  %18 = load ps
  %19 = index.get %18, %14
  %20 = field.get %19 .x
  %21 = load ps
  %22 = index.get %21, %14
  %23 = field.get %22 .vx
  %24 = binop + %20, %23
  field.set %19, %24 .x
  br b7`;

type S = { line: number | null; coll: string[]; els: string[]; reads: string[]; writes: string[]; note: string };

const STATES: S[] = [
  { line: 0, coll: [], els: [], reads: [], writes: [], note: 'The loop body of ps[i].x += ps[i].vx, as VIR. We want the fields this loop reads and writes on elements of ps, and we will find them by looking only at op names and arguments.' },
  { line: 1, coll: ['%18'], els: [], reads: [], writes: [], note: 'load ps: %18 is the collection itself. Because ps holds an array, it is a binding, so every read of it is a load we can spot.' },
  { line: 2, coll: ['%18'], els: ['%19'], reads: [], writes: [], note: 'index.get %18, %14 takes element %14 of the collection. Its result, %19, is an element: remember it.' },
  { line: 3, coll: ['%18'], els: ['%19'], reads: ['x'], writes: [], note: 'field.get %19 .x reads field x of an element. Add x to the reads.' },
  { line: 5, coll: ['%18', '%21'], els: ['%19', '%22'], reads: ['x'], writes: [], note: 'A second load and index.get: %22 is another element (the same one, in fact, but we do not need to know that).' },
  { line: 6, coll: ['%18', '%21'], els: ['%19', '%22'], reads: ['x', 'vx'], writes: [], note: 'field.get %22 .vx reads vx. The binop on the next line works on numbers, not elements, so it adds nothing.' },
  { line: 8, coll: ['%18', '%21'], els: ['%19', '%22'], reads: ['x', 'vx'], writes: ['x'], note: 'field.set %19, %24 .x writes x on an element. Answer: this loop reads x and vx and writes x, so it touches 2 of 2 fields, exactly what explain printed.' },
];

function Row({ y, label, items, color }: { y: number; label: string; items: string[]; color: string }) {
  return (
    <g>
      <T x={12} y={y} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <T x={120} y={y} size={13} mono fill={items.length ? color : tok('muted')}>{items.length ? items.join(', ') : 'none'}</T>
    </g>
  );
}

export default function TouchedSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Which fields does this loop touch?" steps={s} note={st.note}>
      <CodeTrace code={VIR} line={st.line} />
      <Svg w={400} h={130} title="What the analysis has found so far: the collection values, the elements, and the fields read and written">
        <Box x={4} y={6} w={392} h={118} fill={tok('panel')} stroke={tok('line')}>
          <Row y={28} label="collection" items={st.coll} color={tok('brand')} />
          <Row y={54} label="elements" items={st.els} color={tok('accent')} />
          <Row y={80} label="fields read" items={st.reads} color={tok('f1')} />
          <Row y={106} label="fields written" items={st.writes} color={tok('f3')} />
        </Box>
      </Svg>
    </StepFrame>
  );
}
