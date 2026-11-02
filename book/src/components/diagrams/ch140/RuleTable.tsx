// Chapter 140: a few rows of drip-rs's parse-rule table, read off the two
// matches in book/companion/rust/src/compiler.rs: prefix_rule (TokenKind
// -> Option<Prefix>) and infix_precedence (TokenKind -> u8, with the
// PREC_* constants 0..9). None: no prefix rule; 0 is PREC_NONE.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, string, string][] = [
  ['(', 'Grouping', '9 CALL'],
  ['[', 'List', '9 CALL'],
  ['.', 'None', '9 CALL'],
  ['-', 'Unary', '6 TERM'],
  ['!', 'Unary', '0 NONE'],
  ['*', 'None', '7 FACTOR'],
  ['&&', 'None', '3 AND'],
  ['true', 'Literal(True)', '0 NONE'],
  ['identifier', 'Variable', '0 NONE'],
  ['fn', 'Fn', '0 NONE'],
  [';', 'None', '0 NONE'],
];

const X = [8, 112, 262];
const W = [100, 146, 130];

export default function RuleTable() {
  return (
    <Svg w={400} h={316} title="Rows of the table: each token's prefix rule and infix precedence">
      {['token', 'prefix_rule', 'infix_precedence'].map((h, k) => (
        <T key={h} x={X[k] + 4} y={12} size={12} weight={700} fill={k === 1 ? tok('brand') : k === 2 ? tok('accent') : tok('muted')}>{h}</T>
      ))}
      {ROWS.map((r, i) => {
        const y = 24 + i * 26;
        return (
          <g key={r[0]}>
            {r.map((cell, k) => {
              const empty = cell === 'None' || cell === '0 NONE';
              const fill = k === 0 ? tok('panel') : empty ? tok('panel') : k === 1 ? tok('brand', 0.12) : tok('accent', 0.12);
              const stroke = k === 0 || empty ? tok('line') : k === 1 ? tok('brand') : tok('accent');
              return (
                <Box key={k} x={X[k]} y={y} w={W[k]} h={22} r={3} fill={fill} stroke={stroke} dash={k > 0 && empty}>
                  <T x={X[k] + 7} y={y + 11} size={12} mono fill={empty && k > 0 ? tok('muted') : tok('ink')}>{cell}</T>
                </Box>
              );
            })}
          </g>
        );
      })}
    </Svg>
  );
}
