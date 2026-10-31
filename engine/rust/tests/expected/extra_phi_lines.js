let ps = [];
let qs = [];
for (let i = 0; i < 100; i++) { ps.push({ x: i }); qs.push({ x: -i }); }
let cur = ps[0];
if (Math.random() > 2) {
  cur = qs[0];
}
console.log(cur.x);
let el = qs[1];
for (let i = 0; i < qs.length; i++) { qs[i].x += 1; if (i > 1000) el = qs[2]; }
console.log(el.x);
