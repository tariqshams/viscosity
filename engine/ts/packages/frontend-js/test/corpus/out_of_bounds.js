// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ a: i });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].a;
console.log(s);
console.log(ps[7].a);
console.log(ps[100].a);
