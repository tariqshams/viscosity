const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
function* gen() { for (const p of ps) yield p.x; }
async function later() { await null; return ps[0].x; }
let s = 0;
for (const v of gen()) s += v;
for (let i = 0; i < ps.length; i++) ps[i].x++;
console.log(s, `t${ps[1].x}`, typeof later, this === undefined, (function () { return new.target === undefined; })());
