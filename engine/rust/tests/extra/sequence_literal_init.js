// A sequence value in an array literal keeps its parentheses in Name.of(...).
// @viscosity soa
const pts = [{ x: (1, 2), y: 3 }, { x: 4, y: (5, 6, 7) }];
let s = 0;
for (let i = 0; i < pts.length; i++) s += pts[i].x * 10 + pts[i].y;
console.log(s, pts[0].x, pts[1].y);
