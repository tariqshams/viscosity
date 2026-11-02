// Chapter 298: the hiding program from chapter 295's stepper (A black, B
// grey, C white; A.f = C, then B's pointer cut), now run incrementally
// with Yuasa's deletion barrier, which shades the value a store
// overwrites. The marker keeps a snapshot of the graph from the start of
// marking; objects allocated during marking are black.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type C = 'w' | 'g' | 'b';
type S = {
  col: Record<string, C>;
  aC: boolean; bC: boolean; d: boolean;
  who: 'collector' | 'program' | 'done';
  code: string;
  note: string;
};

const STATES: S[] = [
  { col: { A: 'g', B: 'w', C: 'w' }, aC: false, bC: true, d: false, who: 'collector', code: 'start marking', note: 'Marking starts. The snapshot is the graph as it is now: the root reaches A, A reaches B, B reaches C. All three must end up marked. The root A is grey.' },
  { col: { A: 'b', B: 'g', C: 'w' }, aC: false, bC: true, d: false, who: 'collector', code: 'slice 1', note: 'One slice of marking: A is scanned (black), and B, which A points at, is greyed. The slice ends and the program gets to run.' },
  { col: { A: 'b', B: 'g', C: 'w' }, aC: true, bC: true, d: false, who: 'program', code: 'A.f = C', note: 'The program stores C into black A. The Yuasa barrier shades the OLD value of A.f, which was empty, so nothing happens. A black object now points at a white one: the strong invariant is broken, but C can still be reached from grey B, so the weak one holds.' },
  { col: { A: 'b', B: 'g', C: 'g' }, aC: true, bC: false, d: false, who: 'program', code: 'B.next = null', note: 'Now the program cuts B\'s pointer to C. This is the store that would hide C, and it is exactly the one the barrier watches: before overwriting B.next, it shades the old value, C. C is grey and on the list.' },
  { col: { A: 'b', B: 'g', C: 'g', D: 'b' }, aC: true, bC: false, d: true, who: 'program', code: 'let D = new ...', note: 'The program allocates D during marking. D was not in the snapshot and cannot be garbage yet, so it is born black: the marker never has to visit it.' },
  { col: { A: 'b', B: 'b', C: 'b', D: 'b' }, aC: true, bC: false, d: true, who: 'done', code: 'slice 2: done', note: 'The next slice scans B and C, and the grey list is empty. Everything in the snapshot is black; nothing reachable was lost. Had the program also dropped A.f, C would still be black now: floating garbage, freed next cycle.' },
];

const POS: Record<string, [number, number]> = { A: [80, 92], B: [210, 92], C: [210, 180], D: [330, 180] };

export default function SatbSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const node = (n: string) => {
    const c = st.col[n];
    if (!c) return null;
    const [x, y] = POS[n];
    return (
      <g key={n}>
        <circle cx={x} cy={y} r={22} fill={c === 'b' ? tok('ink') : c === 'g' ? tok('muted', 0.55) : tok('paper')} stroke={tok('ink')} strokeWidth={1.5} />
        <T x={x} y={y} size={14} weight={700} anchor="middle" fill={c === 'b' ? tok('paper') : tok('ink')}>{n}</T>
      </g>
    );
  };
  return (
    <StepFrame title="Snapshot at the beginning: Yuasa's barrier" steps={s} note={st.note}>
      <Svg w={400} h={226} title="Objects A, B, C and D with their colours as marking slices and program stores alternate">
        <Box x={8} y={8} w={384} h={30} r={4} fill={st.who === 'program' ? tok('safe', 0.15) : tok('warn', 0.18)} stroke={st.who === 'program' ? tok('safe') : tok('warn')}>
          <T x={18} y={23} size={11} weight={700} fill={tok('muted')}>{st.who === 'program' ? 'PROGRAM RUNS' : 'COLLECTOR SLICE'}</T>
          <T x={382} y={23} size={12} mono anchor="end">{st.code}</T>
        </Box>
        <T x={28} y={60} size={11} fill={tok('brand')}>root</T>
        <Arrow x1={40} y1={66} x2={62} y2={78} color={tok('brand')} />
        <Arrow x1={102} y1={92} x2={186} y2={92} />
        {st.bC && <Arrow x1={210} y1={114} x2={210} y2={156} />}
        {st.aC && <Arrow x1={96} y1={108} x2={190} y2={168} color={tok('danger')} />}
        {['A', 'B', 'C', 'D'].map(node)}
        <T x={8} y={216} size={11} fill={tok('muted')}>white: not found · grey: to scan · black: done</T>
      </Svg>
    </StepFrame>
  );
}
