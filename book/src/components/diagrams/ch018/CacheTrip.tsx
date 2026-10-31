import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `s += a.x; // first time
s += a.x; // again, soon after
s += b.x; // somewhere new`;

const LEVELS = ['L1', 'L2', 'L3', 'RAM'];
type S = {
  line: number;
  holds: string[][]; // what each cache level holds (RAM holds everything)
  probe: number; // index of level being looked at, -1 for none
  hit?: boolean;
  back?: boolean;
  times: { label: string; ns: number }[];
  note: string;
};

const STATES: S[] = [
  { line: 0, holds: [[], [], []], probe: 0, hit: false, times: [], note: 'The CPU needs a.x. It looks in the smallest, fastest cache first: L1. It isn’t there. That is a cache miss.' },
  { line: 0, holds: [[], [], []], probe: 2, hit: false, times: [], note: 'So it asks L2, then L3. Each is bigger but slower. Still a miss: nobody has touched a.x recently.' },
  { line: 0, holds: [['a'], ['a'], ['a']], probe: 3, hit: true, back: true, times: [{ label: 'a: miss', ns: 100 }], note: 'All the way to main memory: the trip to the warehouse. On the way back, a copy is left in every cache level. This one read took around a hundred nanoseconds.' },
  { line: 1, holds: [['a'], ['a'], ['a']], probe: 0, hit: true, times: [{ label: 'a: miss', ns: 100 }, { label: 'a: hit', ns: 2 }], note: 'a.x again, soon after. This time L1 has it: a cache hit, in a couple of nanoseconds. Look at the two bars below.' },
  { line: 2, holds: [['a', 'b'], ['a', 'b'], ['a', 'b']], probe: 3, hit: true, back: true, times: [{ label: 'a: miss', ns: 100 }, { label: 'a: hit', ns: 2 }, { label: 'b: miss', ns: 100 }], note: 'b is a different object, somewhere else in memory. Nothing cached helps, so it is another long trip.' },
  { line: 2, holds: [['a', 'b'], ['a', 'b'], ['a', 'b']], probe: -1, times: [{ label: 'a: miss', ns: 100 }, { label: 'a: hit', ns: 2 }, { label: 'b: miss', ns: 100 }], note: 'Three reads, and nearly all the time went on the two misses. Speed comes down to one question: how often is the data already in a cache?' },
];

export default function CacheTrip() {
  const s = useSteps(STATES);
  const st = s.state;
  const bx = (k: number) => 70 + k * 82;
  return (
    <StepFrame title="A trip through the caches" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={204} title="The CPU looks for data in L1, then L2, then L3, then main memory. A timeline below shows how long each read took.">
        <Box x={4} y={30} w={52} h={56} r={6} fill={tok('brand', 0.85)} stroke={tok('brand')}>
          <T x={30} y={58} size={13} weight={700} anchor="middle" fill={tok('panel')}>CPU</T>
        </Box>
        {LEVELS.map((name, k) => {
          const probed = st.probe === k || (st.probe > k && st.probe !== -1);
          const isHitHere = st.probe === k && st.hit;
          const stroke = !probed ? tok('ink', 0.4) : isHitHere ? tok('safe') : tok('danger');
          const w = 58 + k * 2;
          return (
            <g key={name}>
              <Box x={bx(k)} y={30 - k * 3} w={w} h={56 + k * 6} r={6} stroke={stroke} fill={k === 3 ? tok('muted', 0.12) : tok('paper')}>
                <T x={bx(k) + w / 2} y={22 - k * 3 + 20} size={12} weight={700} anchor="middle">{name}</T>
                <T x={bx(k) + w / 2} y={66} size={13} mono anchor="middle">
                  {k === 3 ? 'a, b, …' : st.holds[k].join(', ') || '–'}
                </T>
              </Box>
              {probed && st.probe !== -1 && (
                <T x={bx(k) + w / 2} y={100 + k * 3} size={11} weight={700} anchor="middle" fill={isHitHere ? tok('safe') : tok('danger')}>
                  {isHitHere ? (k === 3 ? 'found' : 'hit') : 'miss'}
                </T>
              )}
            </g>
          );
        })}
        {st.back && <Arrow x1={bx(3) + 10} y1={22} x2={58} y2={34} bend={0.15} color={tok('accent')} dash />}
        <T x={4} y={128} size={11} weight={700} fill={tok('muted')}>TIME PER READ (rough)</T>
        {st.times.map((t, i) => (
          <g key={i}>
            <T x={4} y={148 + i * 20} size={11} mono>{t.label}</T>
            <rect x={70} y={141 + i * 20} width={Math.max(3, t.ns * 2.6)} height={14} rx={2} fill={t.ns > 10 ? tok('danger', 0.75) : tok('safe', 0.85)} />
            <T x={76 + Math.max(3, t.ns * 2.6)} y={148 + i * 20} size={11} mono fill={tok('muted')}>≈{t.ns} ns</T>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
