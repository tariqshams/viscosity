const ps = [];
for (let i = 0; i < 300; i++) ps.push({ x: i, y: 0 });
let mode = 2;
const g = () => mode;
outer: for (let k = 0; k < 3; k++) {
  for (let i = 0; i < ps.length; i++) {
    switch (g()) {
      case 1: ps[i].y += 1; break;
      case 2: ps[i].y += 2; continue;
      default: break outer;
    }
    if (i > 1000) continue outer;
  }
}
do { mode--; } while (mode > 0);
let total = 0;
for (let i = 0; i < ps.length; i++) total += ps[i].y;
console.log(total, mode);
