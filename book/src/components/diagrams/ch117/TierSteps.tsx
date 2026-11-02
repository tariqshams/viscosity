import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One function, add(a, b), climbing V8's tiers as it gets hot, then
// falling back when a guess fails. Based on the V8 blog posts on Ignition
// (2016), Sparkplug (2021) and Maglev (2023), and on the real run of
// tiers.js shown in chapter 117 (Node v22.23.4, V8 12.4).
type Tier = 'ignition' | 'sparkplug' | 'maglev' | 'turbofan';

const TIERS: { id: Tier; name: string; what: string }[] = [
  { id: 'turbofan', name: 'TurboFan', what: 'optimizing, slow to compile' },
  { id: 'maglev', name: 'Maglev', what: 'optimizing, quick to compile' },
  { id: 'sparkplug', name: 'Sparkplug', what: 'bytecode → machine code' },
  { id: 'ignition', name: 'Ignition', what: 'interprets bytecode' },
];

type S = {
  heat: number; // 0..1
  at: Tier | null;
  has: Tier[];
  feedback: boolean;
  label: string;
  fall?: boolean;
  note: string;
};

const STATES: S[] = [
  { heat: 0, at: null, has: [], feedback: false, label: 'source text', note: 'The script arrives as text. Before add can run at all, V8 parses it and compiles it to bytecode, as Drip’s compiler did. There is no machine code yet.' },
  { heat: 0.05, at: 'ignition', has: ['ignition'], feedback: false, label: 'call 1', note: 'The first calls run in Ignition, the interpreter: a dispatch loop over bytecode, like the VM you built. Starting here is cheap, and most functions never need anything more.' },
  { heat: 0.2, at: 'ignition', has: ['ignition'], feedback: true, label: 'a few calls', note: 'After a few calls V8 gives add a feedback vector. From now on every run writes down what it saw: here, that a and b were small integers.' },
  { heat: 0.45, at: 'sparkplug', has: ['ignition', 'sparkplug'], feedback: true, label: 'warm', note: 'add is warm. Sparkplug turns its bytecode into machine code in one quick pass. The work is the same; what disappears is the decode-and-dispatch cost of the loop.' },
  { heat: 0.65, at: 'maglev', has: ['ignition', 'sparkplug', 'maglev'], feedback: true, label: 'hot', note: 'In desktop Chrome since M117, a hot function can next go to Maglev, which uses the feedback to make specialized code quickly. (In the Node 22 build used here, Maglev is off by default, so this run skips it.)' },
  { heat: 0.9, at: 'turbofan', has: ['ignition', 'sparkplug', 'maglev', 'turbofan'], feedback: true, label: 'hot and stable', note: 'Very hot, with feedback that has stopped changing: TurboFan compiles its best code, assuming the integers it has always seen. V8’s trace calls this “hot and stable”.' },
  { heat: 0.5, at: 'sparkplug', has: ['ignition', 'sparkplug'], feedback: true, label: 'guess fails', fall: true, note: 'The sum grows past the biggest Smi. TurboFan’s code assumed small integers, so V8 throws it away and add carries on in a lower tier. Nothing is lost but time. Chapter 122 is about exactly this.' },
  { heat: 0.9, at: 'turbofan', has: ['ignition', 'sparkplug', 'turbofan'], feedback: true, label: 'hot again', note: 'The feedback now says “numbers that can be big”, so the next optimized version is built on that. Tiering is not a ladder you climb once: code moves up and down as the program changes.' },
];

export default function TierSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rowY = (k: number) => 30 + k * 44;
  const atK = TIERS.findIndex((t) => t.id === st.at);
  return (
    <StepFrame title="A function climbing V8’s tiers" steps={s} note={st.note}>
      <Svg w={400} h={230} title="Four tiers stacked from Ignition at the bottom to TurboFan at the top. A marker shows which tier is running add, a heat bar shows how hot it is, and a box shows whether it has a feedback vector.">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>TIER</T>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>HEAT</T>
        {TIERS.map((t, k) => {
          const on = st.at === t.id;
          const has = st.has.includes(t.id);
          return (
            <Box key={t.id} x={10} y={rowY(k)} w={262} h={36} r={5}
              fill={on ? tok('brand', 0.18) : has ? tok('brand', 0.05) : tok('panel')}
              stroke={on ? tok('brand') : tok('line')} dash={!has}>
              <T x={22} y={rowY(k) + 13} size={13} weight={700} fill={on ? tok('brand') : has ? tok('ink') : tok('muted')}>{t.name}</T>
              <T x={22} y={rowY(k) + 27} size={10} fill={tok('muted')}>{t.what}</T>
              <T x={262} y={rowY(k) + 18} size={10} anchor="end" fill={has ? tok('safe') : tok('muted')}>{has ? 'has code' : 'no code'}</T>
            </Box>
          );
        })}
        {atK >= 0 && st.fall && <Arrow x1={284} y1={rowY(0) + 18} x2={284} y2={rowY(2) + 14} color={tok('danger')} />}
        {/* heat bar */}
        <Box x={300} y={30} w={26} h={168} r={4} fill={tok('panel')} stroke={tok('line')} />
        <rect x={302} y={30 + 166 * (1 - st.heat)} width={22} height={Math.max(0, 166 * st.heat)} rx={3} fill={tok(st.heat > 0.7 ? 'danger' : st.heat > 0.3 ? 'warn' : 'accent', 0.7)} />
        <T x={334} y={40} size={10} fill={tok('muted')}>hot</T>
        <T x={334} y={192} size={10} fill={tok('muted')}>cold</T>
        <T x={300} y={214} size={11} mono>{st.label}</T>
        <Box x={10} y={206} w={160} h={20} r={4} fill={st.feedback ? tok('accent', 0.15) : tok('panel')} stroke={st.feedback ? tok('accent') : tok('line')} dash={!st.feedback}>
          <T x={20} y={216} size={11} fill={st.feedback ? tok('ink') : tok('muted')}>{st.feedback ? 'feedback vector: yes' : 'feedback vector: not yet'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
