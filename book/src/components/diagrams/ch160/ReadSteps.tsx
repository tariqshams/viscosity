import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 160: read_profile in engine/rust/crates/cli/src/main.rs,
// rewrapped and shortened, on three profile files. The messages are the
// real ones both CLIs printed here for `explain sp.js --profile <file>`
// (rustc 1.97 release build; the TypeScript CLI printed the same line).
const CODE = `let json: Value = serde_json::from_str(&text)
    .map_err(|_| /* not valid JSON */)?;
let obj = json.as_object()
    .ok_or(/* must be a JSON object */)?;
obj.iter()
    .map(|(name, v)| match v.as_object()
        .and_then(|e| e.get("maxLength"))
        .and_then(Value::as_f64) {
        Some(n) if n.is_finite() && n >= 0.0
            => Ok((name.clone(), n)),
        _ => Err(/* the profile entry … */),
    })
    .collect()`;

type S = { line: number | null; file: string; rows: { name: string; got: string; ok: boolean | null }[]; result: string; ok?: boolean; note: string };

const STATES: S[] = [
  { line: 0, file: '{"ps": {"maxLength": 20}, "zz": {"maxLength": 3, "note": "x"}}', rows: [], result: '', note: 'A valid file. serde_json parses the text into a Value, a tree of JSON; a syntax error would stop here with “the profile … is not valid JSON”.' },
  { line: 2, file: '{"ps": {"maxLength": 20}, "zz": {"maxLength": 3, "note": "x"}}', rows: [], result: '', note: 'as_object gives Some(map) for a JSON object. For [1] it is None, and ok_or turns that into the error “the profile must be a JSON object”.' },
  { line: 8, file: '{"ps": {"maxLength": 20}, "zz": {"maxLength": 3, "note": "x"}}', rows: [{ name: 'ps', got: 'Some(20.0)', ok: true }, { name: 'zz', got: 'Some(3.0)', ok: true }], result: '', note: 'Each entry: is it an object, does it have maxLength, is that a number (as_f64)? Then the guard: finite and not negative. Other keys, like "note", are ignored.' },
  { line: 12, file: '{"ps": {"maxLength": 20}, "zz": {"maxLength": 3, "note": "x"}}', rows: [{ name: 'ps', got: 'Some(20.0)', ok: true }, { name: 'zz', got: 'Some(3.0)', ok: true }], result: 'Ok(HashMap { ps: 20, zz: 3 })', ok: true, note: 'Every entry was Ok, so collect builds the whole HashMap<String, f64>. zz names no collection of this program, and is simply never looked up.' },
  { line: 10, file: '{"ps": {"maxLength": 20}, "qs": 5}', rows: [{ name: 'ps', got: 'Some(20.0)', ok: true }, { name: 'qs', got: 'None', ok: false }], result: 'Err: the profile entry "qs" must be …', note: 'qs is a bare number, not an object, so the chain gives None and the match makes an Err. Collecting Results stops at the first Err: the whole file is refused.' },
  { line: 10, file: '{"ps": {"maxLength": "20"}}', rows: [{ name: 'ps', got: 'None', ok: false }], result: 'Err: the profile entry "ps" must be …', note: 'A string "20" is not a number, so as_f64 gives None. Before both CLIs shared this rule, Rust skipped such an entry and TypeScript compared "20" < 64 the way JavaScript does.' },
];

export default function ReadSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Reading a profile, entry by entry" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={126} title="The profile file, each entry's maxLength, and the result">
        <T x={6} y={12} size={11} mono fill={tok('muted')}>{st.file.length > 56 ? st.file.slice(0, 55) + '…' : st.file}</T>
        {st.rows.map((r, k) => (
          <g key={r.name}>
            <T x={6} y={34 + k * 20} size={11} mono weight={700}>{r.name}</T>
            <T x={50} y={34 + k * 20} size={11} mono>{r.got}</T>
            <T x={200} y={34 + k * 20} size={11} weight={700} fill={r.ok ? tok('safe') : tok('danger')}>{r.ok ? 'Ok' : 'Err'}</T>
          </g>
        ))}
        {st.result && (
          <Box x={4} y={88} w={392} h={30} fill={st.ok ? tok('safe', 0.12) : tok('danger', 0.12)} stroke={st.ok ? tok('safe') : tok('danger')}>
            <T x={12} y={103} size={11} mono>{st.result}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
