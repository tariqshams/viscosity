import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 263: the ESTree nodes acorn builds for `p.x += p.vx;`, each
// with the [start, end) range of the source it covers. Types, fields and
// offsets are acorn's real output (acorn.parse, ecmaVersion 'latest').
const SRC = 'p.x += p.vx;';

type S = { start: number; end: number; depth: number; type: string; extra: string; note: string };

const STATES: S[] = [
  { start: 0, end: 12, depth: 0, type: 'ExpressionStatement', extra: 'expression: …', note: 'The whole line is one ExpressionStatement, covering offsets 0 to 12: every character, including the semicolon. Offsets count characters from the start of the file, and end is one past the last character.' },
  { start: 0, end: 11, depth: 1, type: 'AssignmentExpression', extra: 'operator: "+="', note: 'Inside it, the AssignmentExpression covers 0 to 11: everything but the semicolon. Its operator is a plain string field, "+=".' },
  { start: 0, end: 3, depth: 2, type: 'MemberExpression', extra: 'computed: false', note: 'Its left side, p.x, is a MemberExpression from 0 to 3. computed: false says the property was written after a dot, so x is a name, not a variable to look up.' },
  { start: 0, end: 1, depth: 3, type: 'Identifier', extra: 'name: "p"', note: 'The object is the Identifier p, offsets 0 to 1. Every node, however small, knows exactly which characters it came from.' },
  { start: 2, end: 3, depth: 3, type: 'Identifier', extra: 'name: "x"', note: 'The property is also an Identifier, x, at 2 to 3. Only the computed flag on its parent says that this name is a field, not a variable.' },
  { start: 7, end: 11, depth: 2, type: 'MemberExpression', extra: 'computed: false', note: 'The right side, p.vx, is another MemberExpression, 7 to 11. A compiler that wants to rewrite p.vx can replace exactly source.slice(7, 11) and leave every other character alone.' },
  { start: 9, end: 11, depth: 3, type: 'Identifier', extra: 'name: "vx"', note: 'Its property vx covers 9 to 11. Children always sit inside their parent’s range, which is what lets a tree of ranges be turned back into edits of the text.' },
];

export default function OffsetsSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const W = 30;
  return (
    <StepFrame title="Every node knows its characters" steps={s} note={st.note}>
      <Svg w={400} h={170} title="The source p.x += p.vx; with the range of the current ESTree node highlighted">
        {[...SRC].map((c, k) => {
          const on = k >= st.start && k < st.end;
          return (
            <g key={k}>
              <Box x={20 + k * W} y={10} w={W - 2} h={36} fill={on ? tok('brand', 0.2) : 'transparent'} stroke={on ? tok('brand') : tok('line')}>
                <T x={20 + k * W + (W - 2) / 2} y={28} size={16} mono anchor="middle">{c === ' ' ? '␣' : c}</T>
              </Box>
              <T x={20 + k * W + (W - 2) / 2} y={58} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <Box x={20} y={76} w={360} h={84} fill={tok('panel')} stroke={tok('line')}>
          <T x={34} y={96} size={11} fill={tok('muted')}>{'depth ' + st.depth}</T>
          <T x={34} y={118} size={14} mono weight={700} fill={tok('brand')}>{st.type}</T>
          <T x={34} y={140} size={12} mono>{`start: ${st.start}, end: ${st.end}, ${st.extra}`}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
