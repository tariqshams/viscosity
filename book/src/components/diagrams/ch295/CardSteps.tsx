// Chapter 295: a card table at work. The old generation is twelve objects
// on three cards (four objects to a card in this toy; 512 bytes in
// HotSpot). The barrier dirties a card on every store; a minor collection
// scans the old objects on dirty cards only, and traces young objects.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  dirty: [boolean, boolean, boolean];
  edges: { from: number; to: string }[];
  scanning?: number;
  skipped?: number[];
  young: Record<string, 'plain' | 'live' | 'dead' | 'moved'>;
  code?: string;
  note: string;
};

const Y = ['Y1', 'Y2', 'Y3'];
const plain = { Y1: 'plain', Y2: 'plain', Y3: 'plain' } as const;

const STATES: S[] = [
  { dirty: [false, false, false], edges: [], young: { ...plain }, note: 'The old generation is twelve objects, o0 to o11, on three cards; under them is the card table, one byte per card, all clean. The young generation holds Y1, Y2 and Y3. Only Y1 is held by a root.' },
  { dirty: [false, true, false], edges: [{ from: 5, to: 'Y2' }], young: { ...plain }, code: 'o5.kid = Y2', note: 'The program stores Y2 into o5. The barrier runs after the store: o5 is on card 1 (5 divided by 4, rounded down), so card 1\'s byte becomes dirty. It does not check what was stored.' },
  { dirty: [false, true, true], edges: [{ from: 5, to: 'Y2' }, { from: 9, to: 'o2' }], young: { ...plain }, code: 'o9.next = o2', note: 'Another store, old into old. The barrier dirties card 2 anyway. Asking "is the value young?" would cost a check on every store; HotSpot\'s card-table barrier does not ask, and pays later instead.' },
  { dirty: [false, true, true], edges: [{ from: 5, to: 'Y2' }, { from: 9, to: 'o2' }], skipped: [0], young: { ...plain, Y1: 'live' }, note: 'A minor collection starts. The root reaches Y1. Card 0 is clean, so o0 to o3 are never read: that is the saving.' },
  { dirty: [false, true, true], edges: [{ from: 5, to: 'Y2' }, { from: 9, to: 'o2' }], skipped: [0], scanning: 1, young: { ...plain, Y1: 'live', Y2: 'live' }, note: 'Card 1 is dirty, so the collector reads o4 to o7 and treats their young pointers as roots. o5 points at Y2: Y2 is live.' },
  { dirty: [false, true, true], edges: [{ from: 5, to: 'Y2' }, { from: 9, to: 'o2' }], skipped: [0], scanning: 2, young: { ...plain, Y1: 'live', Y2: 'live' }, note: 'Card 2 is dirty too, but o9 points at o2, which is old: not a root for this collection, and o2 is not traced. The dirty card cost a scan and found nothing. Nothing reaches Y3.' },
  { dirty: [false, true, false], edges: [{ from: 5, to: 'Y2' }, { from: 9, to: 'o2' }], young: { Y1: 'moved', Y2: 'moved', Y3: 'dead' }, note: 'Y1 and Y2 are copied out and Y3\'s space is reused. Card 2 is cleaned. In this model card 1 stays dirty, because o5 still points at a young object (Y2, now in a survivor space).' },
];

const OX = (k: number) => 14 + k * 31 + Math.floor(k / 4) * 6;
const YX: Record<string, number> = { Y1: 90, Y2: 190, Y3: 290 };

export default function CardSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A card table and a minor collection" steps={s} note={st.note}>
      <Svg w={400} h={250} title="Twelve old objects on three cards, a card table of three bytes, and three young objects">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>OLD GENERATION</T>
        {[0, 1, 2].map((c) => (
          <g key={c}>
            <Box x={OX(c * 4) - 3} y={22} w={4 * 31 + 3} h={36} r={4}
              fill={st.scanning === c ? tok('brand', 0.12) : st.skipped?.includes(c) ? tok('line', 0.15) : 'transparent'}
              stroke={st.scanning === c ? tok('brand') : tok('line')} dash />
            <T x={OX(c * 4) + 60} y={70} size={11} anchor="middle" fill={tok('muted')}>{`card ${c}`}</T>
            <Box x={OX(c * 4) + 30} y={80} w={62} h={22} r={3}
              fill={st.dirty[c] ? tok('warn', 0.3) : tok('panel')} stroke={st.dirty[c] ? tok('warn') : tok('line')}>
              <T x={OX(c * 4) + 61} y={91} size={11} mono anchor="middle">{st.dirty[c] ? 'dirty' : 'clean'}</T>
            </Box>
          </g>
        ))}
        {Array.from({ length: 12 }, (_, k) => (
          <Box key={k} x={OX(k)} y={26} w={27} h={28} r={3} fill={tok('panel')} stroke={tok('ink', 0.4)}>
            <T x={OX(k) + 13.5} y={40} size={11} mono anchor="middle">{`o${k}`}</T>
          </Box>
        ))}
        <T x={8} y={118} size={11} fill={tok('muted')}>card table: one byte per card</T>
        <T x={8} y={160} size={11} weight={700} fill={tok('muted')}>YOUNG GENERATION</T>
        {Y.map((n) => {
          const v = st.young[n];
          return (
            <Box key={n} x={YX[n]} y={170} w={50} h={30} r={4}
              fill={v === 'live' || v === 'moved' ? tok('safe', 0.3) : 'transparent'}
              stroke={v === 'dead' ? tok('danger', 0.7) : v === 'plain' ? tok('ink', 0.5) : tok('safe')} dash={v === 'dead'}>
              <T x={YX[n] + 25} y={185} size={12} mono anchor="middle">{n}</T>
            </Box>
          );
        })}
        <T x={34} y={222} size={11} fill={tok('brand')}>root</T>
        <Arrow x1={52} y1={214} x2={92} y2={200} color={tok('brand')} />
        {st.edges.map((e, k) => e.to.startsWith('Y')
          ? <Arrow key={k} x1={OX(e.from) + 14} y1={56} x2={YX[e.to] + 25} y2={170} color={tok('ink', 0.7)} bend={0.3} />
          : <Arrow key={k} x1={OX(e.from) + 10} y1={24} x2={OX(Number(e.to.slice(1))) + 18} y2={24} color={tok('ink', 0.5)} bend={0.25} />)}
        {st.code && <T x={392} y={240} size={12} mono anchor="end" fill={tok('brand')}>{st.code}</T>}
        {st.young.Y3 === 'dead' && <T x={392} y={240} size={11} anchor="end" fill={tok('danger')}>Y3 freed</T>}
      </Svg>
    </StepFrame>
  );
}
