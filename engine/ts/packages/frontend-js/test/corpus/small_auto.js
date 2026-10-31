// viscosity: pts=aos
const pts = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
let sx = 0;
for (let i = 0; i < pts.length; i++) sx += pts[i].x;
console.log(sx);
