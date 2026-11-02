// Start from Dog <: Animal and wrap both sides in the same context: the
// subtyping arrow keeps its direction, turns round, or disappears.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Dir = 'up' | 'down' | 'none';
type S = { name: string; top: string; bottom: string; dir: Dir; kind: string; note: string };
const STATES: S[] = [
  { name: 'the parts', top: 'Animal', bottom: 'Dog', dir: 'up', kind: 'Dog <: Animal', note: 'Start with two types where one is a subtype of the other: every Dog is an Animal (it has a name, and it can also bark). The arrow points from the subtype up to the supertype.' },
  { name: 'a function’s result', top: '() => Animal', bottom: '() => Dog', dir: 'up', kind: 'covariant: same direction', note: 'Wrap both in “a function that returns one”. Whoever expects a function that returns an Animal is happy to get a Dog back. The arrow keeps its direction: results are covariant.' },
  { name: 'a read-only array', top: 'readonly Animal[]', bottom: 'readonly Dog[]', dir: 'up', kind: 'covariant: same direction', note: 'A read-only array can only be read. Reading a Dog where an Animal was expected is fine, so this also keeps the direction.' },
  { name: 'a function’s parameter', top: '(d: Dog) => void', bottom: '(a: Animal) => void', dir: 'up', kind: 'contravariant: turned round', note: 'Now wrap them as a parameter. A function that can take any Animal can stand in for one that will only ever be given Dogs, but not the other way round. The arrow has turned round: parameters are contravariant.' },
  { name: 'a mutable array', top: 'Animal[]', bottom: 'Dog[]', dir: 'none', kind: 'invariant: no arrow at all', note: 'A mutable array is read (which wants the arrow one way) and written (which wants it the other way). Both cannot hold, so neither direction is safe: mutable arrays should be invariant.' },
];

export default function VarianceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const flipped = s.i === 3;
  return (
    <StepFrame title="What happens to Dog <: Animal inside other types" steps={s} note={st.note}>
      <Svg w={400} h={190} title="Two boxes, one above the other, for the wrapped supertype and subtype, and an arrow between them showing which way subtyping goes, if at all">
        <T x={200} y={16} size={12} anchor="middle" weight={700} fill={tok('muted')}>{`inside ${st.name}`}</T>
        <Box x={100} y={30} w={200} h={34} fill={tok('panel')} stroke={tok('line')}>
          <T x={200} y={47} size={13} mono anchor="middle">{st.top}</T>
        </Box>
        <Box x={100} y={118} w={200} h={34} fill={tok('panel')} stroke={tok('line')}>
          <T x={200} y={135} size={13} mono anchor="middle">{st.bottom}</T>
        </Box>
        {st.dir === 'up' && <Arrow x1={200} y1={114} x2={200} y2={68} color={flipped ? tok('accent') : tok('brand')} />}
        {st.dir === 'none' && (
          <g>
            <line x1={188} y1={80} x2={212} y2={104} stroke={tok('danger')} strokeWidth={3} />
            <line x1={212} y1={80} x2={188} y2={104} stroke={tok('danger')} strokeWidth={3} />
          </g>
        )}
        <T x={222} y={91} size={12} weight={700} fill={st.dir === 'none' ? tok('danger') : flipped ? tok('accent') : tok('brand')}>{st.dir === 'none' ? 'neither way' : '<:'}</T>
        <T x={200} y={176} size={12} anchor="middle" weight={700} fill={st.dir === 'none' ? tok('danger') : flipped ? tok('accent') : tok('safe')}>{st.kind}</T>
      </Svg>
    </StepFrame>
  );
}
