// Chapter 59: reading a method off an instance binds it: a new environment
// holding only `this`, wrapped around the method's captured environment.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class Cake {
  init(f) { this.flavour = f; }
  taste() {
    print this.flavour;
  }
}
let c = Cake("lemon");
c.taste();`;

type S = {
  line: number;
  inst?: 'empty' | 'full';
  find?: boolean;
  bindEnv?: boolean;
  bound?: boolean;
  call?: boolean;
  read?: boolean;
  g: string;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 0, g: 'Cake', note: 'The class statement makes a DripClass with a map of methods. Each method is a DripFunction whose closure is the environment the class was declared in: here, the globals.' },
  { line: 6, g: 'Cake', inst: 'empty', note: 'Calling the class makes a DripInstance: a pointer to its class, and an empty map of fields.' },
  { line: 1, g: 'Cake', inst: 'full', note: 'The class then binds init to the new instance (the same steps you are about to see) and calls it. this.flavour = f creates the field.' },
  { line: 7, g: 'Cake, c', inst: 'full', find: true, note: 'c.taste: the instance has no field called taste, so it asks its class. findMethod returns the taste DripFunction.' },
  { line: 7, g: 'Cake, c', inst: 'full', find: true, bindEnv: true, note: 'bind(c) makes a new environment whose parent is the method’s closure (the globals), and defines one name in it: this, pointing at c.' },
  { line: 7, g: 'Cake, c', inst: 'full', bindEnv: true, bound: true, note: 'It returns a NEW DripFunction: same declaration, but its closure is the this-environment. That is a bound method.' },
  { line: 2, g: 'Cake, c', inst: 'full', bindEnv: true, bound: true, call: true, note: 'Calling the bound method is an ordinary call: a new environment for the parameters (none), whose parent is the bound closure.' },
  { line: 3, g: 'Cake, c', inst: 'full', bindEnv: true, bound: true, call: true, read: true, out: 'lemon', note: 'this resolves like any variable: the resolver said 1 environment up. Hop once, find this, follow it to c, read the field. Prints lemon.' },
];

export default function BindSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hot = tok('brand');
  return (
    <StepFrame title="Binding a method creates an environment for this" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={252} title="Environments on the left: call, this-environment, globals. Objects on the right: the class, the instance and the bound method.">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>ENVIRONMENTS</T>
        <T x={214} y={10} size={11} weight={700} fill={tok('muted')}>OBJECTS</T>
        <Box x={214} y={22} w={180} h={50} fill={st.find ? tok('brand', 0.14) : tok('panel')} stroke={st.find ? hot : tok('line')}>
          <T x={222} y={36} size={11} weight={700} fill={tok('muted')}>class Cake</T>
          <T x={222} y={56} size={13} mono>methods: init, taste</T>
        </Box>
        {st.inst && (
          <>
            <Box x={214} y={96} w={180} h={50} fill={st.read ? tok('brand', 0.14) : tok('panel')} stroke={st.read ? hot : tok('ink', 0.5)}>
              <T x={222} y={110} size={11} weight={700} fill={tok('muted')}>Cake instance (c)</T>
              <T x={222} y={130} size={13} mono>{st.inst === 'empty' ? 'fields: (none)' : 'flavour = "lemon"'}</T>
            </Box>
            <Arrow x1={380} y1={96} x2={380} y2={74} />
            <T x={344} y={86} size={10} fill={tok('muted')}>class</T>
          </>
        )}
        {st.bound && (
          <Box x={214} y={170} w={180} h={36} fill={tok('brand', 0.08)} stroke={hot}>
            <T x={222} y={188} size={13} mono weight={700}>{'<fn taste>, bound'}</T>
          </Box>
        )}
        {st.call && (
          <>
            <Box x={6} y={70} w={176} h={36} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={14} y={88} size={11} weight={700} fill={tok('accent')}>taste() call (running)</T>
            </Box>
            <Arrow x1={60} y1={106} x2={60} y2={128} color={st.read ? hot : tok('ink', 0.7)} />
          </>
        )}
        {st.bindEnv && (
          <>
            <Box x={6} y={130} w={176} h={40} fill={st.read ? tok('brand', 0.14) : tok('safe', 0.1)} stroke={st.read ? hot : tok('safe')}>
              <T x={14} y={143} size={11} weight={700} fill={tok('safe')}>bind environment</T>
              <T x={14} y={160} size={13} mono>this = ●</T>
            </Box>
            <Arrow x1={92} y1={160} x2={212} y2={128} color={hot} />
            <Arrow x1={60} y1={170} x2={60} y2={196} />
          </>
        )}
        {st.bound && <Arrow x1={214} y1={192} x2={184} y2={160} color={hot} />}
        <Box x={6} y={198} w={176} h={40}>
          <T x={14} y={211} size={11} weight={700} fill={tok('muted')}>globals</T>
          <T x={14} y={228} size={13} mono>{st.g}</T>
        </Box>
        {st.out && <T x={214} y={232} size={13} mono fill={tok('muted')}>printed: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
