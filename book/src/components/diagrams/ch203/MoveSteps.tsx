// A value with one owner at a time: moving it from s to t leaves s
// unusable, which is the "at most once" rule of affine types.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = ['let s = String::from("hi");', 'let t = s;', 'println!("{}", s);'];
type S = { line: number; sLive: boolean; tLive: boolean; owner: 's' | 't' | ''; bad?: boolean; note: string };
const STATES: S[] = [
  { line: 0, sLive: true, tLive: false, owner: 's', note: 'Line 1 makes a string and gives it one owner, the variable s. In Rust every value has exactly one owner at a time.' },
  { line: 1, sLive: false, tLive: true, owner: 't', note: 'Line 2 does not copy the string: it moves it. t is now the owner, and s is no longer usable. The value has been “used up” as far as s is concerned.' },
  { line: 2, sLive: false, tLive: true, owner: 't', bad: true, note: 'Line 3 tries to use s again, and rustc refuses: error[E0382]: borrow of moved value: `s`. A value that may be used at most once is what type theory calls affine.' },
];

export default function MoveSteps() {
  const st = useSteps(STATES);
  const s = st.state;
  return (
    <StepFrame title="One owner at a time" steps={st} note={s.note}>
      <Svg w={400} h={180} title="Three lines of Rust with the current one highlighted, two variables s and t, and an arrow from the variable that owns the string to the string">
        {CODE.map((c, k) => (
          <g key={k}>
            {k === s.line && <rect x={8} y={6 + k * 22} width={384} height={20} rx={3} fill={s.bad ? tok('danger', 0.14) : tok('brand', 0.14)} />}
            <T x={14} y={16 + k * 22} size={12} mono>{c.replace(/ /g, ' ')}</T>
          </g>
        ))}
        <Box x={30} y={88} w={70} h={30} stroke={s.sLive ? tok('brand') : tok('line')} opacity={s.sLive ? 1 : 0.45}>
          <T x={65} y={103} size={13} mono anchor="middle">s</T>
        </Box>
        <Box x={30} y={134} w={70} h={30} stroke={s.tLive ? tok('brand') : tok('line')} opacity={s.tLive ? 1 : 0.45}>
          <T x={65} y={149} size={13} mono anchor="middle">t</T>
        </Box>
        <Box x={250} y={108} w={110} h={34} fill={tok('safe', 0.12)} stroke={tok('safe')}>
          <T x={305} y={125} size={13} mono anchor="middle">"hi"</T>
        </Box>
        {s.owner === 's' && <Arrow x1={102} y1={103} x2={246} y2={120} color={tok('brand')} />}
        {s.owner === 't' && <Arrow x1={102} y1={149} x2={246} y2={130} color={tok('brand')} />}
        {s.bad && <T x={110} y={92} size={12} weight={700} fill={tok('danger')}>moved: cannot use s</T>}
        {!s.bad && !s.sLive && <T x={110} y={92} size={11} fill={tok('muted')}>moved out</T>}
      </Svg>
    </StepFrame>
  );
}
