import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 194: the bill for adding languages, with and without a shared IR.
// Six analyses from Part VIII; line counts are `wc -l` of the repository's
// engine/ts/packages/{core,frontend-js,frontend-python}/src at the time of
// writing.
const ANALYSES = ['find', 'shape', 'safe', 'numeric', 'bounds', 'loops'];
const LANGS = ['JavaScript', 'Python', 'a third'];

type S = { mode: 'grid' | 'ir'; langs: number; hi: number; leak?: boolean; total: string; note: string };

const STATES: S[] = [
  { mode: 'grid', langs: 1, hi: -1, total: '6 pieces of analysis', note: 'One language. Part VIII built six analyses for JavaScript: find the collections, read their shapes, prove them safe, infer numeric fields, prove bounds, find the loops. Each box is code you wrote and tested.' },
  { mode: 'grid', langs: 2, hi: 1, total: '12 pieces of analysis', note: 'Add Python with no shared IR. Every analysis would have to be written again against Python’s syntax tree: six new boxes, six new sets of bugs, and two copies to keep in step for ever.' },
  { mode: 'grid', langs: 3, hi: 2, total: '18 pieces of analysis', note: 'A third language makes it 18. The bill is languages × analyses, and every new analysis is paid once per language too.' },
  { mode: 'ir', langs: 2, hi: -1, total: '6 analyses + 2 plugins', note: 'With VIR in the middle, the analyses run once, on VIR. Each language pays for one plugin: a parser, a lowering, an emitter. The bill is languages + analyses.' },
  { mode: 'ir', langs: 2, hi: 1, total: 'Python: 1,041 lines', note: 'The real Python plugin is 1,041 lines in five files: tokens 104, parser 339, lower 420, emit 134, index 44. The core it plugs into is 1,194 lines, and it got all of them.' },
  { mode: 'ir', langs: 2, hi: 1, leak: true, total: 'a few dozen core lines', note: 'Not quite free. A few dozen lines in the core ask module.language: a Python “number” must be a float, an index must be an int, and CPython’s measured cost changes the verdict.' },
];

export default function BillSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The bill for a new language" steps={s} note={st.note}>
      <Svg w={400} h={250} title="Analyses per language without a shared IR, and analyses shared over VIR with one plugin per language">
        {st.mode === 'grid' ? (
          <g>
            {LANGS.slice(0, st.langs).map((l, r) => (
              <g key={l}>
                <T x={6} y={34 + r * 52} size={11} weight={700}>{l}</T>
                {ANALYSES.map((a, c) => (
                  <Box key={a} x={6 + c * 65} y={44 + r * 52} w={58} h={26}
                    fill={r === st.hi ? tok('f2', 0.2) : tok('brand', 0.1)}
                    stroke={r === st.hi ? tok('f2') : tok('brand')}>
                    <T x={35 + c * 65} y={57 + r * 52} size={10} mono anchor="middle">{a}</T>
                  </Box>
                ))}
              </g>
            ))}
          </g>
        ) : (
          <g>
            {['JavaScript plugin', 'Python plugin'].map((l, k) => (
              <Box key={l} x={10 + k * 200} y={14} w={180} h={34}
                fill={k === st.hi ? tok('f4', 0.2) : 'transparent'}
                stroke={k === st.hi ? tok('f4') : tok('line')}>
                <T x={100 + k * 200} y={31} size={12} anchor="middle" weight={k === st.hi ? 700 : 400}>{l}</T>
              </Box>
            ))}
            <Arrow x1={100} y1={48} x2={170} y2={78} />
            <Arrow x1={300} y1={48} x2={230} y2={78} />
            <Box x={6} y={80} w={388} h={70} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={200} y={96} size={11} anchor="middle" weight={700} fill={tok('brand')}>VIR · shared core</T>
              {ANALYSES.map((a, c) => (
                <Box key={a} x={12 + c * 63} y={108} w={57} h={26}
                  fill={st.leak && (a === 'numeric' || a === 'bounds') ? tok('f6', 0.25) : tok('panel')}
                  stroke={st.leak && (a === 'numeric' || a === 'bounds') ? tok('f6') : tok('line')}>
                  <T x={40 + c * 63} y={121} size={10} mono anchor="middle">{a}</T>
                </Box>
              ))}
            </Box>
            <Box x={110} y={160} w={180} h={26}
              fill={st.leak ? tok('f6', 0.25) : 'transparent'} stroke={st.leak ? tok('f6') : tok('line')}>
              <T x={200} y={173} size={11} anchor="middle">plan · explain</T>
            </Box>
          </g>
        )}
        <Box x={6} y={204} w={388} h={38} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={200} y={223} size={13} anchor="middle" weight={700}>{st.total}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
