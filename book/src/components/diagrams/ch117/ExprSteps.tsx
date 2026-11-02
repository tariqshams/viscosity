// Chapter 117: a function body as nested expressions. The reader steps
// through clamp(15, 0, 10): the conditions are tested, one branch block
// produces a value, and that value flows outward through the if and the
// function body to become the return value, with no `return` written.
// The last step shows what a stray semicolon does to a branch.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn clamp(x: i32, lo: i32, hi: i32) -> i32 {
    if x < lo {
        lo
    } else if x > hi {
        hi
    } else {
        x
    }
}

fn main() {
    let r = clamp(15, 0, 10);
    println!("{r}");
}`;

type Br = 'lo' | 'hi' | 'x';
type S = {
  line: number; active?: Br; tests?: string[]; branchVal?: string; ifVal?: string; bodyVal?: string; r?: string; semi?: boolean; note: string;
};

const STATES: S[] = [
  { line: 11, note: 'main calls clamp(15, 0, 10). Inside clamp, x = 15, lo = 0 and hi = 10. The whole body of clamp is one block, and the block holds one expression: the if.' },
  { line: 1, tests: ['x < lo: false'], note: 'The if tests x < lo. 15 < 0 is false, so the first branch is skipped.' },
  { line: 3, tests: ['x < lo: false', 'x > hi: true'], note: 'else if tests x > hi. 15 > 10 is true, so the middle branch runs.' },
  { line: 4, active: 'hi', tests: ['x < lo: false', 'x > hi: true'], branchVal: '10', note: 'The branch is a block, { hi }. Its last line has no semicolon, so it is the block’s value: 10.' },
  { line: 3, active: 'hi', tests: ['x < lo: false', 'x > hi: true'], branchVal: '10', ifVal: '10', note: 'An if is an expression: its value is the value of the branch that ran. The whole if … else if … else is now 10.' },
  { line: 0, active: 'hi', tests: ['x < lo: false', 'x > hi: true'], branchVal: '10', ifVal: '10', bodyVal: '10', note: 'The if is the last expression in clamp’s body, with no semicolon after it. So it is the body’s value, and the body’s value is what clamp returns. No return keyword needed.' },
  { line: 11, r: '10', note: 'Back in main, the call clamp(15, 0, 10) has the value 10, and let binds it to r. println! prints 10.' },
  { line: 4, active: 'hi', semi: true, tests: ['x < lo: false', 'x > hi: true'], branchVal: '()', note: 'What if the branch said hi; with a semicolon? The semicolon turns the expression into a statement, and a block ending in a statement has the value (), “nothing”. That is not an i32, so rustc rejects the program.' },
];

export default function ExprSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const br: { k: Br; x: number; label: string }[] = [
    { k: 'lo', x: 22, label: '{ lo }' },
    { k: 'hi', x: 146, label: st.semi ? '{ hi; }' : '{ hi }' },
    { k: 'x', x: 270, label: '{ x }' },
  ];
  const chip = (x: number, y: number, v: string, bad?: boolean) => (
    <g>
      <rect x={x - 20} y={y - 10} width={40} height={20} rx={10} fill={bad ? tok('danger', 0.18) : tok('brand', 0.22)} stroke={bad ? tok('danger') : tok('brand')} />
      <T x={x} y={y + 1} size={12} mono weight={700} anchor="middle" fill={bad ? tok('danger') : tok('ink')}>{v}</T>
    </g>
  );
  return (
    <StepFrame title="Values flow outward" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="clamp's body as nested expressions: branch blocks inside an if inside the function body">
        <Box x={4} y={4} w={392} h={150} r={8} fill={tok('panel')} stroke={st.bodyVal ? tok('brand') : tok('line')}>
          <T x={14} y={18} size={11} weight={700} fill={tok('muted')}>clamp’s body block</T>
        </Box>
        {st.bodyVal && chip(360, 18, st.bodyVal)}
        <Box x={12} y={30} w={376} h={116} r={8} fill={tok('accent', 0.06)} stroke={st.ifVal ? tok('brand') : tok('accent', 0.6)}>
          <T x={22} y={44} size={11} weight={700} fill={tok('accent')}>if … else if … else</T>
        </Box>
        {st.ifVal && chip(350, 44, st.ifVal)}
        {br.map((b) => {
          const on = st.active === b.k;
          return (
            <g key={b.k} opacity={st.active && !on ? 0.4 : 1}>
              <Box x={b.x} y={58} w={108} h={46} r={6} fill={on ? tok('brand', 0.12) : tok('panel')} stroke={on ? (st.semi ? tok('danger') : tok('brand')) : tok('line')}>
                <T x={b.x + 54} y={81} size={13} mono anchor="middle">{b.label}</T>
              </Box>
              {on && st.branchVal && chip(b.x + 54, 116, st.branchVal, st.semi)}
            </g>
          );
        })}
        {(st.tests ?? []).map((t, k) => (
          <T key={t} x={22 + k * 150} y={138} size={11} mono fill={t.endsWith('true') ? tok('safe') : tok('muted')}>{t}</T>
        ))}
        <T x={8} y={168} size={12} mono fill={tok('muted')}>{st.r ? `r = ${st.r}   prints: 10` : 'x = 15, lo = 0, hi = 10'}</T>
      </Svg>
    </StepFrame>
  );
}
