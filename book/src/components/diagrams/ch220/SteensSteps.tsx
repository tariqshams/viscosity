// Chapter 219b: Steensgaard's unification-based analysis. Every variable
// points at ONE box (a class of objects); an assignment merges the two
// boxes instead of copying a set, which is fast and loses precision.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `a = {};   // site o1
b = {};   // site o2
c = a;
c = b;`;

type V = 'a' | 'b' | 'c';
// boxes: label -> contents; to: variable -> box label
type S = { line: number | null; boxes: Record<string, string>; to: Partial<Record<V, string>>; merged?: boolean; note: string };

const STATES: S[] = [
  { line: null, boxes: {}, to: {}, note: 'Steensgaard keeps one rule: each variable points at a single box, and a box is a group of objects that are treated as one. No sets of boxes, ever.' },
  { line: 0, boxes: { A: 'o1' }, to: { a: 'A' }, note: 'a = {}: a points at a box holding o1.' },
  { line: 1, boxes: { A: 'o1', B: 'o2' }, to: { a: 'A', b: 'B' }, note: 'b = {}: b points at a second box, holding o2.' },
  { line: 2, boxes: { A: 'o1', B: 'o2' }, to: { a: 'A', b: 'B', c: 'A' }, note: 'c = a: c and a must point at the same box. c had no box yet, so it takes a’s box. One step, nothing copied.' },
  { line: 3, boxes: { A: 'o1, o2' }, to: { a: 'A', b: 'A', c: 'A' }, merged: true, note: 'c = b: c’s box and b’s box must be the same box, so the two boxes are MERGED into one (a union, in union-find terms). Every variable that pointed at either box now points at the merged one, including a and b.' },
  { line: null, boxes: { A: 'o1, o2' }, to: { a: 'A', b: 'A', c: 'A' }, merged: true, note: 'Result: a, b and c all point at {o1, o2}. So Steensgaard says a and b MAY alias, which can never happen at run time. Andersen keeps a at {o1} and b at {o2}. That lost precision is the price of near-linear speed.' },
];

const VY: Record<V, number> = { a: 40, b: 100, c: 160 };

export default function SteensSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const boxY: Record<string, number> = st.merged ? { A: 100 } : { A: 40, B: 130 };
  return (
    <StepFrame title="Steensgaard: merge instead of copy" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={196} title="Variables a, b and c on the left, the boxes of objects they point at on the right; the last assignment merges two boxes into one">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VARIABLES</T>
        <T x={250} y={12} size={11} weight={700} fill={tok('muted')}>BOXES</T>
        {(Object.keys(VY) as V[]).map((v) => {
          const target = st.to[v];
          const ty = target ? boxY[target] : 0;
          return (
            <g key={v}>
              <Box x={20} y={VY[v] - 14} w={40} h={28}>
                <T x={40} y={VY[v]} size={13} mono weight={700} anchor="middle">{v}</T>
              </Box>
              {target && <Arrow x1={60} y1={VY[v]} x2={246} y2={ty + (v === 'c' ? 8 : v === 'a' ? -8 : 0)} color={st.merged ? tok('warn') : tok('brand')} />}
            </g>
          );
        })}
        {Object.entries(st.boxes).map(([k, c]) => (
          <Box key={k} x={250} y={boxY[k] - 22} w={130} h={44} r={8} fill={st.merged ? tok('warn', 0.12) : tok('brand', 0.1)} stroke={st.merged ? tok('warn') : tok('brand')}>
            <T x={315} y={boxY[k]} size={13} mono anchor="middle">{'{' + c + '}'}</T>
          </Box>
        ))}
        {st.merged && <T x={315} y={150} size={11} anchor="middle" fill={tok('warn')}>one merged box</T>}
      </Svg>
    </StepFrame>
  );
}
