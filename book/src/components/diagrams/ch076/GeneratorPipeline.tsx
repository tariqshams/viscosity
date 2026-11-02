// What a scanner generator does with a list of token rules.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const STAGES: [string, string, string][] = [
  ['token rules', 'one pattern per token,', 'in priority order'],
  ['one NFA', 'Thompson per rule, joined', 'by ε from a new start'],
  ['DFA', 'subset construction; each state', 'labelled by its earliest rule'],
  ['minimal DFA', 'merge states with the same', 'future and the same token'],
  ['scanner code', 'a table plus a loop, or', 'one block of jumps per state'],
];

export default function GeneratorPipeline() {
  return (
    <Svg w={400} h={330} title="The stages inside a scanner generator: rules, NFA, DFA, minimal DFA, code">
      {STAGES.map(([name, a, b], k) => {
        const y = 6 + k * 66;
        return (
          <g key={name}>
            <Box x={20} y={y} w={360} h={46} fill={k === 0 || k === 4 ? tok('brand', 0.1) : tok('panel')} stroke={k === 0 || k === 4 ? tok('brand') : tok('ink', 0.4)}>
              <T x={34} y={y + 23} size={13} weight={700}>{name}</T>
              <T x={150} y={y + 15} size={11} fill={tok('muted')}>{a}</T>
              <T x={150} y={y + 31} size={11} fill={tok('muted')}>{b}</T>
            </Box>
            {k < 4 && <Arrow x1={60} y1={y + 47} x2={60} y2={y + 65} />}
          </g>
        );
      })}
    </Svg>
  );
}
