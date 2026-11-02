// Chapter 203-b (staged split of 188): liveness on the sum loop, block by
// block from last to first, round after round, until nothing changes.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const BLOCKS = [
  { name: 'b0', code: 's = 0; i = 0', use: '{ }', def: '{s, i}', x: 110, y: 6 },
  { name: 'b1', code: 'if i < n', use: '{i, n}', def: '{ }', x: 110, y: 82 },
  { name: 'b2', code: 's = s + i; i = i + 1', use: '{s, i}', def: '{s, i}', x: 6, y: 168 },
  { name: 'b3', code: 'return s', use: '{s}', def: '{ }', x: 238, y: 168 },
];

type S = { round: number; hot: number | null; ins: string[]; outs: string[]; note: string };
const E = ['', '', '', ''];
const STATES: S[] = [
  { round: 0, hot: null, ins: E, outs: E, note: 'The sum loop: b0 sets up, b1 tests i < n, b2 is the body (it jumps back to b1), b3 returns s. Each block shows what it reads before writing (use) and what it writes (def). Every live set starts empty.' },
  { round: 1, hot: 3, ins: ['', '', '', 's'], outs: E, note: 'Round 1, last block first. b3 has no successors, so nothing is live after it; it reads s, so in(b3) = {s}.' },
  { round: 1, hot: 2, ins: ['', '', 'i s', 's'], outs: E, note: 'b2’s only successor is b1, whose in set is still empty, so out(b2) = { }. b2 reads s and i before writing them: in(b2) = {i, s}.' },
  { round: 1, hot: 1, ins: ['', 'i n s', 'i s', 's'], outs: ['', 'i s', '', ''], note: 'out(b1) = in(b2) ∪ in(b3) = {i, s} ∪ {s} = {i, s}. b1 reads i and n: in(b1) = {i, n} ∪ {i, s} = {i, n, s}.' },
  { round: 1, hot: 0, ins: ['n', 'i n s', 'i s', 's'], outs: ['i n s', 'i s', '', ''], note: 'out(b0) = in(b1) = {i, n, s}. b0 writes s and i, so only n is live on entry: in(b0) = {n}. The parameter n must arrive in a register.' },
  { round: 2, hot: 2, ins: ['n', 'i n s', 'i n s', 's'], outs: ['i n s', 'i s', 'i n s', ''], note: 'Round 2. b1 has learned it reads n, so now out(b2) = in(b1) = {i, n, s}, and in(b2) grows to {i, n, s}: n is live in the body, carried round the back edge.' },
  { round: 2, hot: 1, ins: ['n', 'i n s', 'i n s', 's'], outs: ['i n s', 'i n s', 'i n s', ''], note: 'out(b1) = {i, n, s} ∪ {s} = {i, n, s}; in(b1) is unchanged. b0 and b3 do not change either.' },
  { round: 3, hot: null, ins: ['n', 'i n s', 'i n s', 's'], outs: ['i n s', 'i n s', 'i n s', ''], note: 'Round 3 changes nothing, so this is the fixpoint. n, i and s are live all round the loop, and n is the only thing live on entry to the function.' },
];

const W = 156;
const fmt = (s: string) => `{${s.split(' ').filter(Boolean).join(', ')}}`;

export default function LiveSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Liveness, backwards, round by round" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The sum loop's CFG. Each block shows its use and def sets and its current in and out live sets.">
        <Arrow x1={188} y1={70} x2={188} y2={80} />
        <Arrow x1={150} y1={146} x2={90} y2={166} />
        <Arrow x1={226} y1={146} x2={300} y2={166} />
        <Arrow x1={30} y1={168} x2={108} y2={112} bend={0.6} color={tok('accent')} />
        {BLOCKS.map((b, k) => {
          const hot = st.hot === k;
          const w = k === 2 ? 186 : W;
          return (
            <Box key={k} x={b.x} y={b.y} w={w} h={64} fill={hot ? tok('brand', 0.08) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={b.x + 6} y={b.y + 10} size={10} weight={700} fill={tok('muted')}>{`${b.name}  use ${b.use}  def ${b.def}`}</T>
              <T x={b.x + 6} y={b.y + 26} size={11.5} mono>{b.code}</T>
              <T x={b.x + 6} y={b.y + 42} size={11} mono fill={tok('brand')} weight={700}>{`in  ${st.ins[k] ? fmt(st.ins[k]) : '{ }'}`}</T>
              <T x={b.x + 6} y={b.y + 56} size={11} mono fill={tok('accent')} weight={700}>{`out ${st.outs[k] ? fmt(st.outs[k]) : '{ }'}`}</T>
            </Box>
          );
        })}
        <T x={396} y={252} size={11} anchor="end" fill={tok('muted')}>{st.round ? `round ${st.round}` : 'start'}</T>
      </Svg>
    </StepFrame>
  );
}
