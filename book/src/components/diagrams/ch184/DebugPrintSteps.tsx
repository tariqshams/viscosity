// Chapter 184: one real %DebugPrint output, read line by line. Produced by
//   node --allow-natives-syntax b.js
// with `%DebugPrint({ x: 1.5, y: 2 });` on Node v22.23.4
// (V8 12.4.254.21-node.57); addresses shortened to 0x…, long lines split,
// and less interesting lines left out.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

const OUT = `DebugPrint: 0x…: [JS_OBJECT_TYPE]
 - map: 0x… <Map[40](HOLEY_ELEMENTS)>
   [FastProperties]
 - elements: 0x… <FixedArray[0]>
 - All own properties …: {
   #x: 0x… <HeapNumber 1.5>
     (const data field 0), in-object
   #y: 2 (const data field 1),
     in-object
 }
0x…: [Map] in OldSpace
 - instance size: 40
 - inobject properties: 2`;

const STATES = [
  { line: 0, note: 'The first line says what kind of thing this is inside V8: a plain JavaScript object, JS_OBJECT_TYPE. The address changes on every run.' },
  { line: 1, note: 'map is V8’s word for the object’s shape (hidden class). The 40 in Map[40] is the instance size printed again at the bottom; HOLEY_ELEMENTS is the elements kind of its (empty) indexed part.' },
  { line: 2, note: '[FastProperties]: the named properties are laid out by the map, not kept in a dictionary. This is what %HasFastProperties reports as true.' },
  { line: 5, note: 'x holds 1.5, which is not a small integer, so the field holds a pointer to a separate HeapNumber, as How JavaScript stores numbers and objects described.' },
  { line: 6, note: 'const data field 0, in-object: x is field number 0, stored inside the object itself. The word const is V8’s own bookkeeping about the field; the --trace-generalisation example in this chapter shows a field losing it.' },
  { line: 7, note: 'y holds 2 directly: a Smi, kept in the field with no separate box. Two numbers in one object, two different representations.' },
  { line: 10, note: 'Then V8 prints the map itself. It lives in OldSpace, the old generation.' },
  { line: 11, note: 'instance size 40 and 2 in-object properties: room for exactly the two fields x and y inside the object, matching Map[40] above.' },
];

export default function DebugPrintSteps() {
  const s = useSteps(STATES);
  return (
    <StepFrame title="Reading a %DebugPrint" steps={s} note={s.state.note}>
      <CodeTrace code={OUT} line={s.state.line} />
    </StepFrame>
  );
}
