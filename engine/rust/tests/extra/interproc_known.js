const ps = [];
function add(v, w) { ps.push({ x: v, y: w }); }
for (let i = 0; i < 300; i++) add(i, i * 0.5);
function scale(arr, f) { for (let i = 0; i < arr.length; i++) { arr[i].x *= f; arr[i].y *= f; } }
scale(ps, 2);
scale(ps, 0.5);
const fn = scale;
function sum(arr) { let t = 0; for (const p of arr) t += p.x + p.y; return t; }
console.log(sum(ps), typeof fn);
