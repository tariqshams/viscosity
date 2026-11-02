// Chapter 107: Braun et al.'s SSA construction on the real `sum` loop, as
// VIR's FunctionBuilder runs it: per-block definitions, incomplete phis in
// the unsealed loop header, sealing, and a trivial phi that disappears.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function sum(n) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    s = s + i;
  }
  return s;
}`;

type B = { lines: string[]; defs: string; sealed: boolean };
type S = { line: number; b: [B, B, B, B, B]; hot: number; note: string };

const E: B = { lines: [], defs: '', sealed: false };
const B0: B = { lines: ['%0 = param', '%1 = const 0', '%2 = const 0'], defs: 'n=%0 s=%1 i=%2', sealed: true };
const inc = (v: string, what: string) => `${v} = φ(…)  incomplete: ${what}`;

const b1a: B = { lines: [inc('%3', 'i')], defs: 'i=%3', sealed: false };
const b1b: B = { lines: [inc('%4', 'n'), inc('%3', 'i'), '%5 = < %3, %4'], defs: 'i=%3 n=%4', sealed: false };
const b1c: B = { lines: [inc('%6', 's'), inc('%4', 'n'), inc('%3', 'i'), '%5 = < %3, %4'], defs: 'i=%3 n=%4 s=%6', sealed: false };
const b2a: B = { lines: [], defs: 's=%6', sealed: true };
const b2b: B = { lines: ['%7 = + %6, %3'], defs: 's=%7 i=%3', sealed: true };
const b3a: B = { lines: ['%8 = unop + %3', '%10 = + %8, 1'], defs: 'i=%10', sealed: true };
const b1d: B = { ...b1c, lines: [inc('%6', 's'), inc('%4', 'n'), '%3 = φ(%2, %10)', '%5 = < %3, %4'], sealed: true };
const b1e: B = { ...b1d, lines: [inc('%6', 's'), '%3 = φ(%2, %10)', '%5 = < %3, %0'], defs: 'i=%3 n=%0 s=%6' };
const b1f: B = { ...b1e, lines: ['%6 = φ(%1, %7)', '%3 = φ(%2, %10)', '%5 = < %3, %0'] };
const b3b: B = { ...b3a, defs: 'i=%10 n=%0 s=%7' };
const b3n: B = { ...b3a, defs: 'i=%10 n=%0' };
const b2n: B = { ...b2b, defs: 's=%7 i=%3 n=%0' };

const STATES: S[] = [
  { line: 1, hot: 0, b: [B0, E, E, E, E], note: 'b0, the entry, is sealed from the start: it has no predecessors to wait for. Each assignment just records "in b0, s is %1" in b0’s own table of definitions. Then b0 jumps to the loop header b1.' },
  { line: 2, hot: 1, b: [B0, b1a, E, E, E], note: 'Lowering the test i < n inside b1 needs i. b1 has no definition of its own, so we must ask its predecessors. But b1 is NOT sealed: the back edge from the end of the loop hasn’t been built yet. So the builder makes an empty phi %3, remembers it as incomplete, and writes i=%3.' },
  { line: 2, hot: 1, b: [B0, b1b, E, E, E], note: 'Reading n goes the same way: another incomplete phi, %4. (Phis are added at the top of the block.) The test becomes %5 = %3 < %4, and b1 branches to the body b2 or the exit b4.' },
  { line: 3, hot: 2, b: [B0, b1c, b2a, E, E], note: 'b2’s only predecessor, b1, is now known, so b2 is sealed. s = s + i reads s: b2 has none, it has one predecessor, so ask b1. b1 has no s either and is unsealed: a third incomplete phi, %6. The answer is also cached in b2.' },
  { line: 3, hot: 2, b: [B0, b1c, b2b, E, E], note: 'Reading i in b2 finds i=%3 in b1. The addition is %7 = %6 + %3, and the assignment writes s=%7 in b2’s table. Nothing was overwritten: b1 still says s=%6.' },
  { line: 2, hot: 3, b: [B0, b1c, b2b, b3a, E], note: 'b3 runs i++ (the unop + is JavaScript’s ToNumber). It reads i through b2 (%3) and writes i=%10. Then b3 jumps back to b1. That was b1’s last predecessor, so b1 can be sealed.' },
  { line: 2, hot: 1, b: [B0, b1d, b2b, b3a, E], note: 'Sealing b1 fills in each incomplete phi by reading the variable at the end of every predecessor. For i: b0 says %2, b3 says %10. So %3 = φ(%2, %10): the loop counter.' },
  { line: 2, hot: 1, b: [B0, b1e, b2n, b3n, E], note: 'For n: b0 says %0. b3 has no n, so it asks b2, which asks b1, which says %4: the phi itself! (The answer is cached in b2 and b3 on the way.) %4 = φ(%0, %4) only ever means %0. It is trivial: every use of %4, and every table entry, is rewired to %0, and the phi is deleted.' },
  { line: 3, hot: 1, b: [B0, b1f, b2n, b3b, E], note: 'For s: b0 says %1, b3 asks b2, which says %7. So %6 = φ(%1, %7). Every phi in b1 is now complete. Only the variables that really change in the loop kept a phi.' },
  { line: 5, hot: 4, b: [B0, b1f, b2n, b3b, { lines: ['return %6'], defs: 's=%6', sealed: true }], note: 'Finally the exit b4 is sealed and return s reads s: one predecessor, b1, which says %6. This is exactly the VIR the real builder prints for sum.' },
];

const LH = 14;
const W = 244;
const hOf = (b: B) => 34 + Math.max(1, b.lines.length) * LH;
/** the tallest step, so the picture keeps one size while stepping */
const TOTAL = Math.max(...STATES.map((st) => st.b.slice(0, 4).reduce((y, b) => y + hOf(b) + 16, 4))) - 10;

export default function BraunSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const ys: number[] = [];
  let y = 4;
  for (let k = 0; k < 4; k++) {
    ys.push(y);
    y += hOf(st.b[k]) + 16;
  }
  const pos = [0, 1, 2, 3].map((k) => ({ x: 6, y: ys[k] })).concat([{ x: 270, y: ys[1] }]);
  return (
    <StepFrame title="Building SSA while lowering" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={TOTAL} title="Five blocks of the sum loop: b0 entry, b1 loop header, b2 body, b3 increment, and b4 exit to the right. Each shows its instructions and its table of current definitions. A dashed border means the block is not sealed yet.">
        {[0, 1, 2].map((k) => (
          <Arrow key={k} x1={60} y1={ys[k] + hOf(st.b[k])} x2={60} y2={ys[k + 1] - 1} />
        ))}
        <Arrow x1={6 + W} y1={ys[3] + 20} x2={6 + W} y2={ys[1] + hOf(st.b[1]) - 8} bend={0.9} color={tok('accent')} />
        <Arrow x1={6 + W} y1={ys[1] + 16} x2={268} y2={ys[1] + 16} />
        {st.b.map((b, k) => {
          const p = pos[k];
          const w = k === 4 ? 124 : W;
          const hot = st.hot === k;
          return (
            <Box key={k} x={p.x} y={p.y} w={w} h={hOf(b)} dash={!b.sealed} fill={hot ? tok('brand', 0.08) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={p.x + 8} y={p.y + 10} size={10} weight={700} fill={tok('muted')}>{`b${k}${b.sealed ? '' : ' · unsealed'}`}</T>
              {b.lines.map((l, j) => (
                <T key={j} x={p.x + 8} y={p.y + 25 + j * LH} size={11.5} mono fill={l.includes('incomplete') ? tok('warn') : l.includes('φ') ? tok('accent') : undefined}>{l}</T>
              ))}
              <T x={p.x + 8} y={p.y + hOf(b) - 9} size={11} mono fill={tok('safe')}>{b.defs ? `defs: ${b.defs}` : ''}</T>
            </Box>
          );
        })}
        <T x={392} y={ys[3] + 24} size={10} anchor="end" fill={tok('accent')}>back edge</T>
      </Svg>
    </StepFrame>
  );
}
