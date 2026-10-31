// viscosity: ps=aos
// @viscosity aosoa(6)
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x;
console.log(s);
