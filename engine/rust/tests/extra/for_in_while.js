const ps = [];
let k = 0;
while (true) { if (k >= 200) break; ps.push({ x: k, y: -k }); k++; }
const o = { a: 1, b: 2 };
let keys = '';
for (const key in o) keys += key;
for (let i = 0; i < ps.length; i++) { ps[i].x += ps[i].y; ps[i].y = 0; }
let acc = 0;
for (let i = ps.length - 1; i >= 0; i--) acc += ps[i].x;
console.log(keys, acc);
