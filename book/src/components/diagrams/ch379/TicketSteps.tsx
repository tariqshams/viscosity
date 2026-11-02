import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 379: one reader's session with the Playground's Rust engine, as
// Playground.tsx and play.worker.ts handle it. Every compile gets a ticket
// (++latest); a reply is shown only if its ticket is still the latest.
// A reply marked fatal (a WebAssembly.RuntimeError, i.e. a Rust panic)
// terminates the worker, and the next compile starts a fresh one. The
// sequence is an illustration of the code's rules, not a recorded trace.
type Ev =
  | { k: 'send'; id: number; to: 0 | 1 }
  | { k: 'reply'; id: number; from: 0 | 1; verdict: 'shown' | 'stale' | 'error' }
  | { k: 'ts'; id: number }
  | { k: 'note'; text: string; w: 0 | 1 };
type S = { evs: Ev[]; latest: number; showing: string; dead?: boolean; second?: boolean; note: string };

const STATES: S[] = [
  { evs: [{ k: 'send', id: 1, to: 0 }, { k: 'note', text: 'fetching about 1.4 MB…', w: 0 }], latest: 1, showing: 'Loading the Rust engine…', note: 'The reader presses Rust. The page makes ticket 1 and starts a worker. Its first job is to fetch and instantiate /wasm/viscosity_wasm_bg.wasm, which takes a moment.' },
  { evs: [{ k: 'send', id: 2, to: 0 }, { k: 'send', id: 3, to: 0 }], latest: 3, showing: 'Loading the Rust engine…', note: 'They type two characters. Each edit compiles again: tickets 2 and 3. All three requests wait in the worker for the same loading promise.' },
  { evs: [{ k: 'ts', id: 4 }], latest: 4, showing: '#4 (TypeScript)', note: 'Impatient, they switch to TS. The TypeScript engine runs on the page, synchronously: ticket 4 is compiled and shown at once.' },
  { evs: [{ k: 'reply', id: 1, from: 0, verdict: 'stale' }, { k: 'reply', id: 2, from: 0, verdict: 'stale' }, { k: 'reply', id: 3, from: 0, verdict: 'stale' }], latest: 4, showing: '#4 (TypeScript)', note: 'Now the module is ready and the worker answers 1, 2 and 3. None of them is ticket 4, so all three are dropped. Without tickets, Rust’s answer to an old edit would replace the newer TS one.' },
  { evs: [{ k: 'send', id: 5, to: 0 }, { k: 'reply', id: 5, from: 0, verdict: 'shown' }], latest: 5, showing: '#5 (Rust)', note: 'Back to Rust: ticket 5. The worker is warm, the reply comes quickly, and 5 is the latest, so it is shown with “compiled in … ms”.' },
  { evs: [{ k: 'send', id: 6, to: 0 }, { k: 'reply', id: 6, from: 0, verdict: 'error' }], latest: 6, dead: true, showing: '#6: RuntimeError: unreachable', note: 'Suppose some input made the engine panic. In WebAssembly that is a trap: the worker catches a WebAssembly.RuntimeError and replies with fatal: true. The error is shown, and the page terminates the worker.' },
  { evs: [{ k: 'send', id: 7, to: 1 }, { k: 'note', text: 'fetching again…', w: 1 }, { k: 'reply', id: 7, from: 1, verdict: 'shown' }], latest: 7, dead: true, second: true, showing: '#7 (Rust)', note: 'The next edit finds no worker and starts a fresh one, with a fresh instance and fresh memory. It says “Loading…” again, because nothing of the broken instance is trusted.' },
];

const PX = 70;
const W0 = 250;
const W1 = 345;
const lane = (w: 0 | 1) => (w === 0 ? W0 : W1);

export default function TicketSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const all = STATES.slice(0, s.i + 1).flatMap((x, j) => x.evs.map((e) => ({ e, now: j === s.i })));
  const top = 70;
  const dy = 19;
  const H = top + STATES.reduce((n, x) => n + x.evs.length, 0) * dy + 46;
  const deadAt = top + (STATES.slice(0, 6).reduce((n, x) => n + x.evs.length, 0) - 1) * dy + 9;
  return (
    <StepFrame title="Tickets, stale replies and a fresh worker" steps={s} note={st.note}>
      <Svg w={400} h={H} title="Messages between the playground page and its Rust worker, with each reply shown or dropped">
        <Box x={PX - 50} y={6} w={100} h={26} r={4} fill={tok('brand', 0.12)} stroke={tok('brand')}>
          <T x={PX} y={19} size={11} anchor="middle" weight={700}>page</T>
        </Box>
        <Box x={W0 - 40} y={6} w={80} h={26} r={4} fill={tok('panel')} stroke={st.dead ? tok('danger') : tok('line')}>
          <T x={W0} y={19} size={11} anchor="middle">worker</T>
        </Box>
        {st.second && (
          <Box x={W1 - 40} y={6} w={80} h={26} r={4} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={W1} y={19} size={11} anchor="middle">new worker</T>
          </Box>
        )}
        <T x={PX} y={44} size={10} mono anchor="middle" fill={tok('brand')}>{`latest = ${st.latest}`}</T>
        <line x1={PX} x2={PX} y1={50} y2={H - 40} stroke={tok('line')} />
        <line x1={W0} x2={W0} y1={34} y2={st.dead ? deadAt : H - 40} stroke={tok('line')} />
        {st.dead && <T x={W0} y={deadAt + 6} size={14} anchor="middle" fill={tok('danger')} weight={700}>✕</T>}
        {st.second && <line x1={W1} x2={W1} y1={34} y2={H - 40} stroke={tok('line')} />}
        {all.map(({ e, now }, i) => {
          const y = top + i * dy;
          const op = now ? 1 : 0.45;
          if (e.k === 'send') return (
            <g key={i} opacity={op}>
              <Arrow x1={PX + 4} y1={y} x2={lane(e.to) - 4} y2={y} width={1.5} color={tok('ink', 0.6)} />
              <T x={PX + 14} y={y - 7} size={9} mono>{`compile #${e.id}`}</T>
            </g>
          );
          if (e.k === 'reply') {
            const c = e.verdict === 'shown' ? tok('safe') : e.verdict === 'error' ? tok('danger') : tok('muted');
            return (
              <g key={i} opacity={op}>
                <Arrow x1={lane(e.from) - 4} y1={y} x2={PX + 4} y2={y} width={1.5} color={c} dash={e.verdict === 'stale'} />
                <T x={lane(e.from) - 10} y={y - 7} size={9} mono anchor="end" fill={c}>{`#${e.id} ${e.verdict === 'stale' ? '✗ stale' : e.verdict === 'error' ? 'fatal' : '✓ shown'}`}</T>
              </g>
            );
          }
          if (e.k === 'ts') return (
            <g key={i} opacity={op}>
              <T x={PX + 8} y={y} size={9} mono fill={tok('accent')}>{`#${e.id} TS engine, on the page ✓`}</T>
            </g>
          );
          return (
            <g key={i} opacity={op}>
              <T x={e.w === 0 ? W0 + 6 : W1 - 6} y={y} size={9} mono anchor={e.w === 0 ? 'start' : 'end'} fill={tok('muted')}>{e.text}</T>
            </g>
          );
        })}
        <Box x={8} y={H - 32} w={384} h={24} r={4} fill={tok('paper')} stroke={tok('line')}>
          <T x={16} y={H - 20} size={10} mono>{`showing: ${st.showing}`}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
