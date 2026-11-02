// Chapter 160: what `new P(3)` does on the value stack. The class sits in
// the callee's slot; `new` replaces it with a fresh instance, which becomes
// slot 0 (self) of init's frame, and init's implicit return pushes slot 0.
// Follows newInstance in companion/ts/src/vm/vm.ts and emitReturn in
// compiler.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class P {
  init(x) { self.x = x; }
}
let p = new P(3);
print p;`;

type S = { line: number; op: string; stack: string[]; base?: number; hot?: number; inst: string; note: string };

const STATES: S[] = [
  { line: 3, op: 'load.global P', stack: ['<script>', 'class P'], hot: 1, inst: '', note: 'new P(3) first pushes the class, exactly where a function would sit for an ordinary call.' },
  { line: 3, op: 'const 3', stack: ['<script>', 'class P', '3'], hot: 2, inst: '', note: 'Then the argument, above it. Nothing has been allocated yet.' },
  { line: 3, op: 'new 1', stack: ['<script>', 'P {}', '3'], hot: 1, inst: 'P {}', note: 'new 1 looks one slot below the argument and finds a class. It allocates an empty instance and writes it over the class, in the callee’s slot.' },
  { line: 1, op: 'call init', stack: ['<script>', 'P {}', '3'], base: 1, inst: 'P {}', note: 'P has an init, so the VM calls it with the same argument count. The new frame starts at the instance’s slot: slot 0 is self, slot 1 is x. Everything was already in place.' },
  { line: 1, op: 'set.prop x', stack: ['<script>', 'P { x: 3 }', '3'], base: 1, hot: 1, inst: 'P { x: 3 }', note: 'load.local 0, load.local 1, set.prop x: self.x = x. The field table gains x, and fieldOrder records it.' },
  { line: 1, op: 'load.local 0; return', stack: ['<script>', 'P { x: 3 }'], hot: 1, inst: 'P { x: 3 }', note: 'init has no return statement, so the compiler ended it with load.local 0 and return: an initialiser always returns slot 0, the instance. The frame is gone and the instance is the result of new.' },
  { line: 3, op: 'define.global p', stack: ['<script>'], inst: 'P { x: 3 }', note: 'The script stores it in the global p; print p shows P { x: 3 }.' },
];

const CW = 92;
const X0 = 8;

export default function NewSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="new: an instance in the callee’s slot" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={128} title="The value stack as a row of slots, and the frame of init when it is running">
        <T x={X0} y={14} size={11} weight={700} fill={tok('muted')}>VALUE STACK</T>
        <T x={392} y={14} size={12} mono anchor="end" fill={tok('brand')}>{st.op}</T>
        {[0, 1, 2, 3].map((i) => {
          const v = st.stack[i];
          const live = v !== undefined;
          return (
            <g key={i}>
              <Box x={X0 + i * (CW + 4)} y={26} w={CW} h={32} r={3}
                fill={i === st.hot ? tok('brand', 0.14) : live ? tok('panel') : tok('line', 0.15)}
                stroke={i === st.hot ? tok('brand') : tok('line')} dash={!live}>
                <T x={X0 + i * (CW + 4) + CW / 2} y={42} size={11} mono anchor="middle" opacity={live ? 1 : 0.5}>{live ? v : ''}</T>
              </Box>
              <T x={X0 + i * (CW + 4) + CW / 2} y={68} size={10} mono anchor="middle" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        {st.base !== undefined && (
          <>
            <Box x={X0 + st.base * (CW + 4)} y={80} w={2 * CW + 4} h={24} r={3} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={X0 + st.base * (CW + 4) + 8} y={92} size={11} mono>init’s frame: self, x</T>
            </Box>
          </>
        )}
        {st.inst && <T x={X0} y={120} size={11} fill={tok('muted')}>heap: the instance {st.inst}</T>}
      </Svg>
    </StepFrame>
  );
}
