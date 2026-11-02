import clsx from 'clsx';
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

// Chapter 143: a JavaScript program and its real VIR (printFunc output of
// the JavaScript plugin, unchanged except for trailing spaces). Each step
// highlights one source line and the instructions it became.
const CODE = `const ps = [{ x: 1, vx: 2 }];
let t = 0;
for (let i = 0; i < ps.length; i++)
  t = t + ps[i].x * ps[i].vx;
console.log(t);`;

const VIR = `func <module>():
  b0:
    %0 = const 1
    %1 = const 2
    %2 = record {x, vx} %0, %1
    %3 = array.new %2
    store ps, %3
    %5 = const 0
    %6 = const 0
    br b1
  b1:  ; preds b0 b3
    %11 = phi %5, %19
    %7 = phi %6, %22
    %8 = load ps
    %9 = field.get %8 .length
    %10 = binop < %7, %9
    condbr %10, b2, b4
  b2:  ; preds b1
    %12 = load ps
    %13 = index.get %12, %7
    %14 = field.get %13 .x
    %15 = load ps
    %16 = index.get %15, %7
    %17 = field.get %16 .vx
    %18 = binop * %14, %17
    %19 = binop + %11, %18
    br b3
  b3:  ; preds b2
    %20 = unop + %7
    %21 = const 1
    %22 = binop + %20, %21
    br b1
  b4:  ; preds b1
    %23 = load console
    %24 = field.get %23 .log
    %25 = call %24, %23, %11
    return`.split('\n');

type S = { line: number | null; hot: number[]; note: string };
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

const STATES: S[] = [
  { line: null, hot: [], note: 'One function, <module>, made of basic blocks b0 to b4. Every instruction gets an id, %0, %1, … (a store has one too but doesn’t print it, which is why %4 is missing). Each block ends in exactly one terminator: br, condbr or return.' },
  { line: 0, hot: range(2, 6), note: 'The object literal is a record.new that lists its fields in order, {x, vx}. The array literal is array.new. Because ps holds an array, it is a binding: stored with store, read back with load.' },
  { line: 1, hot: [7], note: 'let t = 0 produces no store at all, only the value %5. t is a plain local that no closure captures, so in SSA it is just “whichever value it has right now”.' },
  { line: 2, hot: range(11, 16), note: 'The loop header b1 joins two paths: from b0 (first time) and from b3 (around the loop). So i and t each get a phi: t is %11, either %5 or %19. ps.length is field.get .length.' },
  { line: 3, hot: range(19, 23), note: 'The collection operations are first-class: index.get takes an element from an array, and field.get reads a named field from it. The analyses look for exactly these.' },
  { line: 3, hot: [11, 25], note: 'The assignment t = t + … is just %19, a new value. Nothing is overwritten. The phi at the top of the loop picks %19 the next time round. That is SSA: each value is defined once.' },
  { line: 2, hot: range(28, 30), note: 'i++ is lowered to unop + (convert to a number, as ++ does) and then binop +. The result, %22, flows back into i’s phi.' },
  { line: 4, hot: range(33, 35), note: 'console is an implicit global, so it is a binding too. A method call passes the receiver along with the arguments: call %24 (the function), %23 (console), %11 (t).' },
];

export default function VirSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Source to VIR, line by line" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <pre className="code-surface !mb-0 !mt-2 !border-line font-mono text-[0.8rem]" aria-label="The VIR listing">
        {VIR.map((l, k) => (
          <div key={k} className={clsx('-mx-[0.85rem] px-[0.85rem]', st.hot.includes(k) ? 'bg-brand/15 shadow-[inset_3px_0_0_rgb(var(--brand))]' : '')}>
            {l || ' '}
          </div>
        ))}
      </pre>
    </StepFrame>
  );
}
