const ps = [];
let n = 0;
try {
  for (let i = 0; i < 100; i++) { ps.push({ x: i }); n = i; }
} catch ({ message }) {
  console.log(message);
} finally {
  n++;
}
for (let i = 0; i < ps.length; i++) ps[i].x = ps[i].x * 2 + n;
console.log(ps[99].x);
