// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++)
  ps.push({ length: i, f0_: 2 });
let s = 0;
for (let i = 0; i < ps.length; i++)
  s += ps[i].length * 10 + ps[i].f0_;
console.log(s);
