/* @viscosity aosoa(4) */
const blocks = [];
// @viscosity aos
const plain = [];
const small = []; // @viscosity soa
// @viscosity aosoa(4)
const mixed = [];
for (let i = 0; i < 300; i++) { blocks.push({ x: i, y: 2 * i }); plain.push({ x: i }); small.push({ v: i }); mixed.push({ n: i, s: 's' + i }); }
let t = 0;
for (let i = 0; i < blocks.length; i++) { blocks[i].x += blocks[i].y; t += plain[i].x + small[i].v + mixed[i].n; }
console.log(t, blocks[17].x, blocks[299].y, small[0].v);
