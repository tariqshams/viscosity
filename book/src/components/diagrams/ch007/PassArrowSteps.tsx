import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function birthday(person) {
  person.age = person.age + 1;
  person = { age: 1 };
}
const ada = { age: 36 };
birthday(ada);
console.log(ada.age); // 37`;

type S = { line: number; page: boolean; person?: 1 | 2; age: number; obj2?: boolean; out?: string; note: string };

const STATES: S[] = [
  { line: 4, page: false, age: 36, note: 'An object is made in memory, and the variable ada holds an arrow to it.' },
  { line: 5, page: true, person: 1, age: 36, note: 'birthday(ada) opens a fresh page for the call. The parameter person gets a COPY OF THE ARROW, so both arrows point at one object.' },
  { line: 1, page: true, person: 1, age: 37, note: 'person.age = … follows person’s arrow and changes the object at the end of it. That is a mutation, and it is the very object ada points at.' },
  { line: 2, page: true, person: 2, age: 37, obj2: true, note: 'person = { age: 1 } makes a new object and re-aims person’s arrow at it. Only the arrow on the call’s page moved; ada’s arrow did not.' },
  { line: 5, page: false, age: 37, obj2: true, note: 'The call ends and its page is thrown away. Nothing points at { age: 1 } any more, so no code can ever reach it again.' },
  { line: 6, page: false, age: 37, obj2: true, out: '37', note: 'ada.age is 37: the function could change ada’s object, but it could not make ada point somewhere else.' },
];

export default function PassArrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Passing an object to a function" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The caller's variable ada and the call's parameter person, each holding an arrow to an object in memory">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>OUTSIDE</T>
        <Box x={8} y={22} w={70} h={32} stroke={tok('ink', 0.5)}>
          <T x={18} y={38} size={15} mono weight={700}>ada</T>
          <circle cx={66} cy={38} r={4} fill={tok('ink', 0.8)} />
        </Box>
        <Arrow x1={66} y1={38} x2={236} y2={46} />
        <T x={8} y={78} size={11} weight={700} fill={tok('muted')}>THE CALL’S PAGE</T>
        <Box x={4} y={86} w={140} h={56} dash={!st.page} fill={st.page ? tok('brand', 0.08) : 'transparent'} stroke={st.page ? tok('brand') : tok('line')}>
          {st.page ? (
            <Box x={14} y={98} w={100} h={32} stroke={tok('ink', 0.5)}>
              <T x={24} y={114} size={15} mono weight={700}>person</T>
              <circle cx={104} cy={114} r={4} fill={tok('ink', 0.8)} />
            </Box>
          ) : (
            <T x={74} y={114} size={12} anchor="middle" fill={tok('muted')}>no call running</T>
          )}
        </Box>
        {st.page && st.person === 1 && <Arrow x1={104} y1={114} x2={236} y2={60} bend={0.3} color={tok('brand')} />}
        {st.page && st.person === 2 && <Arrow x1={104} y1={114} x2={236} y2={126} color={tok('brand')} />}
        <T x={238} y={12} size={11} weight={700} fill={tok('muted')}>OBJECTS IN MEMORY</T>
        <Box x={238} y={28} w={150} h={44} r={8} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={252} y={50} size={15} mono>{'{ age: '}<tspan fontWeight={700} fill={tok('brand')}>{st.age}</tspan>{' }'}</T>
        </Box>
        {st.obj2 && (
          <Box x={238} y={104} w={150} h={44} r={8} dash={!st.page} fill={st.page ? tok('accent', 0.1) : 'transparent'} stroke={st.page ? tok('accent') : tok('line')} opacity={st.page ? 1 : 0.6}>
            <T x={252} y={126} size={15} mono>{'{ age: 1 }'}</T>
          </Box>
        )}
        {st.obj2 && !st.page && <T x={238} y={160} size={11} fill={tok('muted')}>unreachable: nothing points here</T>}
        {st.out && <T x={8} y={164} size={13} mono fill={tok('muted')}>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
