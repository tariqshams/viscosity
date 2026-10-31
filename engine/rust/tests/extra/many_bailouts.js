const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
ps.push({ x: 1 }, { x: 2 });
ps.push(makeOne());
ps.foo = 1;
ps[0] = { x: 3 };
const other = ps;
const keep = { ps };
function makeOne() { return { x: 0 }; }
for (let i = 0; i < ps.length; i++) { ps[i].z = 1; console.log(ps[i].y); }
console.log(other === ps, keep.ps.length, ps.slice(0, 1));
