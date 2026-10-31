import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Svg, T, tok } from '../../viz/svg';

// Ten cache lines in a row. Each step is one read. The prefetcher watches
// the sequence of lines and, once it sees a steady stride, asks for the
// next lines before the program does.
type Read = { line: number; result: 'miss' | 'hit' };
type S = { reads: Read[]; prefetched: number[]; arrows?: number[]; title: string; note: string };

const STATES: S[] = [
  { title: 'walking an array', reads: [{ line: 0, result: 'miss' }], prefetched: [], note: 'A loop walks a big array that isn’t cached. The first read misses: a full trip to main memory.' },
  { title: 'walking an array', reads: [{ line: 0, result: 'miss' }, { line: 1, result: 'miss' }], prefetched: [], note: 'The next read is in the next line. Another miss. But the prefetcher, a piece of hardware watching which lines are requested, has noticed: line 0, then line 1.' },
  { title: 'walking an array', reads: [{ line: 0, result: 'miss' }, { line: 1, result: 'miss' }, { line: 2, result: 'miss' }], prefetched: [3, 4, 5], arrows: [3, 4, 5], note: 'Line 2: a steady pattern. Without being asked, the prefetcher requests lines 3, 4 and 5, while the loop is still busy with line 2.' },
  { title: 'walking an array', reads: [{ line: 0, result: 'miss' }, { line: 1, result: 'miss' }, { line: 2, result: 'miss' }, { line: 3, result: 'hit' }, { line: 4, result: 'hit' }], prefetched: [5, 6, 7], arrows: [6, 7], note: 'By the time the loop gets to lines 3 and 4, they have already arrived: hits. The prefetcher keeps running ahead. The long trips still happen, but the loop no longer waits for them.' },
  { title: 'chasing pointers', reads: [{ line: 7, result: 'miss' }, { line: 2, result: 'miss' }], prefetched: [], note: 'Now follow pointers between objects scattered around memory: line 7, then line 2. There is no pattern to spot.' },
  { title: 'chasing pointers', reads: [{ line: 7, result: 'miss' }, { line: 2, result: 'miss' }, { line: 9, result: 'miss' }, { line: 4, result: 'miss' }], prefetched: [], note: 'Worse, the next address is stored inside the object you are waiting for. Nobody, not even the CPU, knows where to go next until the current read arrives. Every read pays the full trip.' },
];

const LW = 34;
const X0 = 30;

export default function PrefetchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const last = st.reads[st.reads.length - 1];
  return (
    <StepFrame title="The prefetcher spots a pattern" steps={s} note={st.note}>
      <Svg w={400} h={160} title="Ten cache lines. Reads are marked as hits or misses; lines the prefetcher has requested early are marked.">
        <T x={X0} y={12} size={12} weight={700}>{st.title}</T>
        {Array.from({ length: 10 }, (_, k) => {
          const read = st.reads.find((r) => r.line === k);
          const pre = st.prefetched.includes(k) && !read;
          const fill = read ? (read.result === 'hit' ? tok('safe', 0.75) : tok('danger', 0.7)) : pre ? tok('accent', 0.25) : tok('paper');
          return (
            <g key={k}>
              <rect x={X0 + k * LW} y={60} width={LW - 4} height={34} rx={4} fill={fill} stroke={last && last.line === k ? tok('ink') : pre ? tok('accent') : tok('line')} strokeWidth={last && last.line === k ? 2 : 1} strokeDasharray={pre ? '4 3' : undefined} />
              <T x={X0 + k * LW + 15} y={106} size={10} mono anchor="middle" fill={tok('muted')}>{k}</T>
              {read && <T x={X0 + k * LW + 15} y={77} size={10} weight={700} anchor="middle" fill={tok('panel')}>{read.result}</T>}
              {pre && <T x={X0 + k * LW + 15} y={77} size={9} anchor="middle" fill={tok('accent')}>early</T>}
            </g>
          );
        })}
        <T x={X0} y={124} size={11} mono fill={tok('muted')}>read order: {st.reads.map((r) => r.line).join(' → ')}</T>
        {st.arrows?.map((k) => (
          <Arrow key={k} x1={X0 + k * LW + 15} y1={28} x2={X0 + k * LW + 15} y2={56} color={tok('accent')} />
        ))}
        {st.arrows && <T x={X0 + st.arrows[0] * LW - 4} y={24} size={10} anchor="end" fill={tok('accent')}>prefetch</T>}
        <rect x={X0} y={134} width={12} height={12} fill={tok('danger', 0.7)} rx={2} />
        <T x={X0 + 16} y={140} size={10}>miss</T>
        <rect x={X0 + 56} y={134} width={12} height={12} fill={tok('safe', 0.75)} rx={2} />
        <T x={X0 + 72} y={140} size={10}>hit</T>
        <rect x={X0 + 104} y={134} width={12} height={12} fill={tok('accent', 0.25)} stroke={tok('accent')} strokeDasharray="3 2" rx={2} />
        <T x={X0 + 120} y={140} size={10}>fetched early, not read yet</T>
      </Svg>
    </StepFrame>
  );
}
