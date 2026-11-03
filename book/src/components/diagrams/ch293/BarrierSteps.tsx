// Chapter 293: a generational write barrier with a remembered bit, step by
// step. xs is an old list; r and r2 are young. Each store runs the checks
// in order (is the value an object? is the owner old? is the value young?
// is the owner's bit already set?) and only the first old-to-young store
// into xs adds an entry. A minor collection promotes the survivors and
// clears the bit. The counters match the Run example's three numbers.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `xs[0] = 7;
r.next = xs;
push(xs, r);
xs[0] = r;
xs[1] = new R();
# minor collection
xs[0] = 3;`;

type S = {
  line: number | null; check: string; bit: boolean; rem: string[]; young: string[]; old: string[];
  checks: number; o2y: number; entries: number; note: string;
};

const STATES: S[] = [
  { line: null, check: '', bit: false, rem: [], young: ['r'], old: ['xs'], checks: 0, o2y: 0, entries: 0,
    note: 'xs survived a collection, so it is old; r was allocated since, so it is young. The remembered set is empty and xs’s bit is clear.' },
  { line: 0, check: 'value is a number: stop', bit: false, rem: [], young: ['r'], old: ['xs'], checks: 1, o2y: 0, entries: 0,
    note: 'Storing 7 creates no pointer at all, so the first check ends the barrier. This is the commonest case.' },
  { line: 1, check: 'owner r is young: stop', bit: false, rem: [], young: ['r'], old: ['xs'], checks: 2, o2y: 0, entries: 0,
    note: 'A young object pointing at an old one needs no record: a minor collection traces every live young object anyway.' },
  { line: 2, check: 'old → young, bit clear: record xs', bit: true, rem: ['xs'], young: ['r'], old: ['xs'], checks: 3, o2y: 1, entries: 1,
    note: 'The native push stores young r into old xs. The bit is clear, so the barrier sets it and adds xs to the remembered set.' },
  { line: 3, check: 'old → young, bit set: stop', bit: true, rem: ['xs'], young: ['r'], old: ['xs'], checks: 4, o2y: 2, entries: 1,
    note: 'Another old-to-young store into xs. The bit says xs is already remembered, so nothing is added.' },
  { line: 4, check: 'old → young, bit set: stop', bit: true, rem: ['xs'], young: ['r', 'r2'], old: ['xs'], checks: 5, o2y: 3, entries: 1,
    note: 'A brand-new r2 goes into xs: a third old-to-young store, and still one entry. The minor collection will scan all of xs once.' },
  { line: 5, check: 'roots + remembered set', bit: false, rem: [], young: [], old: ['xs', 'r', 'r2'], checks: 5, o2y: 3, entries: 1,
    note: 'The minor collection treats xs as a root, finds r and r2 through it, and promotes them. Then it clears xs’s bit and empties the set.' },
  { line: 6, check: 'value is a number: stop', bit: false, rem: [], young: [], old: ['xs', 'r', 'r2'], checks: 6, o2y: 3, entries: 1,
    note: 'Six checks, three old-to-young stores, one entry: the cost was in the checking, not the recording.' },
];

function Objs({ x, y, label, names, stroke, bitOn }: { x: number; y: number; label: string; names: string[]; stroke: string; bitOn?: boolean }) {
  return (
    <g>
      <Box x={x} y={y} w={186} h={62} fill={tok('panel')} stroke={stroke} />
      <T x={x + 8} y={y + 15} size={11} weight={700}>{label}</T>
      {names.map((n, k) => (
        <g key={n}>
          <Box x={x + 8 + k * 58} y={y + 24} w={52} h={28} r={3} fill={tok('panel')} stroke={tok('ink', 0.6)} />
          <T x={x + 34 + k * 58} y={y + 42} size={11} mono anchor="middle">{n}{n === 'xs' && bitOn ? ' ●' : ''}</T>
        </g>
      ))}
    </g>
  );
}

export default function BarrierSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A write barrier with a remembered bit" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title={`Old and young objects, the remembered set, and the barrier’s counters. Last check: ${st.check || 'none yet'}.`}>
        <Objs x={4} y={4} label="old" names={st.old} stroke={tok('brand')} bitOn={st.bit} />
        <Objs x={210} y={4} label="young" names={st.young} stroke={tok('accent')} />
        <T x={4} y={88} size={11} fill={tok('muted')}>● = remembered bit set</T>
        <T x={4} y={110} size={12}>barrier: <tspan className="mono" fontWeight={700}>{st.check || '…'}</tspan></T>
        <T x={4} y={134} size={12}>remembered set: <tspan className="mono">[{st.rem.join(', ')}]</tspan></T>
        <T x={4} y={160} size={12} mono>checks {st.checks}   old→young {st.o2y}   entries {st.entries}</T>
      </Svg>
    </StepFrame>
  );
}
