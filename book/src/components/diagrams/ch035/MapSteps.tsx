import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `type Columns<T> = {
  [K in keyof T]: T[K][];
};
type PC = Columns<Particle>;`;

const KEYS: [string, string][] = [['x', 'f1'], ['y', 'f2'], ['vx', 'f3'], ['vy', 'f4']];

type S = { line: number; done: number; k?: number; note: string };

const STATES: S[] = [
  { line: 3, done: 0, note: 'Columns<Particle> asks the checker to build a new object type. T is Particle, and nothing is built yet.' },
  { line: 1, done: 0, note: 'First the checker works out keyof T, the list to loop over: \'x\' | \'y\' | \'vx\' | \'vy\'. K will take each of these in turn.' },
  { line: 1, done: 1, k: 0, note: 'K = \'x\'. The right-hand side T[K][] becomes Particle[\'x\'][], and Particle[\'x\'] is number, so the new type gets x: number[].' },
  { line: 1, done: 2, k: 1, note: 'K = \'y\': the same template again, with y in place of x, giving y: number[].' },
  { line: 1, done: 3, k: 2, note: 'K = \'vx\', giving vx: number[]. One line of code, run once per key.' },
  { line: 1, done: 4, k: 3, note: 'K = \'vy\', giving vy: number[]. Every key has been visited.' },
  { line: 3, done: 4, note: 'The result is exactly the Columns interface we wrote by hand, now computed. Add mass to Particle and mass: number[] appears here too, with nothing else to update.' },
];

export default function MapSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A mapped type, one key at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The keys of Particle on the left, and the new type Columns<Particle> being built on the right">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>keyof Particle</T>
        <T x={196} y={14} size={11} weight={700} fill={tok('muted')}>{'Columns<Particle>'}</T>
        <Box x={192} y={24} w={204} h={144} fill={tok('brand', 0.06)} stroke={tok('brand')} />
        {KEYS.map(([k, f], i) => {
          const y = 44 + i * 32;
          const now = st.k === i;
          const built = i < st.done;
          return (
            <g key={k}>
              <Box x={8} y={y - 12} w={80} h={24} r={12} fill={now ? tok(f, 0.3) : tok(f, 0.12)} stroke={tok(f)}>
                <T x={48} y={y} size={13} mono weight={700} anchor="middle">{`'${k}'`}</T>
              </Box>
              {now && <T x={98} y={y} size={12} mono fill={tok('brand')}>{'K →'}</T>}
              {built ? (
                <T x={206} y={y} size={14} mono>{`${k}: number[];`}</T>
              ) : (
                <T x={206} y={y} size={13} mono fill={tok('muted')} opacity={0.6}>…</T>
              )}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
