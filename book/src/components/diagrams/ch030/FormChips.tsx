import { Box, T, tok } from '../../viz/svg';
import { chipW, isNT, leftmost } from './grammar';

/** A sentential form drawn as chips: nonterminals in brand colour, the
 *  leftmost one (the next to be replaced) underlined. */
export default function FormChips({ form, y, x0 = 8 }: { form: string[]; y: number; x0?: number }) {
  const lm = leftmost(form);
  let x = x0;
  return (
    <g>
      {form.map((s, k) => {
        const w = chipW(s);
        const cx = x;
        x += w + 4;
        const nt = isNT(s);
        return (
          <g key={k}>
            <Box x={cx} y={y} w={w} h={28} r={nt ? 14 : 4} fill={nt ? tok('brand', 0.14) : tok('panel')} stroke={nt ? tok('brand') : tok('ink', 0.45)} dash={nt}>
              <T x={cx + w / 2} y={y + 14.5} size={12.5} mono anchor="middle" weight={nt ? 700 : 400} fill={nt ? tok('brand') : tok('ink')}>{s}</T>
            </Box>
            {k === lm && <rect x={cx + 3} y={y + 32} width={w - 6} height={3} rx={1.5} fill={tok('brand')} />}
          </g>
        );
      })}
    </g>
  );
}
