import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 159: explain_text in engine/rust/crates/core/src/plan.rs building
// the report for this chapter's fr.js, line by line. The code is the real
// function, rewrapped, with the verdict match shortened. The output lines
// are exactly what `viscosity explain fr.js` printed (rustc 1.97 release
// build), reasons cut short with …; the TypeScript CLI printed the same.
const CODE = `for cp in &p.collections {
    let c = &cp.collection;
    let verdict = match cp.layout { … };
    lines.push(format!(
        "{} (line {}) {{{}}} → {verdict}",
        c.name, c.line, c.fields.join(", ")));
    let refused = !c.bailouts.is_empty()
        && cp.reasons.len() == c.bailouts.len();
    for (k, r) in cp.reasons.iter().enumerate() {
        lines.push(format!("  · {r}"));
        // with --frames: a code frame here
    }
}
lines.join("\\n")`;

type S = { line: number | null; out: string[]; refused?: string; note: string };

const H1 = 'ps (line 1) {x} → kept as array of objects';
const R1 = '  · unsafe: line 7: an element is used by …';
const R2 = '  · unsafe: line 9: an element is passed …';
const H2 = 'keep (line 4) {} → kept as array of objects';
const R3 = '  · unsafe: line 7: pushes something that …';

const STATES: S[] = [
  { line: null, out: [], note: 'The plan holds one CollectionPlan per collection, in the order the analysis found them: ps, then keep. explain_text turns each into a header line and one line per reason.' },
  { line: 2, out: [], note: 'The verdict comes from the layout: Aos is “kept as array of objects”, Soa “struct of arrays”, Aosoa “AoSoA, blocks of N”.' },
  { line: 3, out: [H1], note: 'The header. In a format string {{ and }} print a literal { and }, so "{{{}}}" is a brace, the field list, and a brace: {x}.' },
  { line: 6, out: [H1], refused: 'refused = true', note: 'ps has two bailouts and two reasons, so every reason is a bailout and reason k is bailout k. Only then can --frames find a source position for each.' },
  { line: 9, out: [H1, R1], refused: 'refused = true', note: 'enumerate gives each reason with its number k. Reason 0 is printed after two spaces and a middle dot.' },
  { line: 9, out: [H1, R1, R2], refused: 'refused = true', note: 'Reason 1. Without --frames, nothing else happens for it.' },
  { line: 4, out: [H1, R1, R2, H2], note: 'The next collection, keep. Its records have no fields the analysis could see, so the field list is empty: {}.' },
  { line: 13, out: [H1, R1, R2, H2, R3], note: 'One reason, and the lines are joined with line breaks. No trailing line break: the CLI adds one when it prints.' },
];

export default function ReportSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Writing the report" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={118} title="The report lines written so far">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>{`LINES${st.refused ? ` (${st.refused})` : ''}`}</T>
        <Box x={2} y={20} w={396} h={94} fill={tok('panel')}>
          {st.out.map((l, k) => (
            <T key={k} x={8} y={32 + k * 17} size={11} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
