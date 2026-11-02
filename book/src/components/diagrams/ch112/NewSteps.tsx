// Chapter 112: what `new Point(1, 2)` does in the tree-walker. Look the
// class up, evaluate the arguments, make an empty instance, run init with
// self bound to it (init's fields appear one by one), and give back the
// instance itself.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class Point {
  init(x, y) {
    self.x = x;
    self.y = y;
  }
}
let p = new Point(1, 2);
print p;`;

type S = {
  line: number;
  cls: boolean;
  checks: string[];
  inst?: string[];
  call?: string;
  p?: boolean;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 0, cls: true, checks: [], note: 'The class statement makes a DripClass: the name Point and a map of methods, here only init. Nothing else happens until new.' },
  { line: 6, cls: true, checks: ['class: Point', 'args: [1, 2]'], note: 'new Point(1, 2) looks Point up like any variable, then evaluates the arguments, left to right.' },
  { line: 6, cls: true, checks: ['class: Point', 'args: [1, 2]', 'a DripClass? yes'], inst: [], note: 'Point holds a class, so a DripInstance is made: a pointer to its class and an empty map of fields.' },
  { line: 1, cls: true, checks: ['class: Point', 'args: [1, 2]', 'a DripClass? yes', 'init found: call it'], inst: [], call: 'x = 1, y = 2', note: 'findMethod finds init. It is bound to the new instance (so self means this instance) and called like any function: arity 2, got 2, and a new environment with x and y.' },
  { line: 2, cls: true, checks: [], inst: ['x: 1'], call: 'x = 1, y = 2', note: 'self.x = x is a set expression: self is the instance, and assigning a field that does not exist yet creates it.' },
  { line: 3, cls: true, checks: [], inst: ['x: 1', 'y: 2'], call: 'x = 1, y = 2', note: 'self.y = y creates the second field. The map keeps the order the fields were first set in.' },
  { line: 6, cls: true, checks: [], inst: ['x: 1', 'y: 2'], p: true, note: 'init’s body ends. Whatever init returned, new gives back the instance, and let p stores it.' },
  { line: 7, cls: true, checks: [], inst: ['x: 1', 'y: 2'], p: true, out: 'Point { x: 1, y: 2 }', note: 'print shows an instance as its class name and its fields, in the order they were first set.' },
];

export default function NewSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What new Point(1, 2) does" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={214} title="The class Point with its methods, the checks new makes, the new instance and its fields, and the environment of the init call">
        <Box x={6} y={8} w={180} h={44} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={16} y={22} size={11} weight={700} fill={tok('brand')}>class Point</T>
          <T x={16} y={40} size={12.5} mono>methods: init</T>
        </Box>
        {st.checks.length > 0 && (
          <Box x={204} y={8} w={190} h={84} fill="transparent" stroke={tok('line')}>
            {st.checks.map((c, j) => (
              <T key={c} x={214} y={24 + j * 19} size={11.5} mono>{c}</T>
            ))}
          </Box>
        )}
        {st.inst && (
          <>
            <Box x={6} y={86} w={180} h={62} fill={tok('panel')} stroke={tok('ink', 0.5)}>
              <T x={16} y={100} size={11} weight={700} fill={tok('muted')}>Point instance</T>
              {st.inst.length === 0 && <T x={16} y={122} size={12} fill={tok('muted')}>fields: (none)</T>}
              {st.inst.map((f, j) => (
                <T key={f} x={16 + j * 70} y={122} size={12.5} mono>{f}</T>
              ))}
            </Box>
            <Arrow x1={150} y1={86} x2={150} y2={54} />
            <T x={156} y={72} size={11} fill={tok('muted')}>class</T>
          </>
        )}
        {st.call && (
          <Box x={204} y={110} w={190} h={40} fill={tok('accent', 0.1)} stroke={tok('accent')}>
            <T x={214} y={123} size={11} weight={700} fill={tok('accent')}>init call env</T>
            <T x={214} y={140} size={12} mono>{st.call}</T>
          </Box>
        )}
        {st.p && <T x={6} y={172} size={12.5} mono>p = the Point instance</T>}
        {st.out && <T x={6} y={198} size={12.5} mono fill={tok('muted')}>printed: <tspan fill={tok('ink')} fontWeight={700}>{st.out}</tspan></T>}
      </Svg>
    </StepFrame>
  );
}
