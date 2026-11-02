// Chapter 248-b (staged split of 236): modulo scheduling the sum-of-squares
// loop at II = 3 on the wider toy machine (one load, one multiply and one
// ALU instruction may start per cycle). Each step places one instruction
// in the modulo reservation table, at row t mod 3.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type P = { op: string; unit: number; t: number };
const UNITS = ['MEM', 'MUL', 'ALU'];
const PLACED: P[] = [
  { op: 'ld', unit: 0, t: 0 },
  { op: 'mul', unit: 1, t: 3 },
  { op: 'add', unit: 2, t: 6 },
  { op: 'addi', unit: 2, t: 1 },
  { op: 'bne', unit: 2, t: 2 },
];
type S = { k: number; tried?: number; note: string };
const STATES: S[] = [
  { k: 0, note: 'Five instructions; three of them (add, addi, bne) need the one ALU, so ResMII = 3. The recurrences (s = s + x, p = p + 8) only need 1. We try II = 3: a table with 3 rows and one column per unit, filled in order of height.' },
  { k: 1, note: 'ld has nothing to wait for: t = 0, row 0 of MEM.' },
  { k: 2, note: 'mul must wait 3 cycles for ld: earliest t = 3. Row 3 mod 3 = 0 of MUL is free, so t = 3.' },
  { k: 3, note: 'add must wait 3 cycles for mul: earliest t = 6, row 6 mod 3 = 0 of ALU. Free, so t = 6. This add belongs to a trip that started two kernel passes ago.' },
  { k: 3, tried: 0, note: 'addi only has to follow ld (delay 0): earliest t = 0. But row 0 of the ALU is taken by add, from a different trip, so t = 0 is out.' },
  { k: 4, note: 'Try t = 1: row 1 of the ALU is free. addi goes there.' },
  { k: 5, note: 'bne must follow addi by 1: earliest t = 2, row 2 of the ALU, free. It lands in the last row, where a loop branch belongs (a real scheduler makes sure of that). Every slot is used at most once: II = 3 works.' },
  { k: 5, note: 'Stages are t ÷ 3, rounded down: ld, addi and bne are stage 0, mul stage 1, add stage 2. That is the hand-made kernel of the last chapter, now at 3 cycles a trip on this wider machine.' },
];

export default function MrtSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const shown = PLACED.slice(0, st.k);
  const X0 = 70;
  const CW = 104;
  const RH = 36;
  return (
    <StepFrame title="Filling the modulo reservation table" steps={s} note={st.note}>
      <Svg w={400} h={210} title="A table with rows 0, 1 and 2 and columns MEM, MUL and ALU. Instructions are placed one at a time at row t mod 3 of their unit's column.">
        {UNITS.map((u, c) => (
          <T key={u} x={X0 + c * CW + CW / 2} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>{u}</T>
        ))}
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <T x={8} y={30 + r * RH + RH / 2 - 4} size={11} mono>row {r}</T>
            {UNITS.map((_, c) => {
              const here = shown.find((p) => p.unit === c && p.t % 3 === r);
              const bad = st.tried === r && c === 2;
              return (
                <Box key={c} x={X0 + c * CW + 3} y={24 + r * RH} w={CW - 6} h={RH - 6}
                  fill={here ? tok('brand', 0.16) : 'transparent'} stroke={bad ? tok('danger') : here ? tok('brand') : tok('line', 0.6)} dash={!here}>
                  {here && <T x={X0 + c * CW + CW / 2} y={24 + r * RH + (RH - 6) / 2} size={12} mono anchor="middle">{`${here.op} (t=${here.t})`}</T>}
                </Box>
              );
            })}
          </g>
        ))}
        {st.tried !== undefined && <T x={392} y={150} size={12} anchor="end" fill={tok('danger')} weight={700}>addi at t = 0: row 0 taken</T>}
        <T x={8} y={176} size={11} fill={tok('muted')}>An instruction at time t uses row t mod II, because</T>
        <T x={8} y={192} size={11} fill={tok('muted')}>a new trip starts every II cycles with the same schedule.</T>
      </Svg>
    </StepFrame>
  );
}
