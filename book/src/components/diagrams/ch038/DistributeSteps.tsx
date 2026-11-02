import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `type Exclude<T, U> =
  T extends U ? never : T;

type Bin = Exclude<
  'num' | 'add' | 'mul', 'num'>;`;

const MEMBERS = ['num', 'add', 'mul'];

// out[i]: undefined = not yet tested; null = became never; string = kept.
type S = { line: number; at?: number; out: (string | null | undefined)[]; result?: string; note: string };

const STATES: S[] = [
  { line: 3, out: [undefined, undefined, undefined], note: 'Bin asks for Exclude with T = \'num\' | \'add\' | \'mul\' and U = \'num\'. T is a union, and a conditional type on a bare T is tried once per member.' },
  { line: 1, at: 0, out: [null, undefined, undefined], note: 'Member \'num\': does \'num\' extend \'num\'? Yes, so this member becomes never, the type with no values.' },
  { line: 1, at: 1, out: [null, 'add', undefined], note: 'Member \'add\': does \'add\' extend \'num\'? No, so the false branch keeps it: \'add\'.' },
  { line: 1, at: 2, out: [null, 'add', 'mul'], note: 'Member \'mul\': no again, so it is kept: \'mul\'.' },
  { line: 3, out: [null, 'add', 'mul'], result: "'add' | 'mul'", note: 'The answers are joined back into a union: never | \'add\' | \'mul\'. A union with never in it is the same union without it, so Bin is \'add\' | \'mul\'.' },
];

export default function DistributeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A conditional type, one union member at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Each member of the union tested against 'num', and the union that is left">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>MEMBER</T>
        <T x={150} y={14} size={11} weight={700} fill={tok('muted')}>{"extends 'num'?"}</T>
        <T x={290} y={14} size={11} weight={700} fill={tok('muted')}>BECOMES</T>
        {MEMBERS.map((m, i) => {
          const y = 38 + i * 30;
          const o = st.out[i];
          const now = st.at === i;
          return (
            <g key={m}>
              <Box x={8} y={y - 12} w={72} h={24} r={12} fill={now ? tok('brand', 0.18) : tok('panel')} stroke={now ? tok('brand') : tok('ink', 0.4)}>
                <T x={44} y={y} size={13} mono anchor="middle">{`'${m}'`}</T>
              </Box>
              {o !== undefined && <T x={150} y={y} size={13} fill={o === null ? tok('danger') : tok('safe')}>{o === null ? 'yes: drop it' : 'no: keep it'}</T>}
              {o !== undefined && <T x={290} y={y} size={13} mono fill={o === null ? tok('muted') : undefined}>{o === null ? 'never' : `'${o}'`}</T>}
            </g>
          );
        })}
        <T x={8} y={136} size={12} weight={700}>Bin =</T>
        <T x={56} y={136} size={13} mono fill={st.result ? tok('brand') : tok('muted')}>{st.result ?? '…'}</T>
      </Svg>
    </StepFrame>
  );
}
