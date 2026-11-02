// Chapter 91-b: a basic induction variable (the header phi i) and two
// derived ones (2 * i and 2 * i + 1), stepped trip by trip, so the reader
// sees that every one of them climbs by a fixed amount.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = { trip: number | null; note: string };

const STATES: S[] = [
  { trip: null, note: 'The loop for (let i = 0; i < n; i++) with const j = 2 * i + 1 in its body. Three values change inside it: %4 (i), %8 (2 * i) and %10 (2 * i + 1).' },
  { trip: 0, note: 'Trip 0: the phi %4 arrives from before the loop, so it takes the start value 0. Then %8 = 0 and %10 = 1.' },
  { trip: 1, note: 'Trip 1: the phi now takes %17 from the latch, which was %4 + 1. So i = 1, 2 * i = 2, and j = 3.' },
  { trip: 2, note: 'Trip 2: i = 2, 2 * i = 4, j = 5. Look along each row: i steps by 1, the other two by 2.' },
  { trip: 3, note: 'Trip 3: i = 3, 2 * i = 6, j = 7. Every row climbs by the same amount each trip: that is what makes all three induction variables.' },
  { trip: 3, note: 'i is the basic one (a header phi fed by phi + 1). The other two are derived: c × i + d with c = 2, so they step by c × 1 = 2. The next chapter replaces their multiply with a running add.' },
];

const ROWS = [
  { name: '%4', label: 'i', f: (k: number) => k, step: '+1', col: 'brand' },
  { name: '%8', label: '2 * i', f: (k: number) => 2 * k, step: '+2', col: 'accent' },
  { name: '%10', label: '2 * i + 1', f: (k: number) => 2 * k + 1, step: '+2', col: 'accent' },
];

export default function IvSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const last = s.i === STATES.length - 1;
  return (
    <StepFrame title="Induction variables, trip by trip" steps={s} note={st.note}>
      <Svg w={400} h={200} title="A table of the values of i, 2 times i and 2 times i plus 1 on trips 0 to 3">
        <T x={8} y={16} size={11} weight={700} fill={tok('muted')}>TRIP</T>
        {[0, 1, 2, 3].map((k) => (
          <T key={k} x={150 + k * 62} y={16} size={12} mono weight={700} anchor="middle"
            fill={st.trip === k ? tok('brand') : tok('muted')}>{k}</T>
        ))}
        {ROWS.map((r, ri) => {
          const y = 50 + ri * 50;
          return (
            <g key={r.name}>
              <T x={8} y={y} size={13} mono weight={700}>{r.name}</T>
              <T x={8} y={y + 16} size={11} mono fill={tok('muted')}>{r.label}</T>
              {[0, 1, 2, 3].map((k) => {
                const shown = st.trip !== null && k <= st.trip;
                return (
                  <g key={k}>
                    <Box x={150 + k * 62 - 22} y={y - 14} w={44} h={28} r={5}
                      fill={shown ? tok(r.col, st.trip === k ? 0.25 : 0.1) : 'transparent'}
                      stroke={shown ? tok(r.col) : tok('line')} dash={!shown}>
                      <T x={150 + k * 62} y={y} size={14} mono anchor="middle">{shown ? String(r.f(k)) : ''}</T>
                    </Box>
                    {shown && k > 0 && (
                      <Arrow x1={150 + (k - 1) * 62 + 23} y1={y - 18} x2={150 + k * 62 - 23} y2={y - 18} bend={-0.6} width={1.2} color={tok('ink', 0.45)} />
                    )}
                    {shown && k > 0 && (
                      <T x={150 + k * 62 - 31} y={y - 30} size={11} mono anchor="middle" fill={tok('muted')}>{r.step}</T>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {last && <T x={200} y={194} size={12} anchor="middle" fill={tok('brand')}>basic: i · derived: c × i + d, step c × 1</T>}
      </Svg>
    </StepFrame>
  );
}
