import { Box, Svg, T, tok } from '../../viz/svg';

const FIELDS: [string, string][] = [['x', 'f1'], ['y', 'f2'], ['vx', 'f3'], ['vy', 'f4']];
const VALUES = ['0', '0', '2', '1'];

/** An interface is a blank form; an object fits if it fills every line with the right kind of value. */
export default function ShapeMatch() {
  return (
    <Svg w={400} h={226} title="On the left, the interface Particle: a form with four lines, x, y, vx and vy, each labelled number. On the right, an object filling every line with a number, ticked. Below, reading p.vX fails because the form has no line called vX.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>THE INTERFACE (a blank form)</T>
      <Box x={4} y={24} w={176} h={140} r={6} stroke={tok('ink', 0.45)} dash>
        <T x={16} y={42} size={13} mono weight={700}>Particle</T>
        {FIELDS.map(([n, c], k) => (
          <g key={n}>
            <T x={16} y={68 + k * 26} size={13} mono weight={700} fill={tok(c)}>{n}</T>
            <T x={52} y={68 + k * 26} size={13} mono fill={tok('muted')}>: number</T>
          </g>
        ))}
      </Box>
      <T x={212} y={14} size={11} weight={700} fill={tok('muted')}>AN OBJECT (a filled-in form)</T>
      <Box x={208} y={24} w={188} h={140} r={6} stroke={tok('safe')} fill={tok('safe', 0.06)}>
        <T x={220} y={42} size={13} mono weight={700}>p</T>
        {FIELDS.map(([n, c], k) => (
          <g key={n}>
            <T x={220} y={68 + k * 26} size={13} mono weight={700} fill={tok(c)}>{n}</T>
            <T x={256} y={68 + k * 26} size={13} mono>: {VALUES[k]}</T>
            <T x={378} y={68 + k * 26} size={14} anchor="end" fill={tok('safe')}>✓</T>
          </g>
        ))}
      </Box>
      <Box x={4} y={178} w={392} h={40} r={6} stroke={tok('danger')} fill={tok('danger', 0.06)}>
        <T x={16} y={198.5} size={13} mono weight={700}>p.vX</T>
        <T x={66} y={198.5} size={13} fill={tok('danger')}>✗ there is no line called vX on this form</T>
      </Box>
    </Svg>
  );
}
