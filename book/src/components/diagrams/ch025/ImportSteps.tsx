import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  scannerRan: boolean;
  linked: boolean;
  parserRan: boolean;
  calling: boolean;
  bad: boolean;
  focus: 'parser' | 'scanner' | null;
  note: string;
};

const STATES: S[] = [
  { scannerRan: false, linked: false, parserRan: false, calling: false, bad: false, focus: 'parser', note: 'Two files. parser.js begins with import { scan } from \'./scanner.js\'. Before any of parser.js runs, JavaScript reads that line and sees it needs scanner.js.' },
  { scannerRan: false, linked: true, parserRan: false, calling: false, bad: false, focus: 'parser', note: 'Still before running anything, JavaScript links the name scan in parser.js to scanner.js’s own scan (and checks that scanner.js really exports it). Nothing is copied: there is exactly one scan, and parser.js may not assign to its link.' },
  { scannerRan: true, linked: true, parserRan: false, calling: false, bad: false, focus: 'scanner', note: 'scanner.js runs first, because parser.js depends on it. Its top-level code creates isDigit and scan. Only scan is marked export: that is its menu.' },
  { scannerRan: true, linked: true, parserRan: true, calling: false, bad: false, focus: 'parser', note: 'Now parser.js runs, and creates parse. isDigit is still invisible to it: that name never left scanner.js.' },
  { scannerRan: true, linked: true, parserRan: true, calling: true, bad: false, focus: 'scanner', note: 'When parse calls scan, the code of scan runs where it was written, inside scanner.js, so it can use isDigit freely. The border hides names, not behaviour.' },
  { scannerRan: false, linked: false, parserRan: false, calling: false, bad: true, focus: 'parser', note: 'Suppose parser.js also asked for isDigit. JavaScript checks every import against the export list before running anything, finds no export called isDigit, and stops with a SyntaxError. Not one line of either file runs.' },
];

export default function ImportSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hot = (f: 'parser' | 'scanner') => st.focus === f;
  return (
    <StepFrame title="Linking an import to an export" steps={s} note={st.note}>
      <Svg w={400} h={196} title="Two modules side by side. scanner.js keeps isDigit private and exports scan. parser.js imports scan, linked by an arrow, and defines parse.">
        <Box x={4} y={6} w={176} h={140} r={6} stroke={hot('scanner') ? tok('brand') : tok('ink', 0.45)} fill={hot('scanner') ? tok('brand', 0.06) : tok('panel')}>
          <T x={14} y={24} size={12.5} mono weight={700}>scanner.js</T>
          <T x={170} y={24} size={11} anchor="end" fill={tok('muted')}>{st.scannerRan ? 'has run' : 'not run'}</T>
          <Box x={14} y={40} w={156} h={30} r={4} dash stroke={tok('muted')} fill="transparent" opacity={st.scannerRan ? 1 : 0.4}>
            <T x={24} y={55.5} size={12} mono fill={tok('muted')}>isDigit</T>
            <T x={160} y={55.5} size={11} anchor="end" fill={tok('muted')}>private</T>
          </Box>
          <Box x={14} y={80} w={156} h={30} r={4} stroke={tok('brand')} fill={tok('brand', 0.12)} opacity={st.scannerRan ? 1 : 0.4}>
            <T x={24} y={95.5} size={12} mono weight={700}>export scan</T>
          </Box>
          {st.calling && <T x={92} y={130} size={11} anchor="middle" fill={tok('brand')}>scan runs here, uses isDigit</T>}
        </Box>
        <Box x={220} y={6} w={176} h={140} r={6} stroke={hot('parser') ? tok('brand') : tok('ink', 0.45)} fill={hot('parser') ? tok('brand', 0.06) : tok('panel')}>
          <T x={230} y={24} size={12.5} mono weight={700}>parser.js</T>
          <T x={386} y={24} size={11} anchor="end" fill={tok('muted')}>{st.parserRan ? 'has run' : 'not run'}</T>
          <Box x={230} y={40} w={156} h={30} r={4} stroke={st.bad ? tok('danger') : tok('accent')} fill={st.bad ? tok('danger', 0.1) : tok('accent', 0.12)}>
            <T x={240} y={55.5} size={12} mono weight={700}>{st.bad ? 'import isDigit' : 'import scan'}</T>
          </Box>
          <Box x={230} y={80} w={156} h={30} r={4} stroke={tok('ink', 0.4)} fill="transparent" opacity={st.parserRan ? 1 : 0.4}>
            <T x={240} y={95.5} size={12} mono>parse</T>
          </Box>
          {st.calling && <T x={308} y={130} size={11} anchor="middle" fill={tok('brand')}>parse calls scan</T>}
        </Box>
        {st.linked && <Arrow x1={226} y1={55} x2={172} y2={92} color={tok('brand')} width={2} />}
        {st.bad && <Arrow x1={226} y1={55} x2={172} y2={55} color={tok('danger')} width={2} dash />}
        {st.bad ? (
          <g>
            <T x={8} y={164} size={11.5} mono fill={tok('danger')}>SyntaxError: The requested module</T>
            <T x={8} y={182} size={11.5} mono fill={tok('danger')}>does not provide an export named 'isDigit'</T>
          </g>
        ) : (
          <T x={8} y={170} size={11} fill={tok('muted')}>{st.linked ? 'arrow: the import is a link to the one real scan' : 'imports are checked before any code runs'}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
