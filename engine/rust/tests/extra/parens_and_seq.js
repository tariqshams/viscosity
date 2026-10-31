const ps = [];
for (let i = 0; i < 100; i++) (ps).push({ x: (i), y: i + 1 });
let s = 0;
for (let i = 0; i < (ps.length); i++) s += (ps[i]).x + ((ps)[i].y);
let t = 0;
for (let i = 0; i < ps.length; i++) t = (t, t + ps[i].x);
console.log(s, t);
