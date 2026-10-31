// Code frames (explain --frames): tabs, non-ASCII text before the code,
// CRLF and U+2028 line breaks, spans over several lines, trailing blanks.
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, s: "é" });
const név = "ünïcödé 🎉"; const keep = [];
	for (let i = 0; i < ps.length; i++) {
		if (ps[i].x % 7 === 0) keep.push(ps[i]);   	
	}
const tag = "🎉🎉"; console.log(tag, keep.length, ps[5] === null, ps[3]
  .x, ps[
  4]);
let q = 0; q = ps.length; const qs = [];
for (let i = 0; i < 100; i++) qs.push({ v: i });
for (let i = 0; i < qs.length; i++) qs[i].v *= 2;
let tot = 0; for (let i = 0; i < qs.length; i++) tot += qs[i].v;
console.log(név, q, tot, typeof qs, [qs[0]].length);
