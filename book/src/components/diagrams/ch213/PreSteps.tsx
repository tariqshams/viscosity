// Chapter 213: partial redundancy elimination on a diamond, step by step:
// anticipability backwards, availability forwards, then the insertion that
// makes a + b in b3 fully redundant.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Fact = '' | 'yes' | 'no';
type S = { ant: Fact[]; av: Fact[]; inserted: boolean; phi: boolean; hot: number | null; note: string };
const N: Fact[] = ['', '', '', ''];
const STATES: S[] = [
  { ant: N, av: N, inserted: false, phi: false, hot: 3, note: 'a + b is computed in b1 and again in b3. Is the one in b3 redundant? On the path through b1, yes; through b2, no. It is partially redundant.' },
  { ant: ['', '', '', 'yes'], av: N, inserted: false, phi: false, hot: 3, note: 'Anticipability, backwards from the end. b3 computes a + b first thing, so a + b is anticipable on entry to b3.' },
  { ant: ['', 'yes', 'yes', 'yes'], av: N, inserted: false, phi: false, hot: 2, note: 'b2 does not compute a + b, but its only successor b3 anticipates it, and b2 does not change a or b: anticipable on entry to b2. b1 computes it itself: anticipable too.' },
  { ant: ['yes', 'yes', 'yes', 'yes'], av: N, inserted: false, phi: false, hot: 0, note: 'b0: both successors anticipate a + b (the intersection keeps it), so it is anticipable in b0 as well. Every path from anywhere here computes a + b.' },
  { ant: ['yes', 'yes', 'yes', 'yes'], av: ['no', 'yes', 'no', ''], inserted: false, phi: false, hot: 1, note: 'Availability, forwards: is a + b already computed on every path to the end of each block? Not after b0; yes after b1, which computes it; not after b2.' },
  { ant: ['yes', 'yes', 'yes', 'yes'], av: ['no', 'yes', 'no', 'no'], inserted: false, phi: false, hot: 3, note: 'On entry to b3, availability meets by intersection: yes from b1, no from b2, so no. Available on some predecessors but not all, and anticipable in all of them: the PRE pattern.' },
  { ant: ['yes', 'yes', 'yes', 'yes'], av: ['no', 'yes', 'yes', 'yes'], inserted: true, phi: false, hot: 2, note: 'Insert a + b at the end of b2, the predecessor where it is anticipable but not available. That is safe: every path through b2 was going to compute it in b3 anyway.' },
  { ant: ['yes', 'yes', 'yes', 'yes'], av: ['no', 'yes', 'yes', 'yes'], inserted: true, phi: true, hot: 3, note: 'Now a + b is available on both edges into b3, so b3’s computation is fully redundant: replace it with phi %5, %7. Through b1: one addition instead of two. Through b2: still one.' },
];

const BL = [
  { name: 'b0', x: 130, y: 6, rows: ['condbr %c, b1, b2'] },
  { name: 'b1', x: 6, y: 86, rows: ['%5 = a + b'] },
  { name: 'b2', x: 222, y: 86, rows: [] as string[] },
  { name: 'b3', x: 130, y: 172, rows: ['%9 = a + b'] },
];
const W = 172;

export default function PreSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rows = (k: number) => k === 2 && st.inserted ? ['%7 = a + b  (new)'] : k === 3 && st.phi ? ['%9 = phi %5, %7'] : BL[k].rows;
  const H = 62;
  return (
    <StepFrame title="Making a partial redundancy full" steps={s} note={st.note}>
      <Svg w={400} h={244} title="A diamond CFG: b0 branches to b1 and b2, which join at b3. Each block shows its code, whether a + b is anticipable on entry (ANT) and available on exit (AV).">
        <Arrow x1={170} y1={6 + H} x2={100} y2={84} />
        <Arrow x1={260} y1={6 + H} x2={310} y2={84} />
        <Arrow x1={92} y1={86 + H} x2={170} y2={170} />
        <Arrow x1={308} y1={86 + H} x2={260} y2={170} />
        {BL.map((b, k) => {
          const hot = st.hot === k;
          const r = rows(k);
          return (
            <Box key={k} x={b.x} y={b.y} w={W} h={H} fill={hot ? tok('brand', 0.08) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={b.x + 8} y={b.y + 10} size={10} weight={700} fill={tok('muted')}>{b.name}</T>
              {r.map((t, j) => (
                <T key={j} x={b.x + 8} y={b.y + 27 + j * 15} size={12} mono
                  fill={t.includes('new') ? tok('safe') : t.includes('phi') ? tok('accent') : undefined}
                  weight={t.includes('new') || t.includes('phi') ? 700 : 400}>{t}</T>
              ))}
              <T x={b.x + 8} y={b.y + 51} size={11} mono weight={700} fill={st.ant[k] === 'yes' ? tok('brand') : tok('muted')}>{`ANT ${st.ant[k] || '?'}`}</T>
              <T x={b.x + 90} y={b.y + 51} size={11} mono weight={700} fill={st.av[k] === 'yes' ? tok('safe') : st.av[k] === 'no' ? tok('danger') : tok('muted')}>{`AV ${st.av[k] || '?'}`}</T>
            </Box>
          );
        })}
        <T x={6} y={240} size={11} fill={tok('muted')}>ANT: anticipable on entry · AV: available on exit (b3: on entry)</T>
      </Svg>
    </StepFrame>
  );
}
