import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// How frontend-js/src/index.ts attaches `@viscosity` comments to
// declarations: each comment (with the line it ends on) is matched against
// /@viscosity\s+(aosoa|soa|aos)\b(?:\((\d+)\))?/, and a match applies to
// the next line's declaration if the comment is alone on its line, or
// its own line's declaration if it trails code. The outcome below is the
// real `viscosity explain` result for this program (plus loops using it).
const CODE = `// @viscosity aos
const ps = [];
const qs = []; // @viscosity soa
// @viscosity SoA
const rs = [];
/* @viscosity aosoa(4) */

const ts = [];`;

type Row = { line: number; text: string; match: string; to: string };
const ROWS: Row[] = [
  { line: 1, text: '@viscosity aos', match: 'aos', to: 'ps' },
  { line: 3, text: '@viscosity soa', match: 'soa', to: 'qs' },
  { line: 4, text: '@viscosity SoA', match: 'no match', to: '–' },
  { line: 6, text: '@viscosity aosoa(4)', match: 'aosoa, 4', to: 'nothing' },
];

type S = { line: number | null; rows: number; cur: number; final: 0 | 1 | 2; note: string };
const STATES: S[] = [
  { line: null, rows: 0, cur: -1, final: 0, note: 'While parsing, acorn hands Viscosity every comment, line or block, with the line it ends on. Nothing has been attached yet.' },
  { line: 0, rows: 1, cur: 0, final: 0, note: 'Line 1 matches the pattern: layout aos. The comment is alone on its line, so it applies to the next line. ps is declared on line 2, so ps gets aos.' },
  { line: 2, rows: 2, cur: 1, final: 0, note: 'A comment at the end of a line works too. This one ends on line 3, the same line as qs, so qs gets soa. A trailing comment never reaches the line below.' },
  { line: 3, rows: 3, cur: 2, final: 0, note: 'The pattern is case-sensitive: SoA is not soa, so this comment is just a comment. There is no warning. rs gets no annotation.' },
  { line: 5, rows: 4, cur: 3, final: 0, note: 'A block comment matches: aosoa with block size 4. But line 6 has no declaration, and line 7 is blank, so it attaches to nothing. Again, no warning.' },
  { line: 7, rows: 4, cur: -1, final: 1, note: 'The result: two annotated bindings. In the default auto mode, rs and ts go down the rest of the ladder and, with 100 elements each and a loop over x, become soa anyway.' },
  { line: 7, rows: 4, cur: -1, final: 2, note: 'With --mode opt-in, only annotations count. ps stays an array of objects as told, qs becomes soa, and rs and ts are kept: “opt-in mode: not annotated”.' },
];

const FINAL = [
  { n: 'ps', ann: 'aos', auto: 'aos', opt: 'aos' },
  { n: 'qs', ann: 'soa', auto: 'soa', opt: 'soa' },
  { n: 'rs', ann: '–', auto: 'soa', opt: 'aos' },
  { n: 'ts', ann: '–', auto: 'soa', opt: 'aos' },
];

export default function AnnotationSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Attaching annotations to declarations" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={st.final ? 250 : 150} title="Each comment, whether it matches, and which declaration it attaches to">
        <T x={8} y={12} size={10} weight={700} fill={tok('muted')}>LINE</T>
        <T x={48} y={12} size={10} weight={700} fill={tok('muted')}>COMMENT</T>
        <T x={218} y={12} size={10} weight={700} fill={tok('muted')}>MATCH</T>
        <T x={318} y={12} size={10} weight={700} fill={tok('muted')}>APPLIES TO</T>
        {ROWS.map((r, k) => {
          const y = 24 + k * 30;
          const shown = k < st.rows;
          const bad = r.match === 'no match' || r.to === 'nothing';
          return (
            <Box key={k} x={4} y={y} w={392} h={26} dash={!shown}
              fill={st.cur === k ? tok(bad ? 'danger' : 'brand', 0.12) : 'transparent'}
              stroke={st.cur === k ? tok(bad ? 'danger' : 'brand') : tok('line')}>
              <T x={18} y={y + 13} size={11} mono anchor="middle">{r.line}</T>
              <T x={48} y={y + 13} size={11} mono opacity={shown ? 1 : 0.35}>{r.text}</T>
              {shown && <T x={218} y={y + 13} size={11} mono fill={r.match === 'no match' ? tok('danger') : tok('safe')}>{r.match}</T>}
              {shown && <T x={318} y={y + 13} size={11} mono weight={700} fill={r.to === 'nothing' || r.to === '–' ? tok('muted') : tok('ink')}>{r.to}</T>}
            </Box>
          );
        })}
        {st.final > 0 && (
          <g>
            <T x={8} y={160} size={10} weight={700} fill={tok('muted')}>BINDING</T>
            <T x={110} y={160} size={10} weight={700} fill={tok('muted')}>ANNOTATION</T>
            <T x={240} y={160} size={10} weight={700} fill={tok('muted')}>{st.final === 1 ? 'PLAN (AUTO)' : 'PLAN (OPT-IN)'}</T>
            {FINAL.map((f, k) => {
              const y = 172 + k * 19;
              const lay = st.final === 1 ? f.auto : f.opt;
              return (
                <g key={f.n}>
                  <T x={8} y={y + 8} size={12} mono weight={700}>{f.n}</T>
                  <T x={110} y={y + 8} size={12} mono fill={f.ann === '–' ? tok('muted') : tok('brand')}>{f.ann}</T>
                  <T x={240} y={y + 8} size={12} mono fill={lay === 'soa' ? tok('safe') : tok('ink')}>{lay}</T>
                </g>
              );
            })}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
