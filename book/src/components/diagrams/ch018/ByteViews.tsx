import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const buf = new ArrayBuffer(16);
const f64 = new Float64Array(buf);
const i32 = new Int32Array(buf);
f64[0] = 1;
i32[2] = 5;`;

type S = { line: number; bytes: number[]; f64?: string[]; i32?: string[]; changed: number[]; note: string };

const Z = Array(16).fill(0);
const B1 = [0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 0, 0];
const B2 = [0, 0, 0, 0, 0, 0, 240, 63, 5, 0, 0, 0, 0, 0, 0, 0];

const STATES: S[] = [
  { line: 0, bytes: Z, changed: [], note: 'new ArrayBuffer(16) is sixteen bytes, all zero. A buffer is raw storage with no meaning attached: you can’t read numbers out of it directly.' },
  { line: 1, bytes: Z, f64: ['0', '0'], changed: [], note: 'new Float64Array(buf) is a view: it reads the bytes in groups of 8, as two 64-bit floats. f64.length is 2.' },
  { line: 2, bytes: Z, f64: ['0', '0'], i32: ['0', '0', '0', '0'], changed: [], note: 'new Int32Array(buf) is a second view of the SAME sixteen bytes, cut into four 32-bit integers. Nothing was copied.' },
  { line: 3, bytes: B1, f64: ['1', '0'], i32: ['0', '1072693248', '0', '0'], changed: [6, 7], note: 'f64[0] = 1 writes the 8-byte float64 pattern for 1 into bytes 0–7. The i32 view sees those same bytes and now reads i32[1] as 1072693248.' },
  { line: 4, bytes: B2, f64: ['1', '2.5e-323'], i32: ['0', '1072693248', '5', '0'], changed: [8], note: 'i32[2] = 5 writes one integer into bytes 8–11. Through the f64 view, those bytes now read as 2.5e-323, a strange tiny float. Same bytes, two views, two meanings: aliasing again.' },
];

const CX = (k: number) => 8 + k * 24;

export default function ByteViews() {
  const s = useSteps(STATES);
  const st = s.state;
  const group = (name: string, vals: string[] | undefined, size: number, y: number, color: string) => (
    <g opacity={vals ? 1 : 0.25}>
      <T x={8} y={y - 10} size={12} mono weight={700} fill={vals ? tok(color) : tok('muted')}>{name}</T>
      {Array.from({ length: 16 / size }, (_, j) => {
        const x = CX(j * size);
        const w = size * 24 - 2;
        return (
          <Box key={j} x={x} y={y} w={w} h={28} fill={vals ? tok(color, 0.12) : 'transparent'} stroke={vals ? tok(color) : tok('line')} dash={!vals}>
            {vals && <T x={x + w / 2} y={y + 15} size={size === 4 ? 10.5 : 13} mono anchor="middle">{`[${j}] ${vals[j]}`}</T>}
          </Box>
        );
      })}
    </g>
  );
  return (
    <StepFrame title="Two views, one buffer" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={192} title="Sixteen bytes of an ArrayBuffer, with a Float64Array view of two 8-byte slots and an Int32Array view of four 4-byte slots over the same bytes">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE 16 BYTES (as Uint8 values, byte 0 on the left)</T>
        {st.bytes.map((b, k) => {
          const hot = st.changed.includes(k);
          return (
            <Box key={k} x={CX(k)} y={22} w={22} h={30} r={3} fill={hot ? tok('brand', 0.3) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.3)}>
              <T x={CX(k) + 11} y={37.5} size={b > 99 ? 9.5 : 11} mono anchor="middle" weight={hot ? 700 : 400}>{b}</T>
            </Box>
          );
        })}
        {group('f64 (8 bytes each)', st.f64, 8, 92, 'f1')}
        {group('i32 (4 bytes each)', st.i32, 4, 152, 'accent')}
      </Svg>
    </StepFrame>
  );
}
