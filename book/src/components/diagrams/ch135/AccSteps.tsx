import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// add(2, 3) run twice side by side: by Ignition (a register machine with
// an accumulator; bytecode from `node --print-bytecode`, Node v22.23.4,
// V8 12.4) and by Drip's stack VM (bytecode from the companion
// disassembler). The call is a later one, so add already has a feedback
// vector (allocated after 8 calls by default in Node 22).
const IGN = ['Ldar a1', 'Add a0, [0]', 'Return'];
const DRIP = ['GET_LOCAL 1', 'GET_LOCAL 2', 'ADD', 'RETURN'];

type S = { ig: number; dr: number; acc: string; slot: string; stack: string[]; out?: string; outD?: string; note: string };

const STATES: S[] = [
  { ig: -1, dr: -1, acc: '', slot: '', stack: [], note: 'add(2, 3) is about to run in both machines. Ignition keeps the parameters in registers a0 = 2 and a1 = 3; Drip keeps them in stack slots 1 and 2. Nothing has run yet.' },
  { ig: 0, dr: 0, acc: '3', slot: '', stack: ['2'], note: 'Ignition: Ldar a1 ("load accumulator from register a1") copies 3 into the accumulator. Drip: GET_LOCAL 1 pushes a copy of a (2) onto its stack.' },
  { ig: 1, dr: 1, acc: '5', slot: 'small ints', stack: ['2', '3'], note: 'Ignition: Add a0, [0] adds a0 to the accumulator, which now holds 5, and writes in feedback slot 0 what it saw: two small integers. Drip: GET_LOCAL 2 pushes b; it still has not added anything.' },
  { ig: 2, dr: 2, acc: '5', slot: 'small ints', stack: ['5'], out: '5', note: 'Ignition: Return returns whatever is in the accumulator, 5, and is finished after three instructions. Drip: ADD pops both values and pushes their sum.' },
  { ig: 3, dr: 3, acc: '5', slot: 'small ints', stack: [], out: '5', outD: '5', note: 'Drip: RETURN pops 5 and returns it, one instruction later. Same answer; but only Ignition left a note behind (the feedback slot) for the compilers above it to read.' },
];

function Code({ x, title, lines, at }: { x: number; title: string; lines: string[]; at: number }) {
  return (
    <g>
      <T x={x} y={12} size={11} weight={700} fill={tok('muted')}>{title}</T>
      {lines.map((l, k) => (
        <Box key={l} x={x} y={22 + k * 24} w={180} h={20} r={3}
          fill={k === at ? tok('brand', 0.18) : tok('panel')}
          stroke={k === at ? tok('brand') : tok('line')} opacity={k <= at || at < 0 ? 1 : 0.7}>
          <T x={x + 8} y={32 + k * 24} size={12} mono fill={k === at ? tok('brand') : tok('ink')}>{l}</T>
        </Box>
      ))}
    </g>
  );
}

function Cell({ x, y, name, v, hi }: { x: number; y: number; name: string; v: string; hi?: boolean }) {
  return (
    <g>
      <T x={x} y={y + 11} size={11} mono fill={tok('muted')}>{name}</T>
      <Box x={x + 34} y={y} w={52} h={22} r={3} fill={hi ? tok('accent', 0.15) : tok('panel')} stroke={hi ? tok('accent') : tok('line')} dash={!v}>
        <T x={x + 60} y={y + 11} size={12} mono anchor="middle">{v}</T>
      </Box>
    </g>
  );
}

export default function AccSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="add(2, 3) in Ignition and in Drip" steps={s} note={st.note}>
      <Svg w={400} h={250} title="Left: Ignition's three instructions, its registers a0 and a1, its accumulator and feedback slot 0. Right: Drip's four instructions and its value stack. The current instruction of each is highlighted.">
        <Code x={8} title="IGNITION (registers)" lines={IGN} at={st.ig} />
        <Code x={212} title="DRIP VM (stack)" lines={DRIP} at={st.dr} />
        <Cell x={8} y={128} name="a0" v="2" />
        <Cell x={8} y={154} name="a1" v="3" />
        <Cell x={8} y={180} name="acc" v={st.acc} hi={!!st.acc} />
        <T x={8} y={222} size={11} fill={tok('muted')}>feedback slot [0]:</T>
        <T x={8} y={238} size={12} mono fill={st.slot ? tok('accent') : tok('muted')}>{st.slot || '(nothing yet)'}</T>
        {st.out && <T x={110} y={191} size={12} weight={700} fill={tok('safe')}>→ 5</T>}
        <T x={212} y={128} size={11} fill={tok('muted')}>stack (top at the right)</T>
        {st.stack.length === 0 && <T x={212} y={152} size={12} mono fill={tok('muted')}>(empty)</T>}
        {st.stack.map((v, k) => (
          <Box key={k} x={212 + k * 44} y={140} w={38} h={24} r={3} fill={tok('panel')} stroke={tok('ink', 0.5)}>
            <T x={231 + k * 44} y={152} size={13} mono anchor="middle">{v}</T>
          </Box>
        ))}
        {st.outD && <T x={212} y={191} size={12} weight={700} fill={tok('safe')}>returns 5</T>}
      </Svg>
    </StepFrame>
  );
}
