// viscosity: ps=soa
// An index that is a sequence expression keeps its parentheses when it is
// moved into a bounds check or into a variable.
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
let k = 0;
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x;
s += ps[(k++, 7)].x;
const p = ps[(k++, 9)];
s += p.x;
for (let i = 0; i < ps.length; i++) ps[i].x *= 2;
console.log(s, k, ps[(k++, 3)].x, k);
