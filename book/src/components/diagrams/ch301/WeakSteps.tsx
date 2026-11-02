// Chapter 301: a weak reference and a finaliser through one collection.
// Marking does not follow the weak edge; afterwards the weak slot is
// cleared because its target was not marked, and the target's
// registration is queued; the callback runs later, if at all.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type C = 'w' | 'b' | 'dead';
type S = { col: Record<string, C>; strong: boolean; weak: boolean; queue: string; out: string; note: string };

const STATES: S[] = [
  { col: { App: 'w', Cache: 'w', Img: 'w' }, strong: true, weak: true, queue: '', out: '', note: 'The program\'s App holds an image strongly (solid arrow). A cache holds the same image weakly (dashed), and a FinalizationRegistry has the image registered with the held value "img gone".' },
  { col: { App: 'w', Cache: 'w', Img: 'w' }, strong: false, weak: true, queue: '', out: '', note: 'The program drops App\'s pointer: app.img = null. Now the image is reachable only through the weak reference.' },
  { col: { App: 'b', Cache: 'b', Img: 'w' }, strong: false, weak: true, queue: '', out: '', note: 'A collection marks from the root: App, then Cache. Marking does not follow the dashed arrow, so the image stays white. A weak reference is never a reason to live.' },
  { col: { App: 'b', Cache: 'b', Img: 'dead' }, strong: false, weak: false, queue: '', out: '', note: 'After marking, before the memory is reused, the collector clears every weak slot whose target is unmarked. The cache\'s slot is now empty: deref() would give undefined.' },
  { col: { App: 'b', Cache: 'b', Img: 'dead' }, strong: false, weak: false, queue: '"img gone"', out: '', note: 'The image had a registration, so its held value goes onto a queue of cleanups to run. Nothing runs yet: the collector does not call program code itself.' },
  { col: { App: 'b', Cache: 'b', Img: 'dead' }, strong: false, weak: false, queue: '', out: 'cleanup: img gone', note: 'Later, in a task of its own, the callback runs with the held value. Later, in some order, and only if the program and the registry are both still alive: that is all finalisation promises.' },
];

const POS: Record<string, [number, number]> = { App: [70, 70], Cache: [70, 160], Img: [250, 115] };

export default function WeakSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const node = (n: string) => {
    const [x, y] = POS[n];
    const c = st.col[n];
    return (
      <Box key={n} x={x - 42} y={y - 18} w={84} h={36} r={6}
        fill={c === 'b' ? tok('ink') : 'transparent'} stroke={c === 'dead' ? tok('danger', 0.7) : tok('ink')} dash={c === 'dead'}>
        <T x={x} y={y} size={13} weight={700} anchor="middle" fill={c === 'b' ? tok('paper') : c === 'dead' ? tok('danger') : tok('ink')}>{n}</T>
      </Box>
    );
  };
  return (
    <StepFrame title="A weak reference and a finaliser" steps={s} note={st.note}>
      <Svg w={400} h={236} title="App and Cache reachable from a root; an image held strongly by App and weakly by Cache; a cleanup queue and the program's output">
        <T x={8} y={20} size={11} fill={tok('brand')}>root</T>
        <Arrow x1={30} y1={28} x2={40} y2={52} color={tok('brand')} />
        <Arrow x1={70} y1={88} x2={70} y2={140} />
        {st.strong && <Arrow x1={112} y1={70} x2={206} y2={104} />}
        {st.weak && <Arrow x1={112} y1={160} x2={206} y2={126} dash color={tok('ink', 0.6)} />}
        {!st.weak && <T x={140} y={160} size={11} mono fill={tok('muted')}>weak: ∅</T>}
        {['App', 'Cache', 'Img'].map(node)}
        <Box x={8} y={196} w={186} h={32} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={212} size={11} fill={tok('muted')}>cleanup queue:</T>
          <T x={186} y={212} size={11} mono anchor="end">{st.queue}</T>
        </Box>
        <Box x={204} y={196} w={188} h={32} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={212} y={212} size={11} mono>{st.out || ' '}</T>
        </Box>
        <T x={300} y={176} size={11} anchor="middle" fill={tok('muted')}>program output</T>
      </Svg>
    </StepFrame>
  );
}
