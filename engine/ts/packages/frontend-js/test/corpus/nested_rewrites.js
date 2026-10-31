// viscosity: ps=soa, qs=soa, rs=soa
// Accesses to one collection inside a rewritten push, array literal or index
// of another: every rewrite must apply (they used to overlap and fail).
const qs = [];
for (let i = 0; i < 100; i++) qs.push({ y: i, k: (i * 7) % 100 });
const ps = [];
for (let i = 0; i < qs.length; i++) ps.push({ x: qs[i].y * 2 });
const rs = [{ z: qs[0].y }, { z: qs[1].k }];
for (let i = 2; i < 80; i++) rs.push({ z: (qs[i].y, i) });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[qs[i].k].x + rs[qs[i].k % rs.length].z;
for (let i = 0; i < ps.length; i++) ps[qs[i].k].x += qs[i].y;
console.log(s, ps[7].x, rs[3].z);
