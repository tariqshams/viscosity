import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// A simplified four-stage pipeline: rows are stages, columns are clock
// ticks. Instruction k, starting at tick t, is in stage s at tick t + s.
const STAGES = ['fetch', 'decode', 'execute', 'write'];
type Ins = { name: string; start: number; kind?: 'branch' | 'guess' | 'dead' | 'fixed' };
type S = { ins: Ins[]; mark?: number; note: string };

const STATES: S[] = [
  { ins: [{ name: 'i1', start: 0 }, { name: 'i2', start: 4 }], note: 'Without a pipeline, each instruction goes through every stage before the next one starts. Two instructions take 8 ticks, and three of the four stages sit idle at any moment.' },
  { ins: [0, 1, 2, 3, 4].map((k) => ({ name: `i${k + 1}`, start: k })), note: 'With a pipeline, a new instruction starts every tick, like cars on an assembly line. After the first few ticks, one instruction finishes every tick: four times the throughput from the same stages.' },
  { ins: [{ name: 'i1', start: 0 }, { name: 'if', start: 1, kind: 'branch' }, { name: 'g1', start: 2, kind: 'guess' }, { name: 'g2', start: 3, kind: 'guess' }], mark: 3, note: 'Instruction 2 is an if. Its answer is only known when it executes, at tick 4. The pipeline can’t wait, so the CPU guesses which way it will go and keeps fetching from that side (dashed).' },
  { ins: [{ name: 'i1', start: 0 }, { name: 'if', start: 1, kind: 'branch' }, { name: 'g1', start: 2 }, { name: 'g2', start: 3 }, { name: 'g3', start: 4 }, { name: 'g4', start: 5 }], mark: 3, note: 'Guessed right: the guessed instructions were the right ones all along. No time lost. Most guesses are right.' },
  { ins: [{ name: 'i1', start: 0 }, { name: 'if', start: 1, kind: 'branch' }, { name: 'g1', start: 2, kind: 'dead' }, { name: 'g2', start: 3, kind: 'dead' }, { name: 'r1', start: 4, kind: 'fixed' }, { name: 'r2', start: 5, kind: 'fixed' }], mark: 3, note: 'Guessed wrong: the instructions behind the if are thrown away (crossed out) and the right ones start from the beginning. Those empty slots are the cost of a misprediction. Real pipelines are much deeper than four stages, so they lose more.' },
];

const X0 = 64;
const CW = 38;
const RH = 30;
const Y0 = 24;
const TICKS = 8;

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="An assembly line for instructions" steps={s} note={st.note}>
      <Svg w={400} h={Y0 + STAGES.length * RH + 12} title="A pipeline grid: four stages down the side, eight clock ticks across, with instructions moving diagonally through it">
        {Array.from({ length: TICKS }, (_, t) => (
          <T key={t} x={X0 + t * CW + CW / 2} y={10} size={10} mono anchor="middle" fill={tok('muted')}>t{t + 1}</T>
        ))}
        {STAGES.map((name, r) => (
          <g key={name}>
            <T x={X0 - 6} y={Y0 + r * RH + 13} size={11} anchor="end" weight={700}>{name}</T>
            {Array.from({ length: TICKS }, (_, t) => (
              <rect key={t} x={X0 + t * CW} y={Y0 + r * RH} width={CW - 3} height={RH - 4} rx={3} fill={tok('paper')} stroke={tok('line')} />
            ))}
          </g>
        ))}
        {st.mark !== undefined && (
          <rect x={X0 + st.mark * CW - 1.5} y={Y0 + 2 * RH - 1.5} width={CW} height={RH - 1} rx={4} fill="none" stroke={tok('warn')} strokeWidth={2.5} />
        )}
        {st.ins.flatMap((ins) =>
          STAGES.map((_, r) => {
            const t = ins.start + r;
            if (t >= TICKS) return null;
            const x = X0 + t * CW;
            const y = Y0 + r * RH;
            const dead = ins.kind === 'dead';
            if (dead && t > 3) return null;
            const col = ins.kind === 'branch' ? 'warn' : ins.kind === 'fixed' ? 'safe' : 'brand';
            return (
              <g key={`${ins.name}-${r}`} opacity={dead ? 0.45 : 1}>
                <rect x={x + 2} y={y + 2} width={CW - 7} height={RH - 8} rx={3} fill={tok(col, ins.kind === 'guess' || dead ? 0.15 : 0.7)} stroke={tok(col)} strokeDasharray={ins.kind === 'guess' ? '4 3' : undefined} />
                <T x={x + CW / 2 - 1.5} y={y + 13} size={11} mono weight={700} anchor="middle">{ins.name}</T>
                {dead && <line x1={x + 4} y1={y + 20} x2={x + CW - 7} y2={y + 4} stroke={tok('danger')} strokeWidth={2} />}
              </g>
            );
          }),
        )}
      </Svg>
    </StepFrame>
  );
}
