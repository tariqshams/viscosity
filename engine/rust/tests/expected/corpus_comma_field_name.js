// viscosity: ps=aos
// A field named 'a,b' is not the fields a and b.
const ps = [];
for (let i = 0; i < 100; i++) { ps.push({ 'a,b': i }); ps.push({ a: i, b: 2 }); }
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].a;
console.log(s);
