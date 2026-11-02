import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const BUILTIN = ['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError'];

/** The family of error kinds: built-in ones and your own, all kinds of Error, and what one object holds. */
export default function ErrorFamily() {
  return (
    <Svg w={400} h={250} title="Error at the top. Below it the built-in kinds TypeError, RangeError, ReferenceError and SyntaxError, and your own kind, ParseError, made with extends Error. On the right, one ParseError object with its name, message and pos.">
      <Box x={150} y={8} w={100} h={32} r={6} stroke={tok('ink', 0.6)} fill={tok('panel')}>
        <T x={200} y={24.5} size={13} mono weight={700} anchor="middle">Error</T>
      </Box>
      {BUILTIN.map((b, k) => {
        const x = 4 + k * 99;
        return (
          <g key={b}>
            <line x1={200} y1={40} x2={x + 46} y2={72} stroke={tok('ink', 0.35)} strokeWidth={1.5} />
            <Box x={x} y={72} w={92} h={30} r={5} stroke={tok('ink', 0.45)}>
              <T x={x + 46} y={87.5} size={11} weight={700} anchor="middle">{b}</T>
            </Box>
          </g>
        );
      })}
      <T x={8} y={118} size={11} fill={tok('muted')}>built in: JavaScript throws these itself</T>
      <line x1={200} y1={40} x2={64} y2={150} stroke={tok('brand')} strokeWidth={1.5} strokeDasharray="5 4" />
      <Box x={4} y={150} w={120} h={32} r={6} stroke={tok('brand')} fill={tok('brand', 0.12)}>
        <T x={64} y={166.5} size={12.5} mono weight={700} anchor="middle">ParseError</T>
      </Box>
      <T x={8} y={198} size={11} fill={tok('brand')}>yours: class ParseError</T>
      <T x={8} y={214} size={11} fill={tok('brand')}>extends Error</T>
      <Arrow x1={126} y1={166} x2={176} y2={166} width={1.5} color={tok('brand')} />
      <T x={182} y={136} size={11} weight={700} fill={tok('muted')}>ONE OBJECT: new ParseError(…)</T>
      <Box x={178} y={146} w={218} h={86} r={6} stroke={tok('brand')} fill={tok('panel')}>
        <T x={190} y={166} size={12} mono>name: 'ParseError'</T>
        <T x={190} y={188} size={12} mono>message: 'bad digit'</T>
        <T x={190} y={210} size={12} mono weight={700} fill={tok('brand')}>pos: 1</T>
      </Box>
      <T x={392} y={244} size={11} anchor="end" fill={tok('muted')}>name and message come from Error; pos is extra</T>
    </Svg>
  );
}
