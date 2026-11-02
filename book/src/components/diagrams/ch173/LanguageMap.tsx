// The Chomsky hierarchy with the deterministic context-free languages
// drawn in, and a language that sits in each band but not the one inside it.
import { Box, Svg, T, tok } from '../../viz/svg';

const BANDS = [
  { t: 'Type 0 · recursively enumerable', m: 'Turing machine', ex: 'programs that halt' },
  { t: 'Type 1 · context-sensitive', m: 'linear-bounded automaton', ex: 'aⁿbⁿcⁿ,  w w' },
  { t: 'Type 2 · context-free', m: 'pushdown automaton', ex: 'palindromes w wᴿ' },
  { t: 'deterministic context-free', m: 'deterministic PDA = LR(1)', ex: 'aⁿbⁿ,  ( ( ) )' },
  { t: 'Type 3 · regular', m: 'finite automaton', ex: 'a*b*,  numbers' },
];

/** Five nested bands; each example belongs to its band and not to the one inside. */
export default function LanguageMap() {
  return (
    <Svg w={400} h={300} title="Five nested boxes. Outermost, type 0, recursively enumerable, recognised by Turing machines, example: programs that halt. Inside it type 1, context-sensitive, linear-bounded automata, examples a to the n b to the n c to the n, and a word written twice. Inside that type 2, context-free, pushdown automata, example palindromes. Inside that the deterministic context-free languages, deterministic pushdown automata, which are the LR(1) languages, examples a to the n b to the n and nested brackets. Innermost type 3, regular, finite automata, examples a star b star and numbers.">
      {BANDS.map((b, i) => {
        const pad = i * 16;
        const top = 4 + i * 54;
        const det = i === 3;
        return (
          <Box key={b.t} x={4 + pad} y={top} w={392 - 2 * pad} h={292 - top - i * 6} r={10} fill={det ? tok('accent', 0.1) : tok('brand', 0.05 + i * 0.05)} stroke={det ? tok('accent', 0.8) : tok('brand', 0.35 + i * 0.12)} dash={det}>
            <T x={14 + pad} y={top + 15} size={12} weight={700}>{b.t}</T>
            <T x={14 + pad} y={top + 31} size={11} fill={tok('muted')}>{b.m}</T>
            <T x={386 - pad} y={top + 15} size={11} mono anchor="end" fill={tok('muted')}>{b.ex}</T>
          </Box>
        );
      })}
    </Svg>
  );
}
