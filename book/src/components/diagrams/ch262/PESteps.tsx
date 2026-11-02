// Chapter 262: partial evaluation folds an AST interpreter into the program.
// The steps follow the example in Truffle's own documentation
// (truffle/docs/PartialEvaluation.md: AddNode over two LoadArgumentNodes
// becomes args[1] + args[2]), rewritten in JavaScript. The last step follows
// the same document's @CompilationFinal "intsSeen" example.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

type S = { label: string; code: string; line: number | null; note: string };

const STATES: S[] = [
  {
    label: 'the interpreter',
    code: `function interpret(prog, args) {
  return prog.execute(args);
}
class Add {
  execute(args) {
    return this.l.execute(args) +
      this.r.execute(args);
  }
}
class Arg {
  execute(args) {
    return args[this.i];
  }
}`,
    line: 1,
    note: 'A tiny tree-walking interpreter, like your Drip tree-walker but with one class per node kind. prog.execute could be any node’s method, so every call is a dynamic dispatch.',
  },
  {
    label: 'fix the program',
    code: `// prog = new Add(new Arg(1),
//                new Arg(2))  (constant)
function run(args) {
  return prog.execute(args);
}`,
    line: 3,
    note: 'Now fix one input: the program’s tree. It won’t change while this code runs, so the specialiser treats prog as a constant. Only args is still unknown.',
  },
  {
    label: 'inline Add',
    code: `// prog = new Add(new Arg(1),
//                new Arg(2))  (constant)
function run(args) {
  return prog.l.execute(args) +
    prog.r.execute(args);
}`,
    line: 3,
    note: 'prog is known to be an Add, so prog.execute can only be Add’s method. Inline its body.',
  },
  {
    label: 'inline Arg twice',
    code: `// prog = new Add(new Arg(1),
//                new Arg(2))  (constant)
function run(args) {
  return args[prog.l.i] +
    args[prog.r.i];
}`,
    line: 3,
    note: 'The children never change either, so prog.l and prog.r are constants too, both Args. Inline Arg’s method into both places.',
  },
  {
    label: 'fold the constants',
    code: `function run(args) {
  return args[1] + args[2];
}`,
    line: 1,
    note: 'Finally prog.l.i is just 1 and prog.r.i is 2. No execute, no node objects, no dispatch: what is left (the residual program) is what a compiler would have produced.',
  },
  {
    label: 'add a speculation',
    code: `// the node has only seen ints so far
function run(args) {
  const a = args[1], b = args[2];
  if (!isInt(a) || !isInt(b)) {
    deoptimize(); // back to the tree
  }
  return a + b; // as ints
}`,
    line: 3,
    note: 'If the node has recorded that it has only seen integers, the compiler keeps just that path, guarded. A string later fails the guard: the compiled code is thrown away and the interpreter takes over again.',
  },
];

export default function PESteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Folding an interpreter into one program" steps={s} note={st.note}>
      <div className="mb-2 font-sans text-xs font-bold uppercase tracking-wider text-muted">{st.label}</div>
      <CodeTrace code={st.code} line={st.line} />
    </StepFrame>
  );
}
