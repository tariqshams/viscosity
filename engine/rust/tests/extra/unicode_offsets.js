// Ünïcödé before the collection: offsets are UTF-8 bytes in Rust, UTF-16 in JS. 😀
/* U+2028 and U+2029 are line breaks, for line numbers: here and here. */
const label = 'héllo wörld 😀 𝒳';
const sep = 'a b c'; // legal in a string since ES2019, and a line break
const ps = [];
for (let i = 0; i < 200; i++) ps.push({ x: i, name: 'é' + i });
let s = 0;
for (let i = 0; i < ps.length; i++) { const t = '😀𝒳'; s += ps[i].x + t.length; } // ✓ — done
const qs = [];
for (let i = 0; i < 50; i++) qs.push({ y: i });
let u = 0;
for (let i = 0; i < qs.length; i++) u += qs[i].y;
const keep = [];
/* 😀 𝒳 é */ keep.push(qs[1]); // a refusal, for the code frame's columns
console.log(label, sep.length, s, u, keep[0].y, ps[3].name);
