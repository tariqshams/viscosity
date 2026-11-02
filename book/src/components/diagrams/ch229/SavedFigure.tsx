// The 32 integer registers, coloured by who must preserve them across a
// call (RISC-V psABI, integer register convention table).
import { Box, Svg, T, tok } from '../../viz/svg';

type Kind = 'callee' | 'caller' | 'fixed';
const NAMES = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'];
const kind = (n: string): Kind => (n === 'zero' || n === 'gp' || n === 'tp' ? 'fixed' : n === 'sp' || /^s\d/.test(n) ? 'callee' : 'caller');
const FILL: Record<Kind, string> = { callee: 'f2', caller: 'f4', fixed: 'line' };

export default function SavedFigure() {
  return (
    <Svg w={400} h={210} title="RISC-V's 32 integer registers. Callee-saved: sp and s0 to s11. Caller-saved: ra, t0 to t6 and a0 to a7. Never changed: zero, gp and tp.">
      {NAMES.map((n, k) => {
        const col = k % 8;
        const row = Math.floor(k / 8);
        const kd = kind(n);
        return (
          <Box key={n} x={6 + col * 49} y={6 + row * 38} w={45} h={32} fill={tok(FILL[kd], kd === 'fixed' ? 0.5 : 0.25)} stroke={kd === 'fixed' ? tok('line') : tok(FILL[kd])}>
            <T x={28.5 + col * 49} y={17 + row * 38} size={12} mono anchor="middle" weight={700}>{n}</T>
            <T x={28.5 + col * 49} y={30 + row * 38} size={11} mono anchor="middle" fill={tok('muted')}>x{k}</T>
          </Box>
        );
      })}
      {([['callee', 'callee-saved: the callee must restore it'], ['caller', 'caller-saved: the callee may change it'], ['fixed', 'never changed by ordinary code']] as [Kind, string][]).map(([kd, t], k) => (
        <g key={kd}>
          <rect x={8} y={164 + k * 15} width={11} height={11} fill={tok(FILL[kd], kd === 'fixed' ? 0.5 : 0.25)} stroke={tok(FILL[kd])} />
          <T x={26} y={170 + k * 15} size={11}>{t}</T>
        </g>
      ))}
    </Svg>
  );
}
