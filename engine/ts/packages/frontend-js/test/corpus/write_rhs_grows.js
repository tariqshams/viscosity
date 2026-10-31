// viscosity: ps=soa, qs=aosoa
// A right-hand side that pushes can grow the container, which replaces its
// typed columns: the store must go into the new column, not the old one.
const ps = [];
for (let i = 0; i < 128; i++) ps.push({ x: i });
function more() { ps.push({ x: 0 }); return 1; }
for (let i = 0; i < ps.length; i++) ps[i].x += 1;
ps[3].x = (more(), 77);
ps[4].x += (more(), 1);
console.log(ps.length, ps[3].x, ps[4].x);
// @viscosity aosoa(4)
const qs = [];
for (let i = 0; i < 64; i++) qs.push({ a: i, b: -i });
function grow(arr, n) { for (let j = 0; j < n; j++) arr.push({ a: j, b: j }); return n; }
for (let i = 0; i < qs.length; i++) qs[i].b += qs[i].a;
qs[5].a = (grow(qs, 70), 9);
qs[6].b ||= (grow(qs, 1), 4);
qs[0].b ||= (grow(qs, 200), 4);
console.log(qs.length, qs[5].a, qs[6].b, qs[0].b);
