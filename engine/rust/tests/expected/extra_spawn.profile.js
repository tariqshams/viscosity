const ps = [];
function spawn(k) {
  for (let i = 0; i < k; i++)
    ps.push({ x: i, v: 1 });
}
spawn(10);
for (let i = 0; i < ps.length; i++)
  ps[i].x += ps[i].v;
console.log(ps[3].x);
