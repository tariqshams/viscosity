// Ünïcödé before the collection: offsets are UTF-8 bytes in Rust, UTF-16 in JS. 😀
const label = 'héllo wörld 😀';
const ps = [];
for (let i = 0; i < 200; i++) ps.push({ x: i, name: 'é' + i });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x; // ✓ — done
console.log(label, s, ps[3].name, ' ');
