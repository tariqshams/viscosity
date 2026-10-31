// viscosity: grid=soa
const grid = [];
for (let i = 0; i < 64 * 64; i++) grid.push({ h: (i * 37) % 11, t: 0 });
for (let step = 0; step < 4; step++) {
  for (let y = 1; y < 63; y++) {
    for (let x = 1; x < 63; x++) {
      const i = y * 64 + x;
      grid[i].t = (grid[i - 1].h + grid[i + 1].h + grid[i - 64].h + grid[i + 64].h) / 4;
    }
  }
  for (let i = 0; i < grid.length; i++) grid[i].h = grid[i].t;
}
let s = 0;
for (const c of grid) s += c.h;
console.log(s.toFixed(6));
