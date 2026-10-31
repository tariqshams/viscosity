const a = [];// @viscosity aosconst b = [];
const c = []; // @viscosity aos const d = [];
for (let i = 0; i < 300; i++) { a.push({ x: i }); b.push({ x: i }); c.push({ x: i }); d.push({ x: i }); }
let s = 0;
for (let i = 0; i < a.length; i++) s += a[i].x + b[i].x + c[i].x + d[i].x;
console.log(s);
