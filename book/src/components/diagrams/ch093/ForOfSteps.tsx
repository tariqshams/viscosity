import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Lowering `for (const p of ps) p.x += p.vx;` into an index loop, in the
// order lower.ts emits it. The VIR is the real output of the front-end for
//   const ps = [];
//   ps.push({ x: 1, vx: 2 });
//   for (const p of ps) p.x += p.vx;
// (printed with printFunc; the push lines are left out).
type Line = { b: number; t: string };
const VIR: Line[] = [
  { b: 0, t: '%7 = load ps' },
  { b: 0, t: '%8 = const 0' },
  { b: 0, t: 'br b1' },
  { b: 1, t: '%9 = phi %8, %18' },
  { b: 1, t: '%10 = field.get %7 .length' },
  { b: 1, t: '%11 = binop < %9, %10' },
  { b: 1, t: 'condbr %11, b2, b4' },
  { b: 2, t: '%12 = index.get %7, %9' },
  { b: 2, t: '%13 = field.get %12 .x' },
  { b: 2, t: '%14 = field.get %12 .vx' },
  { b: 2, t: '%15 = binop + %13, %14' },
  { b: 2, t: 'field.set %12, %15 .x' },
  { b: 2, t: 'br b3' },
  { b: 3, t: '%17 = const 1' },
  { b: 3, t: '%18 = binop + %9, %17' },
  { b: 3, t: 'br b1' },
  { b: 4, t: 'return' },
];

type S = { shown: number; hi: number[]; block: number; phiDone: boolean; note: string };
const STATES: S[] = [
  { shown: 2, hi: [0, 1], block: 0, phiDone: false, note: 'Lower the array expression first: ps is a binding, so reading it is a load. Then a hidden index variable, keyed forof<offset> so it can never clash with a real name, starts at constant 0.' },
  { shown: 4, hi: [2, 3], block: 1, phiDone: false, note: 'Make four blocks: head, body, continue, exit. Jump to the head and read the index there. The head is not sealed (the back edge from b3 does not exist yet), so the read creates an incomplete phi with no operands.' },
  { shown: 7, hi: [4, 5, 6], block: 1, phiDone: false, note: 'The right-hand side is a plain identifier, so the test is i < ps.length: a field.get of length and a binop. condbr goes to the body or out of the loop.' },
  { shown: 8, hi: [7], block: 2, phiDone: false, note: 'Seal the body (its only predecessor is known) and read element i with index.get, tagged "for-of". p is an SSA local: writing it emits nothing, p simply means %12 from now on.' },
  { shown: 13, hi: [8, 9, 10, 11, 12], block: 2, phiDone: false, note: 'The body p.x += p.vx: read the target, lower the right side, add, write back. All three accesses use %12, so the analyses can see they are fields of an element of ps.' },
  { shown: 16, hi: [13, 14, 15], block: 3, phiDone: false, note: 'The continue block bumps the index: %18 = %9 + 1, written to the hidden variable in b3, then jumps back to the head.' },
  { shown: 17, hi: [3, 16], block: 4, phiDone: true, note: 'Now seal the head. Its predecessors are b0 and b3, so the incomplete phi gets its operands: %8 from the entry, %18 from the back edge. The exit block continues with the rest of the program.' },
];

const BLOCKS = [
  { id: 0, y: 14, label: 'b0 entry' },
  { id: 1, y: 74, label: 'b1 head' },
  { id: 2, y: 134, label: 'b2 body' },
  { id: 3, y: 194, label: 'b3 cont' },
  { id: 4, y: 254, label: 'b4 exit' },
];

export default function ForOfSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Lowering a for-of into an index loop" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The for-of loop lowered into five VIR blocks: entry, head with a phi, body, continue and exit">
        {BLOCKS.map((b) => {
          const on = st.block === b.id;
          const seen = VIR.slice(0, st.shown).some((l) => l.b === b.id);
          return (
            <Box key={b.id} x={22} y={b.y} w={84} h={32}
              fill={on ? tok('brand', 0.15) : 'transparent'}
              stroke={on ? tok('brand') : seen ? tok('ink', 0.5) : tok('line')} dash={!seen}>
              <T x={64} y={b.y + 16} size={12} mono anchor="middle">{b.label}</T>
            </Box>
          );
        })}
        <Arrow x1={64} y1={46} x2={64} y2={72} />
        <Arrow x1={64} y1={106} x2={64} y2={132} />
        <Arrow x1={64} y1={166} x2={64} y2={192} />
        <Arrow x1={106} y1={210} x2={106} y2={92} bend={0.45} dash={st.shown < 16} />
        <Arrow x1={22} y1={90} x2={22} y2={268} bend={0.25} color={tok('muted')} dash={st.shown < 7} />
        {VIR.map((l, k) => {
          if (k >= st.shown) return null;
          const on = st.hi.includes(k);
          const txt = k === 3 && !st.phiDone ? '%9 = phi ?, ?' : l.t;
          return (
            <g key={k}>
              {on && <rect x={128} y={8 + k * 17} width={268} height={16} rx={3} fill={tok('brand', 0.15)} />}
              <T x={134} y={16 + k * 17} size={11} mono fill={l.b === st.block ? undefined : tok('muted')}>
                {`b${l.b}  ${txt}`}
              </T>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
