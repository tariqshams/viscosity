// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, name: 'p' + i });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x;
console.log(s, ps[5].name);
