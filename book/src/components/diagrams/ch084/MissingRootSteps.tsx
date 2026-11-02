// Chapter 84: what goes wrong when a freshly allocated object is held only
// in a TypeScript variable, and stress mode collects on the next allocation.
// The "broken" code is a variant of defineNative written for this chapter;
// the companion's real defineNative pushes both values on the value stack
// first. Run with stressGC in a copy of the VM, the broken version throws
// "use after free: a string object was collected while still in use".
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `// broken: name held only in a variable
const key = heap.copyString(name);
const native =
  heap.newNative(name, arity, fn);
globals.set(key, native);`;

type Obj = { label: string; state: 'live' | 'marked' | 'freed' | 'none' };
type S = { line: number | null; str: Obj; nat: Obj; table: string; globals: string; phase: string; note: string };

const STATES: S[] = [
  { line: 1, str: { label: 'string "len"', state: 'live' }, nat: { label: '', state: 'none' }, table: '"len"', globals: '(empty)', phase: '', note: 'copyString allocates the string "len" and interns it. The only thing that refers to it is the TypeScript variable key, which the collector cannot see.' },
  { line: 3, str: { label: 'string "len"', state: 'live' }, nat: { label: 'native len', state: 'none' }, table: '"len"', globals: '(empty)', phase: 'collect()', note: 'newNative allocates too, and in stress mode allocate() runs a full collection first, before the native even exists.' },
  { line: 3, str: { label: 'string "len"', state: 'live' }, nat: { label: 'native len', state: 'none' }, table: '"len"', globals: '(empty)', phase: 'mark roots', note: 'Marking starts from the roots: the stack, the frames, the open upvalues, the globals. None of them leads to "len", so it stays white.' },
  { line: 3, str: { label: 'string "len"', state: 'freed' }, nat: { label: 'native len', state: 'live' }, table: '(dropped)', globals: '(empty)', phase: 'sweep', note: 'The weak string table drops the white string, and sweep unlinks it and poisons it (stress mode turns poisoning on). Then the native is allocated.' },
  { line: 4, str: { label: 'string "len"', state: 'freed' }, nat: { label: 'native len', state: 'live' }, table: '(dropped)', globals: 'dead key → native', phase: '', note: 'globals.set stores the native under a key that is already dead. Nothing has failed yet: the bug is hiding.' },
  { line: null, str: { label: 'string "len"', state: 'freed' }, nat: { label: 'native len', state: 'live' }, table: '(dropped)', globals: 'dead key → native', phase: 'next collect()', note: 'At the next collection, marking the globals reaches the dead key and reads its type, which throws: "use after free: a string object was collected while still in use".' },
  { line: null, str: { label: 'string "len"', state: 'marked' }, nat: { label: 'native len', state: 'marked' }, table: '"len"', globals: '"len" → native', phase: 'the fix', note: 'The real defineNative pushes each value on the value stack as soon as it exists, and pops them only once both are in the globals table. The stack is a root, so the string survives.' },
];

export default function MissingRootSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const box = (o: Obj, x: number) => {
    if (o.state === 'none') return null;
    const freed = o.state === 'freed';
    const c = freed ? tok('danger') : o.state === 'marked' ? tok('safe') : tok('ink', 0.6);
    return (
      <Box x={x} y={36} w={150} h={32} fill={freed ? tok('danger', 0.1) : tok('panel')} stroke={c} dash={freed}>
        <T x={x + 75} y={52} size={12} mono anchor="middle">{freed ? `${o.label} (freed)` : o.label}</T>
      </Box>
    );
  };
  return (
    <StepFrame title="A root that was never there" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Two heap objects, the string table and the globals table, as stress mode collects in the middle of defining a native">
        <T x={8} y={16} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        {st.phase && <T x={392} y={16} size={12} mono anchor="end" fill={tok('brand')}>{st.phase}</T>}
        {box(st.str, 8)}
        {box(st.nat, 220)}
        <T x={8} y={98} size={12} mono>string table: {st.table}</T>
        <T x={8} y={124} size={12} mono>globals: {st.globals}</T>
      </Svg>
    </StepFrame>
  );
}
