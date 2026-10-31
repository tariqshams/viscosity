#!/usr/bin/env node
'use strict';

const ps = [];
for (let i = 0; i < 100; i++) ps.push({ a: i, b: i * 2 });
function sum(xs) { 'use strict'; let t = 0; for (const p of xs) t += p.a + p.b; return t; }
console.log(sum(ps));
