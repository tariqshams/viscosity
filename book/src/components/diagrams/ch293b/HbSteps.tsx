import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 293-b: building happens-before for message passing with a
// release store and an acquire load, with each event's vector clock.
type Ev = { id: string; t: 0 | 1; k: number; label: string };
const EVS: Ev[] = [
  { id: 'w', t: 0, k: 0, label: 'data = 42' },
  { id: 'rel', t: 0, k: 1, label: 'flag.store(1, rel)' },
  { id: 'acq', t: 1, k: 0, label: 'flag.load(acq) → 1' },
  { id: 'r', t: 1, k: 1, label: 'read data' },
];
type S = { show: string[]; po: boolean; sw: boolean; vc: Record<string, string>; hb?: boolean; note: string };

const STATES: S[] = [
  { show: ['w', 'rel'], po: false, sw: false, vc: { w: '[1,0]', rel: '[2,0]' }, note: 'Thread A writes data, then stores 1 to flag with release ordering. Each event gets a vector clock: A\'s count of its own steps is the first number.' },
  { show: ['w', 'rel'], po: true, sw: false, vc: { w: '[1,0]', rel: '[2,0]' }, note: 'Program order (sequenced-before) is the first kind of edge: within one thread, an earlier step happens before a later one.' },
  { show: ['w', 'rel', 'acq', 'r'], po: true, sw: false, vc: { w: '[1,0]', rel: '[2,0]', acq: '[0,1]', r: '[0,2]' }, note: 'Thread B loads flag with acquire ordering, sees 1, then reads data. Without a link between the threads, B\'s clocks know nothing of A: write and read are unordered, a race.' },
  { show: ['w', 'rel', 'acq', 'r'], po: true, sw: true, vc: { w: '[1,0]', rel: '[2,0]', acq: '[2,1]', r: '[2,2]' }, note: 'But the acquire load read the value the release store wrote, so the release synchronizes with the acquire: the second kind of edge. B joins A\'s clock into its own, element by element.' },
  { show: ['w', 'rel', 'acq', 'r'], po: true, sw: true, hb: true, vc: { w: '[1,0]', rel: '[2,0]', acq: '[2,1]', r: '[2,2]' }, note: 'Happens-before is every path of these edges: write → release → acquire → read. In clocks: the write\'s A-count 1 is at most the read\'s A-count 2. Ordered, so no race, and the read must see 42.' },
];

export default function HbSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const pos = (e: Ev) => ({ x: 8 + e.t * 200, y: 30 + (e.k + e.t * 2) * 62 });
  return (
    <StepFrame title="Happens-before, edge by edge" steps={s} note={st.note}>
      <Svg w={400} h={300} title="Two threads, A and B, with two events each; program-order edges down each thread, a synchronizes-with edge from the release store to the acquire load, and vector clocks under each event">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THREAD A</T>
        <T x={208} y={12} size={11} weight={700} fill={tok('muted')}>THREAD B</T>
        {EVS.filter((e) => st.show.includes(e.id)).map((e) => {
          const p = pos(e);
          const hot = st.hb && (e.id === 'w' || e.id === 'r');
          return (
            <g key={e.id}>
              <Box x={p.x} y={p.y} w={184} h={40} fill={hot ? tok('safe', 0.15) : tok('panel')} stroke={hot ? tok('safe') : tok('line')}>
                <T x={p.x + 8} y={p.y + 14} size={11} mono>{e.label}</T>
                <T x={p.x + 8} y={p.y + 30} size={11} mono fill={tok('muted')}>{`clock ${st.vc[e.id]}`}</T>
              </Box>
            </g>
          );
        })}
        {st.po && <Arrow x1={100} y1={70} x2={100} y2={90} color={tok('ink', 0.6)} />}
        {st.po && st.show.includes('r') && <Arrow x1={300} y1={194} x2={300} y2={214} color={tok('ink', 0.6)} />}
        {st.sw && <Arrow x1={192} y1={124} x2={210} y2={160} color={tok('brand')} width={2.5} />}
        {st.sw && <T x={8} y={292} size={11} fill={tok('brand')}>bold arrow: synchronizes-with (release → acquire)</T>}
        {st.po && <T x={8} y={276} size={11} fill={tok('muted')}>thin arrows: program order</T>}
      </Svg>
    </StepFrame>
  );
}
