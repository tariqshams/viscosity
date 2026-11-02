import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 274: building three vtables, then one virtual call made with
// two loads and a jump. The instructions are the ones clang 18 emits for
// RISC-V (see the chapter); the tables are simplified to their method
// slots.
type Tab = { name: string; rows: [string, string][] };
type S = {
  tabs: number;
  changed?: [number, number];
  obj?: 'sq' | 'ci';
  hiVptr?: boolean;
  hiSlot?: number;
  ins?: string;
  note: string;
};

const TABS: Tab[] = [
  { name: 'Shape', rows: [['0 area', '(none)'], ['1 name', 'Shape.name']] },
  { name: 'Sq', rows: [['0 area', 'Sq.area'], ['1 name', 'Shape.name']] },
  { name: 'Circle', rows: [['0 area', 'Ci.area'], ['1 name', 'Ci.name']] },
];

const STATES: S[] = [
  { tabs: 1, note: 'The compiler numbers Shape’s methods: area is slot 0 and name is slot 1. Shape gives no body for area, so its slot is empty; Shape’s own name fills slot 1.' },
  { tabs: 2, changed: [1, 0], note: 'Sq extends Shape. Its table starts as a copy of Shape’s, then Sq’s own area overwrites slot 0. name is not overridden, so slot 1 still points at Shape.name.' },
  { tabs: 3, changed: [2, 0], note: 'Circle overrides both methods, so both of its slots change; the numbering never does: area is slot 0 in every table in this family.' },
  { tabs: 3, obj: 'sq', note: 'new Sq(2) makes an object whose first word is the vtable pointer (vptr), pointing at Sq’s table, followed by its field s.' },
  { tabs: 3, obj: 'sq', hiVptr: true, ins: 'ld a1, 0(a0)', note: 'The call o.area(): first load the object’s first word. a0 holds the object’s address, so a1 now holds the address of Sq’s table.' },
  { tabs: 3, obj: 'sq', hiVptr: true, hiSlot: 0, ins: 'ld t1, 0(a1)', note: 'Second load: slot 0 of that table (offset 0, since each slot is 8 bytes). t1 now holds the address of Sq.area.' },
  { tabs: 3, obj: 'sq', hiSlot: 0, ins: 'jr t1', note: 'Jump to it. Sq.area runs with the same object in a0 and returns 2 × 2 = 4. Nothing was searched; no name was compared.' },
  { tabs: 3, obj: 'ci', hiVptr: true, hiSlot: 0, ins: 'same 3 lines', note: 'Hand the same compiled code a Circle and its vptr leads to Circle’s table, whose slot 0 is Ci.area. The code did not change; the data it walked through did.' },
];

export default function VtableSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const target = st.obj === 'ci' ? 2 : 1;
  return (
    <StepFrame title="Building vtables, then one virtual call" steps={s} note={st.note}>
      <Svg w={400} h={236} title="Three vtables, for Shape, Sq and Circle, each with slot 0 for area and slot 1 for name, and an object whose first word points at one of them">
        {TABS.map((t, k) => {
          const x = 4 + k * 132;
          const shown = k < st.tabs;
          return (
            <g key={t.name} opacity={shown ? 1 : 0.25}>
              <T x={x + 62} y={12} size={12} weight={700} anchor="middle">{t.name} vtable</T>
              {t.rows.map(([slot, fn], j) => {
                const on = st.obj && target === k && st.hiSlot === j;
                const changed = st.changed && st.changed[0] === k;
                return (
                  <Box key={j} x={x} y={24 + j * 32} w={124} h={28}
                    fill={on ? tok('brand', 0.2) : changed && j === st.changed![1] ? tok('warn', 0.15) : tok('panel')}
                    stroke={on ? tok('brand') : tok('line')}>
                    <T x={x + 6} y={38 + j * 32} size={11} mono fill={tok('muted')}>{slot}</T>
                    <T x={x + 118} y={38 + j * 32} size={11} mono anchor="end">{shown ? fn : ''}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        <T x={8} y={118} size={11} weight={700} fill={tok('muted')}>THE OBJECT IN MEMORY</T>
        {st.obj ? (
          <g>
            <Box x={8} y={128} w={110} h={34} fill={st.hiVptr ? tok('brand', 0.2) : tok('panel')} stroke={st.hiVptr ? tok('brand') : tok('ink', 0.5)}>
              <T x={63} y={145} size={12} mono anchor="middle">vptr</T>
            </Box>
            <Box x={118} y={128} w={110} h={34}>
              <T x={173} y={145} size={12} mono anchor="middle">{st.obj === 'ci' ? 'r = 1' : 's = 2'}</T>
            </Box>
            <T x={10} y={174} size={11} mono fill={tok('muted')}>offset 0</T>
            <T x={120} y={174} size={11} mono fill={tok('muted')}>offset 8</T>
            <Arrow x1={63} y1={128} x2={4 + target * 132 + 40} y2={88} color={tok('brand')} bend={0.2} />
          </g>
        ) : (
          <T x={8} y={145} size={12} fill={tok('muted')}>no object yet</T>
        )}
        <Box x={250} y={128} w={146} h={34} dash={!st.ins} fill="transparent">
          <T x={323} y={145} size={12} mono anchor="middle">{st.ins ?? 'no call yet'}</T>
        </Box>
        <T x={250} y={174} size={11} fill={tok('muted')}>instruction now</T>
        <T x={8} y={206} size={11} fill={tok('muted')}>a0 = object address;  a1 = its vtable;</T>
        <T x={8} y={224} size={11} fill={tok('muted')}>t1 = the method’s address</T>
      </Svg>
    </StepFrame>
  );
}
