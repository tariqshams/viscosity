import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const a = { id: 1, pos: { x: 0 } };
const c = { ...a };
c.id = 2;
c.pos.x = 9;
console.log(a.id, a.pos.x); // 1 9`;

type S = { line: number; c: boolean; cid: number; px: number; out?: string; hl?: 'cid' | 'pos'; note: string };

const STATES: S[] = [
  { line: 0, c: false, cid: 1, px: 0, note: 'Two objects are made: the outer one that a points at, and an inner one, { x: 0 }. The outer object’s pos property holds an ARROW to the inner one.' },
  { line: 1, c: true, cid: 1, px: 0, note: '{ ...a } makes a brand-new outer object and copies each property of a into it. id copies the number 1. pos copies… the arrow. Now two arrows lead to the one inner object.' },
  { line: 2, c: true, cid: 2, px: 0, hl: 'cid', note: 'c.id = 2 changes c’s own id. a is a separate outer object, so a.id is still 1. So far, a real copy.' },
  { line: 3, c: true, cid: 2, px: 9, hl: 'pos', note: 'c.pos.x = 9 follows c.pos’s arrow to the shared inner object and changes it. a.pos leads to that same object.' },
  { line: 4, c: true, cid: 2, px: 9, out: '1 9', note: 'a.id is 1 (copied), but a.pos.x is 9 (shared). Spread copies one level deep: it is a SHALLOW copy.' },
];

export default function SpreadSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What spread copies, and what it shares" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={180} title="Variables a and c point at two outer objects, whose pos properties both point at one inner object">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>NAMES</T>
        <T x={92} y={12} size={11} weight={700} fill={tok('muted')}>OUTER OBJECTS</T>
        <T x={286} y={12} size={11} weight={700} fill={tok('muted')}>INNER</T>
        <Name y={48} n="a" />
        <Outer y={48} id={1} color="accent" />
        {st.c && (
          <>
            <Name y={126} n="c" />
            <Outer y={126} id={st.cid} color="brand" hot={st.hl === 'cid'} />
          </>
        )}
        <Box x={288} y={68} w={104} h={40} r={7} fill={tok('safe', st.hl === 'pos' ? 0.25 : 0.1)} stroke={tok('safe')}>
          <T x={300} y={88} size={15} mono>{'{ x: '}<tspan fill={tok('f1')} fontWeight={700}>{st.px}</tspan>{' }'}</T>
        </Box>
        <Arrow x1={232} y1={58} x2={286} y2={80} color={tok('safe')} />
        {st.c && <Arrow x1={232} y1={136} x2={286} y2={98} color={tok('safe')} />}
        {st.out && <T x={6} y={172} size={13} mono fill={tok('muted')}>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}

function Name({ y, n }: { y: number; n: string }) {
  return (
    <g>
      <Box x={6} y={y - 16} w={44} h={32} stroke={tok('ink', 0.5)}>
        <T x={16} y={y} size={15} mono weight={700}>{n}</T>
        <circle cx={40} cy={y} r={4} fill={tok('ink', 0.8)} />
      </Box>
      <Arrow x1={40} y1={y} x2={90} y2={y} />
    </g>
  );
}

function Outer({ y, id, color, hot }: { y: number; id: number; color: string; hot?: boolean }) {
  return (
    <Box x={92} y={y - 30} w={150} h={60} r={8} fill={tok(color, hot ? 0.25 : 0.08)} stroke={tok(color)}>
      <T x={104} y={y - 12} size={14} mono>id: <tspan fontWeight={700}>{id}</tspan></T>
      <T x={104} y={y + 12} size={14} mono>pos:</T>
      <circle cx={232} cy={y + 10} r={4} fill={tok('safe')} />
    </Box>
  );
}
