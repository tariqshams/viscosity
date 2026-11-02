import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Drip values on the left, the TypeScript values that hold them on the right. */
const ROWS: [string, string, string][] = [
  ['none', 'null', 'prints none'],
  ['true, false', 'true, false', 'kept as is'],
  ['3, 2.5', 'a JS number', '64-bit double'],
  ['"hi"', 'a JS string', 'joined by JS +'],
  ['[1, 2]', 'DripList', 'later: lists'],
  ['fn, class, new', 'DripFunction, ...', 'later chapters'],
];

export default function ValueMap() {
  const top = 34;
  const rh = 36;
  return (
    <Svg w={400} h={top + ROWS.length * rh + 6} title="How each kind of Drip value is held by the TypeScript interpreter: none as null, booleans, numbers and strings as themselves, and lists, functions, classes and instances as objects of the interpreter's own classes.">
      <T x={70} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>DRIP</T>
      <T x={262} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>IN THE INTERPRETER</T>
      {ROWS.map(([d, h, note], i) => {
        const y = top + i * rh;
        const later = i >= 4;
        return (
          <g key={d} opacity={later ? 0.65 : 1}>
            <Box x={8} y={y - 13} w={124} h={26} dash={later} fill={tok('panel')} stroke={tok('ink', 0.4)}>
              <T x={70} y={y} size={12.5} mono anchor="middle">{d}</T>
            </Box>
            <Arrow x1={136} y1={y} x2={186} y2={y} color={tok('ink', 0.5)} />
            <Box x={190} y={y - 13} w={144} h={26} dash={later} fill={later ? tok('panel') : tok('brand', 0.12)} stroke={later ? tok('ink', 0.4) : tok('brand')}>
              <T x={262} y={y} size={12} mono anchor="middle">{h}</T>
            </Box>
            <T x={340} y={y - 6} size={11} fill={tok('muted')}>{note.split(' ')[0]}</T>
            <T x={340} y={y + 7} size={11} fill={tok('muted')}>{note.split(' ').slice(1).join(' ')}</T>
          </g>
        );
      })}
    </Svg>
  );
}
