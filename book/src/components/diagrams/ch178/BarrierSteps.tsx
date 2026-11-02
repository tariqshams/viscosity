// Chapter 178: why concurrent marking needs a write barrier. Tri-colour
// marking (white: not yet found; grey: found, fields not scanned; black:
// found and scanned) runs while JavaScript keeps changing pointers. If the
// program stores a pointer to a white object into a black one and removes
// the other path to it, the marker never finds it. V8's barrier ("Concurrent
// marking in V8", 2018) turns a white value grey and pushes it onto the
// marking worklist. The heap is a toy: a root and three objects.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Colour = 'white' | 'grey' | 'black';
type Id = 'A' | 'B' | 'C';
type S = {
  col: Record<Id, Colour>;
  aToC: boolean;
  bToC: boolean;
  work: Id[];
  code: string;
  freed?: boolean;
  barrier: 'none' | 'off' | 'on';
  note: string;
};

const STATES: S[] = [
  { col: { A: 'black', B: 'grey', C: 'white' }, aToC: false, bToC: true, work: ['B'], code: '(marker running)', barrier: 'none', note: 'Marking is under way, on a helper thread. A is black: found and fully scanned. B is grey: found, but its fields not yet scanned, so it waits on the worklist. C is white: not found yet; only B points to it.' },
  { col: { A: 'black', B: 'grey', C: 'white' }, aToC: true, bToC: true, work: ['B'], code: 'A.f = C;', barrier: 'off', note: 'Meanwhile JavaScript runs A.f = C. Now a black object points at a white one. The marker will never look at A again: it has already finished with it.' },
  { col: { A: 'black', B: 'grey', C: 'white' }, aToC: true, bToC: false, work: ['B'], code: 'B.f = null;', barrier: 'off', note: 'Then JavaScript runs B.f = null. The only path the marker could still follow to C is gone, yet C is plainly in use: A points to it.' },
  { col: { A: 'black', B: 'black', C: 'white' }, aToC: true, bToC: false, work: [], code: '(marker finishes)', freed: true, barrier: 'off', note: 'Without a barrier: the marker scans B, finds nothing, and the worklist is empty, so marking ends. C is still white, so the sweep frees it, and A is left pointing at freed memory. This must never happen.' },
  { col: { A: 'black', B: 'grey', C: 'grey' }, aToC: true, bToC: true, work: ['B', 'C'], code: 'A.f = C;  // + barrier', barrier: 'on', note: 'Rewind, with V8’s barrier. After the store A.f = C, the barrier sees that C is white, turns it grey and pushes it onto the worklist. One check on every pointer store buys this.' },
  { col: { A: 'black', B: 'grey', C: 'grey' }, aToC: true, bToC: false, work: ['B', 'C'], code: 'B.f = null;', barrier: 'on', note: 'B.f = null now does no harm: C is already on the worklist, so the marker will reach it whatever the program does to B.' },
  { col: { A: 'black', B: 'black', C: 'black' }, aToC: true, bToC: false, work: [], code: '(marker finishes)', barrier: 'on', note: 'The marker scans B and then C. Every object in use is black, and no black object points at a white one, so the sweep frees only true garbage.' },
];

const POS: Record<Id, { x: number; y: number }> = { A: { x: 150, y: 50 }, B: { x: 150, y: 140 }, C: { x: 300, y: 95 } };

// White, grey and black are the algorithm's names, so they are drawn as
// those colours in both themes.
function fillOf(c: Colour) {
  if (c === 'black') return '#1c1917';
  if (c === 'grey') return '#a8a29e';
  return '#fafaf9';
}

export default function BarrierSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Concurrent marking, with and without a barrier" steps={s} note={st.note}>
      <Svg w={400} h={262} title="A root points to A and B; B points to C. The program moves the pointer to C from B to A while marking runs.">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <T x={394} y={12} size={11} weight={700} anchor="end" fill={st.barrier === 'on' ? tok('safe') : st.barrier === 'off' ? tok('danger') : tok('muted')}>
          {st.barrier === 'on' ? 'WITH BARRIER' : st.barrier === 'off' ? 'NO BARRIER' : 'MARKING'}
        </T>
        <Box x={6} y={76} w={62} h={38} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={37} y={95} size={12} weight={700} anchor="middle" fill={tok('brand')}>root</T>
        </Box>
        <Arrow x1={70} y1={88} x2={126} y2={58} />
        <Arrow x1={70} y1={102} x2={126} y2={136} />
        {st.aToC && <Arrow x1={196} y1={56} x2={276} y2={88} color={tok('brand')} width={2.5} />}
        {st.bToC && <Arrow x1={196} y1={136} x2={276} y2={104} />}
        {(Object.keys(POS) as Id[]).map((id) => {
          const p = POS[id];
          const c = st.col[id];
          const dark = c === 'black';
          const gone = id === 'C' && st.freed;
          return (
            <g key={id}>
              <Box x={p.x - 24} y={p.y - 20} w={48} h={40} fill={gone ? 'transparent' : fillOf(c)} stroke={gone ? tok('danger') : tok('ink', 0.7)} dash={gone}>
                <T x={p.x} y={p.y - 4} size={14} weight={700} anchor="middle" fill={gone ? tok('danger') : dark ? '#fafaf9' : '#1c1917'}>{id}</T>
                <T x={p.x} y={p.y + 11} size={11} anchor="middle" fill={gone ? tok('danger') : dark ? '#fafaf9' : '#1c1917'}>{gone ? 'freed!' : c}</T>
              </Box>
            </g>
          );
        })}
        {st.aToC && <T x={238} y={56} size={11} mono fill={tok('brand')}>A.f</T>}
        {st.bToC && <T x={238} y={136} size={11} mono fill={tok('muted')}>B.f</T>}
        <T x={6} y={196} size={11} weight={700} fill={tok('muted')}>PROGRAM</T>
        <T x={80} y={196} size={12} mono>{st.code}</T>
        <T x={6} y={226} size={11} weight={700} fill={tok('muted')}>WORKLIST</T>
        {st.work.length === 0 && <T x={80} y={226} size={12} mono fill={tok('muted')}>empty</T>}
        {st.work.map((id, k) => (
          <Box key={id} x={80 + k * 40} y={214} w={32} h={24} r={3} fill={tok('muted', 0.25)} stroke={tok('ink', 0.5)}>
            <T x={96 + k * 40} y={226} size={12} mono weight={700} anchor="middle">{id}</T>
          </Box>
        ))}
        <T x={6} y={252} size={11} fill={tok('muted')}>white: not found · grey: found, not scanned · black: done</T>
      </Svg>
    </StepFrame>
  );
}
