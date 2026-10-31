// viscosity: ps=aos, keep=aos
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
const keep = [];
for (let i = 0; i < ps.length; i++) keep.push(ps[i]);
keep[0].x = 42;
console.log(ps[0].x, keep[0] === ps[0]);
