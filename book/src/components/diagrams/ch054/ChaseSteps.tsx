import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// Four reads that each miss and take a full trip to main memory (drawn as
// about 100 ns, the rough figure used in the chapter on latency). When the
// addresses are known up front, the trips overlap; when each address is
// inside the previous node, they happen one after another.
const CODE = `// addresses known up front
for (const j of idx) s += x[j];
// each address inside the last node
for (let p = head; p; p = p.next) s += p.v;`;

type Mode = 'overlap' | 'chain';
type S = { line: number; mode: Mode; shown: number; total?: boolean; note: string };

const STATES: S[] = [
  { line: 1, mode: 'overlap', shown: 4, note: 'Reading x[j] for four shuffled j. The CPU can work out every address straight from idx, so it sends all four requests almost at once, without waiting for the first to come back.' },
  { line: 1, mode: 'overlap', shown: 4, total: true, note: 'The four trips overlap, so all four values arrive soon after one trip’s time. The prefetcher cannot guess shuffled addresses, but the CPU itself can still keep several reads in flight.' },
  { line: 3, mode: 'chain', shown: 1, note: 'Walking a linked list. The first read fetches node 1. The address of node 2 is stored inside node 1, so the CPU cannot even ask for node 2 yet.' },
  { line: 3, mode: 'chain', shown: 2, note: 'Node 1 has arrived; now read 2 can start. Every step waits for the one before it.' },
  { line: 3, mode: 'chain', shown: 4, total: true, note: 'Four reads, four full trips, one after another: about four times as long as the overlapped reads. This is pointer chasing.' },
];

const X0 = 64;
const PX = 0.75; // pixels per nanosecond
const TRIP = 100;

export default function ChaseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const start = (k: number) => (st.mode === 'overlap' ? k * 5 : k * TRIP);
  const end = start(st.shown - 1) + TRIP;
  return (
    <StepFrame title="Overlapping reads, and reads that wait" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="A timeline of four reads from main memory: overlapping when the addresses are known, one after another when each address comes from the previous read">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>
          {st.mode === 'overlap' ? 'INDEPENDENT READS: x[j]' : 'POINTER CHASING: p = p.next'}
        </T>
        {[0, 100, 200, 300, 400].map((t) => (
          <g key={t}>
            <line x1={X0 + t * PX} x2={X0 + t * PX} y1={24} y2={130} stroke={tok('line')} strokeDasharray="3 3" />
            <T x={X0 + t * PX} y={142} size={11} mono anchor="middle" fill={tok('muted')}>{t}</T>
          </g>
        ))}
        <T x={X0 + 200 * PX} y={158} size={11} anchor="middle" fill={tok('muted')}>time (ns, rough)</T>
        {Array.from({ length: 4 }, (_, k) => {
          const y = 30 + k * 24;
          return (
            <g key={k}>
              <T x={X0 - 8} y={y + 8} size={11} anchor="end">{st.mode === 'overlap' ? `x[j${k + 1}]` : `node ${k + 1}`}</T>
              {k < st.shown && (
                <rect x={X0 + start(k) * PX} y={y} width={TRIP * PX} height={16} rx={3}
                  fill={st.mode === 'overlap' ? tok('safe', 0.75) : tok('danger', 0.7)} />
              )}
            </g>
          );
        })}
        {st.total && (
          <g>
            <line x1={X0 + end * PX} x2={X0 + end * PX} y1={24} y2={130} stroke={tok('ink')} strokeWidth={2} />
            <T x={X0 + end * PX + (end > 250 ? -4 : 4)} y={124} size={12} mono weight={700} anchor={end > 250 ? 'end' : 'start'}>≈ {end} ns</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
