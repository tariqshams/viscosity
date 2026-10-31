// viscosity: ps=soa
// A parenthesized sequence value keeps its parentheses.
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, y: (i, i + 1) });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x + ps[i].y;
console.log(s);
