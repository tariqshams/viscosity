// The language of (a|b)*c, worked out from the leaves of its tree up to
// the root: each node's set of strings is built from its children's.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type N = { id: string; x: number; y: number; label: string; kids: string[] };
const NODES: N[] = [
  { id: 'cat', x: 200, y: 26, label: 'then', kids: ['star', 'c'] },
  { id: 'star', x: 120, y: 78, label: '*', kids: ['alt'] },
  { id: 'c', x: 280, y: 78, label: 'c', kids: [] },
  { id: 'alt', x: 120, y: 130, label: '|', kids: ['a', 'b'] },
  { id: 'a', x: 70, y: 182, label: 'a', kids: [] },
  { id: 'b', x: 170, y: 182, label: 'b', kids: [] },
];

type S = { at: string | null; done: string[]; set: string; check?: { w: string; ok: boolean }; note: string };
const STATES: S[] = [
  { at: null, done: [], set: '', note: 'The pattern (a|b)*c as a tree. Leaves are single characters; every other node is an operator joining its children. We will work out which strings each node stands for, from the bottom up.' },
  { at: 'a', done: ['a'], set: 'L(a) = { "a" }', note: 'A leaf that is one character stands for exactly one string: that character on its own.' },
  { at: 'b', done: ['a', 'b'], set: 'L(b) = { "b" }', note: 'The same for b.' },
  { at: 'alt', done: ['a', 'b', 'alt'], set: 'L(a|b) = { "a", "b" }', note: 'Alternation is a choice: its strings are the strings of the left child together with the strings of the right child.' },
  { at: 'star', done: ['a', 'b', 'alt', 'star'], set: 'L((a|b)*) = { "", "a", "b", "aa", "ab", "ba", "bb", "aaa", … }', note: 'Star means "pick from the child zero or more times and glue the picks together". Zero picks gives the empty string "". The set never ends.' },
  { at: 'c', done: ['a', 'b', 'alt', 'star', 'c'], set: 'L(c) = { "c" }', note: 'The right-hand leaf.' },
  { at: 'cat', done: ['a', 'b', 'alt', 'star', 'c', 'cat'], set: 'L((a|b)*c) = { "c", "ac", "bc", "aac", "abc", … }', note: 'Concatenation glues one string from the left child to one from the right: any run of a and b, then a c.' },
  { at: 'cat', done: ['a', 'b', 'alt', 'star', 'c', 'cat'], set: 'L((a|b)*c) = { "c", "ac", "bc", "aac", "abc", … }', check: { w: 'abc', ok: true }, note: 'Is "abc" in the language? Split it as "ab" + "c": "ab" is two picks from a|b, and "c" is the leaf. Yes.' },
  { at: 'cat', done: ['a', 'b', 'alt', 'star', 'c', 'cat'], set: 'L((a|b)*c) = { "c", "ac", "bc", "aac", "abc", … }', check: { w: 'abca', ok: false }, note: 'And "abca"? Every string here ends in c, and this one ends in a, so no split works. It is not in the language.' },
];

export default function LanguageSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const at = (id: string) => NODES.find((n) => n.id === id)!;
  return (
    <StepFrame title="Which strings does (a|b)*c stand for?" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The tree of (a|b)*c with the set of strings worked out at each node">
        {NODES.flatMap((n) => n.kids.map((k) => (
          <line key={n.id + k} x1={n.x} y1={n.y + 14} x2={at(k).x} y2={at(k).y - 14} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
        )))}
        {NODES.map((n) => {
          const lit = st.at === n.id;
          const done = st.done.includes(n.id);
          return (
            <Box key={n.id} x={n.x - 26} y={n.y - 14} w={52} h={28} r={14}
              fill={lit ? tok('brand', 0.2) : done ? tok('safe', 0.1) : tok('panel')}
              stroke={lit ? tok('brand') : done ? tok('safe') : tok('ink', 0.4)}>
              <T x={n.x} y={n.y + 1} size={14} mono anchor="middle" weight={lit ? 700 : 400}>{n.label}</T>
            </Box>
          );
        })}
        <Box x={4} y={206} w={392} h={50} fill={tok('brand', 0.05)} stroke={tok('line')}>
          <T x={12} y={222} size={11} mono>{st.set.length > 58 ? st.set.slice(0, st.set.indexOf('=') + 1) : st.set}</T>
          {st.set.length > 58 && <T x={12} y={240} size={11} mono>{st.set.slice(st.set.indexOf('=') + 2)}</T>}
          {st.check && <T x={388} y={240} size={12} mono anchor="end" weight={700} fill={st.check.ok ? tok('safe') : tok('danger')}>{st.check.w}: {st.check.ok ? 'yes' : 'no'}</T>}
        </Box>
      </Svg>
    </StepFrame>
  );
}
