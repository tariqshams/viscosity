import { Box, Svg, T, tok } from '../../viz/svg';

const LEVELS = [
  { t: 'Type 0 · unrestricted', m: 'Turing machine', ex: 'anything a program can list' },
  { t: 'Type 1 · context-sensitive', m: 'linear-bounded automaton', ex: 'aⁿ bⁿ cⁿ' },
  { t: 'Type 2 · context-free', m: 'pushdown automaton (a stack)', ex: 'balanced ( ), aⁿ bⁿ' },
  { t: 'Type 3 · regular', m: 'finite automaton', ex: 'numbers, names' },
];

/** The Chomsky hierarchy as nested boxes: each type contains the next. */
export default function ChomskyNest() {
  return (
    <Svg w={400} h={262} title="Four nested boxes. The outermost is type 0, unrestricted grammars, recognised by Turing machines. Inside it type 1, context-sensitive, then type 2, context-free, recognised by pushdown automata, and innermost type 3, regular, recognised by finite automata.">
      {LEVELS.map((l, i) => {
        const pad = i * 18;
        const top = 4 + i * 58;
        const shade = 0.05 + i * 0.06;
        return (
          <Box key={l.t} x={4 + pad} y={top} w={392 - 2 * pad} h={254 - top - i * 8} r={10} fill={tok('brand', shade)} stroke={tok('brand', 0.35 + i * 0.15)}>
            <T x={14 + pad} y={top + 15} size={12} weight={700}>{l.t}</T>
            <T x={14 + pad} y={top + 31} size={11} fill={tok('muted')}>{'machine: ' + l.m}</T>
            <T x={386 - pad} y={top + 15} size={11} mono anchor="end" fill={tok('muted')}>{l.ex}</T>
          </Box>
        );
      })}
    </Svg>
  );
}
