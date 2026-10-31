// viscosity: pts=soa
// @viscosity soa
const pts = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: -0, y: NaN }];
let sx = 0;
for (let i = 0; i < pts.length; i++) sx += pts[i].x;
console.log(sx, Object.is(pts[2].x, -0), Number.isNaN(pts[2].y), pts.length);
