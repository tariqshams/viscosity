import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One monomorphic inline cache at p.x inside step(p) { p.x += p.vx; },
// as particles of one shape arrive. The states match the real
// `node --log-ic` run in 'Inline caches' (Node v22.23.4, V8 12.4):
// LoadIC 4:20 0 → 1 x, and no further transitions.
type S = { n: number | null; state: '0' | '1'; result: '' | 'miss' | 'hit'; entry: boolean; search: boolean; note: string };

const STATES: S[] = [
  { n: null, state: '0', result: '', entry: false, search: false, note: 'The load p.x has a feedback slot of its own, and nothing in it yet: state 0, uninitialised.' },
  { n: 0, state: '0', result: 'miss', entry: false, search: true, note: 'ps[0] arrives, with map M. The cache is empty, so V8 does the slow lookup: it reads M’s descriptors to find that x is field 0.' },
  { n: 0, state: '1', result: 'miss', entry: true, search: false, note: 'It writes the answer down in the slot: "map M → load field 0". One map seen: the site is now monomorphic (state 1).' },
  { n: 1, state: '1', result: 'hit', entry: true, search: false, note: 'ps[1] arrives. One comparison (is its map M? yes) and one load from field 0. No descriptors, no search.' },
  { n: 2, state: '1', result: 'hit', entry: true, search: false, note: 'And the same for ps[2], and for every one of the thousand particles, because they were all built the same way and share map M.' },
];

export default function HitMissSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A monomorphic cache at p.x" steps={s} note={st.note}>
      <Svg w={400} h={190} title="An incoming particle with map M on the left, the access site p.x in the middle with its state, and the cache entry and M's descriptor array on the right.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ARRIVING</T>
        <Box x={8} y={22} w={90} h={44} fill={st.n === null ? tok('panel') : tok('f1', 0.15)} stroke={st.n === null ? tok('line') : tok('f1')} dash={st.n === null}>
          <T x={53} y={37} size={12} mono anchor="middle">{st.n === null ? 'nothing' : `ps[${st.n}]`}</T>
          <T x={53} y={55} size={11} anchor="middle" fill={tok('muted')}>{st.n === null ? '' : 'map M'}</T>
        </Box>
        <Arrow x1={100} y1={44} x2={132} y2={44} />
        <T x={136} y={12} size={11} weight={700} fill={tok('muted')}>SITE</T>
        <Box x={136} y={22} w={110} h={44} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={146} y={38} size={14} mono weight={700}>p.<tspan fill={tok('f1')}>x</tspan></T>
          <T x={146} y={56} size={11} fill={tok('muted')}>state {st.state}{st.state === '1' ? ': monomorphic' : ': empty'}</T>
        </Box>
        <Box x={256} y={22} w={136} h={44} fill={st.result === 'hit' ? tok('safe', 0.15) : st.result === 'miss' ? tok('warn', 0.15) : tok('panel')} stroke={st.result === 'hit' ? tok('safe') : st.result === 'miss' ? tok('warn') : tok('line')}>
          <T x={324} y={44} size={13} weight={700} anchor="middle" fill={st.result === 'hit' ? tok('safe') : st.result === 'miss' ? tok('warn') : tok('muted')}>{st.result === 'hit' ? 'hit: check + load' : st.result === 'miss' ? 'miss: slow lookup' : 'not run yet'}</T>
        </Box>
        <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>THE SLOT REMEMBERS</T>
        <Box x={8} y={102} w={180} h={30} fill={st.entry ? tok('brand', 0.12) : tok('panel')} stroke={st.entry ? tok('brand') : tok('line')} dash={!st.entry}>
          <T x={18} y={117} size={12} mono>{st.entry ? 'map M → field 0' : '(nothing)'}</T>
        </Box>
        <T x={210} y={92} size={11} weight={700} fill={tok('muted')}>M’S DESCRIPTORS</T>
        <Box x={210} y={102} w={182} h={60} fill={st.search ? tok('warn', 0.12) : tok('panel')} stroke={st.search ? tok('warn') : tok('line')}>
          <T x={220} y={120} size={12} mono fill={tok('f1')}>x  → field 0</T>
          <T x={220} y={140} size={12} mono fill={tok('f3')}>vx → field 1</T>
          {st.search && <T x={220} y={156} size={11} fill={tok('warn')}>searched on a miss</T>}
        </Box>
        <T x={8} y={178} size={11} fill={tok('muted')}>{st.result === 'hit' ? 'a hit never reads the descriptors' : ''}</T>
      </Svg>
    </StepFrame>
  );
}
