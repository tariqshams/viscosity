import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `type Port = number &
  { readonly __brand: 'Port' };

function toPort(n: number): Port {
  if (n < 1 || n > 65535) {
    throw new Error('bad port');
  }
  return n as Port;
}

const raw = Number('8080');
const p = toPort(raw);
listen(p);
listen(raw);`;

type S = { line: number | null; rows: [string, string][]; verdict?: [string, boolean]; note: string };

const STATES: S[] = [
  { line: 0, rows: [], note: 'The brand: a Port is a number that also claims a property __brand. No real number has one, so no plain number fits the type by accident.' },
  { line: 10, rows: [['raw', 'number']], note: 'Text from outside (a settings file, say) becomes a number. The checker only knows it is a number: it could be 0, or 99999.' },
  { line: 4, rows: [['raw', 'number'], ['n', 'number']], note: 'Inside toPort, n is still a plain number. This is the one place that knows the rule for ports, so this is where we check it.' },
  { line: 7, rows: [['raw', 'number'], ['n', 'number → Port']], note: 'Only after the check passes does as Port stamp the brand. as checks nothing by itself; it is safe here because the line above did the checking.' },
  { line: 11, rows: [['raw', 'number'], ['p', 'Port']], note: 'p is a Port. Holding one is a receipt: whoever made it went through toPort, so the range check happened.' },
  { line: 12, rows: [['raw', 'number'], ['p', 'Port']], verdict: ['listen(p): accepted', true], note: 'listen asks for a Port, and p is one. listen itself never has to check the range again.' },
  { line: 13, rows: [['raw', 'number'], ['p', 'Port']], verdict: ["TS2345: 'number' is not assignable to 'Port'", false], note: 'An unchecked number is refused before the program runs. After erasure, though, both p and raw are the plain number 8080: the brand lives only in the checker.' },
];

export default function BrandSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A brand as a receipt for a check" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={92} title="The checker's table of names and types at this step">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>WHAT THE CHECKER KNOWS</T>
        {st.rows.map(([name, type], k) => (
          <g key={name}>
            <T x={10 + k * 150} y={32} size={13} mono weight={700}>{name}</T>
            <T x={46 + k * 150} y={32} size={13} mono fill={type.includes('Port') ? tok('brand') : undefined}>{type}</T>
          </g>
        ))}
        {st.rows.length === 0 && <T x={10} y={32} size={12} fill={tok('muted')}>(no variables yet)</T>}
        {st.verdict && (
          <Box x={2} y={52} w={396} h={32} fill={tok(st.verdict[1] ? 'safe' : 'danger', 0.1)} stroke={tok(st.verdict[1] ? 'safe' : 'danger')}>
            <T x={12} y={68} size={11} mono fill={tok(st.verdict[1] ? 'safe' : 'danger')}>{st.verdict[0]}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
