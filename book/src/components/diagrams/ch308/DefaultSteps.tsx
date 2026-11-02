import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A default method is written once, in the trait, and runs for every
// type that implements the trait. Inside it, self.exts() calls the
// implementing type's own exts. Here Py.handles("b.py") and then
// Js.handles("b.py").

const CODE = `fn handles(&self, f: &str) -> bool {
    for e in self.exts() {
        if f.ends_with(e) {
            return true;
        }
    }
    false
}`;

type S = { line: number; who: 'Py' | 'Js'; hot?: 'handles' | 'exts'; e?: string; out?: string; note: string };

const EXTS = { Py: ['.py'], Js: ['.js', '.mjs'] };

const STATES: S[] = [
  { line: 0, who: 'Py', hot: 'handles', note: 'Py.handles("b.py"). Py\'s impl block never wrote handles, so the default body from the trait runs, with self being the Py value.' },
  { line: 1, who: 'Py', hot: 'exts', note: 'self.exts() calls the exts that Py wrote in its impl, because self is a Py here. It returns [".py"].' },
  { line: 3, who: 'Py', e: '.py', out: 'true', note: '"b.py" ends with ".py", so handles returns true. One body in the trait, specialised by each type\'s exts.' },
  { line: 1, who: 'Js', hot: 'exts', note: 'Js.handles("b.py") runs the same default body, but now self is a Js, so self.exts() is Js\'s: [".js", ".mjs"].' },
  { line: 6, who: 'Js', out: 'false', note: 'Neither extension matches, the loop ends, and the last expression, false, is the answer. A type may still override handles with its own body.' },
];

function Impl({ x, name, active, hot }: { x: number; name: 'Py' | 'Js'; active: boolean; hot?: string }) {
  return (
    <Box x={x} y={66} w={180} h={74} r={6} fill={active ? tok('brand', 0.08) : 'transparent'} stroke={active ? tok('brand') : tok('line')}>
      <T x={x + 10} y={82} size={12} mono weight={700}>impl Plugin for {name}</T>
      <Box x={x + 10} y={94} w={70} h={34} r={3} fill={tok('panel')} stroke={tok('ink', 0.4)}>
        <T x={x + 45} y={111} size={11} mono anchor="middle">id</T>
      </Box>
      <Box x={x + 90} y={94} w={80} h={34} r={3} fill={active && hot === 'exts' ? tok('warn', 0.25) : tok('panel')} stroke={active && hot === 'exts' ? tok('warn') : tok('ink', 0.4)}>
        <T x={x + 130} y={111} size={11} mono anchor="middle">exts</T>
      </Box>
    </Box>
  );
}

export default function DefaultSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One default body, each type's own exts" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The trait's default method handles, and the impl blocks of Py and Js with their own exts">
        <Box x={10} y={8} w={380} h={44} r={6} fill={tok('accent', 0.08)} stroke={tok('accent')}>
          <T x={20} y={22} size={12} mono weight={700}>trait Plugin</T>
          <T x={20} y={40} size={11} mono fill={tok('muted')}>id, exts: required</T>
          <Box x={240} y={14} w={140} h={32} r={3} fill={st.hot === 'handles' ? tok('warn', 0.25) : tok('panel')} stroke={st.hot === 'handles' ? tok('warn') : tok('ink', 0.4)}>
            <T x={310} y={30} size={11} mono anchor="middle">handles (default)</T>
          </Box>
        </Box>
        <Impl x={10} name="Py" active={st.who === 'Py'} hot={st.hot} />
        <Impl x={210} name="Js" active={st.who === 'Js'} hot={st.hot} />
        <T x={10} y={162} size={12} mono>self.exts() = [{EXTS[st.who].map((e) => `"${e}"`).join(', ')}]</T>
        {st.out && <T x={10} y={182} size={13} mono weight={700} fill={tok(st.out === 'true' ? 'safe' : 'muted')}>{st.who}.handles("b.py") = {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
