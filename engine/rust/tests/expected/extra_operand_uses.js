// Which operand of a store or index a collection (or an element) is.
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
const table = [10, 20, 30];
console.log(table[ps]);
table[ps] = 1;
const qs = [];
for (let i = 0; i < 100; i++) qs.push({ x: i });
for (let i = 0; i < qs.length; i++) { qs[i].x += 1; table[qs[i]] = 2; }
console.log(table[qs[3]]);
qs[4][0] = 5;
const rs = [];
for (let i = 0; i < 100; i++) rs.push({ x: i });
const holder = {};
holder.k = rs[1];
rs[2].x = rs[3].x;
console.log(holder.k.x, rs.length);
