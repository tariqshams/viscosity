const grid = [];
for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) grid.push({ h: x * y, t: 0 });
{
  function relax(g) { for (let i = 1; i < g.length - 1; i++) g[i].t = (g[i - 1].h + g[i + 1].h) / 2; }
  relax(grid);
}
var count = 0;
for (var i = 0; i < grid.length; i++) { grid[i].h = grid[i].t; count++; }
console.log(count, grid[17].h);
