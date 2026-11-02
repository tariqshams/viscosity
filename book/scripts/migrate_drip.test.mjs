import { describe, expect, it } from 'vitest';
import { migrate, migrateOutput, diffLines, parseOld } from './migrate_drip.mjs';
import { run } from '../companion/ts/src/drip.ts';

const m = (src) => migrate(src).text;
/** Migrate, run with new Drip, and return its output lines. */
const runs = (src) => {
  const r = run(m(src));
  expect(r.stderr).toEqual([]);
  return r.stdout;
};

describe('migrate_drip: tokens', () => {
  it('turns // comments into # comments, outside strings', () => {
    expect(m('print 1; // one\n// two\nprint "a // b";')).toBe('print 1; # one\n# two\nprint "a // b";');
  });
  it('renames var, fun, nil, and, or, this', () => {
    expect(m('var x = nil;')).toBe('let x = none;');
    expect(m('fun f() { return true and false or nil; }')).toBe('fn f() { return true && false || none; }');
    expect(m('class A { m() { return this; } }')).toBe('class A { m() { return self; } }');
  });
  it('keeps let and fn, which old Drip already had', () => {
    expect(m('let a = 1;\nfn f(x) { return x; }')).toBe('let a = 1;\nfn f(x) { return x; }');
  });
  it('renames names that are keywords now', () => {
    expect(m('var new = 1; print new;')).toBe('let new_ = 1; print new_;');
    expect(m('var self = 1; var in = 2;')).toBe('let self_ = 1; let in_ = 2;');
  });
  it('keeps init as a method name and in super.init', () => {
    expect(m('class A { init() {} }')).toBe('class A { init() {} }');
    expect(m('class B < A { init() { super.init(); } }')).toBe('class B extends A { init() { super.init(); } }');
  });
  it('flags calls of init by name', () => {
    const r = migrate('class A { init() {} }\nvar a = A();\na.init();');
    expect(r.notes.join()).toMatch(/calls init by name/);
  });
});

describe('migrate_drip: statements', () => {
  it('drops the parentheses of if and while and adds braces', () => {
    expect(m('if (x) print 1;')).toBe('if x { print 1; }');
    expect(m('if (x) { print 1; } else print 2;')).toBe('if x { print 1; } else { print 2; }');
    expect(m('if (a) print 1; else if (b) print 2;')).toBe('if a { print 1; } else if b { print 2; }');
    expect(m('while (n > 0) n = n - 1;')).toBe('while n > 0 { n = n - 1; }');
    expect(m('if(x){ print 1; }')).toBe('if x { print 1; }');
  });
  it('puts the brace on the next line when the body was there', () => {
    expect(m('if (x)\n  print 1;')).toBe('if x {\n  print 1;\n}');
  });
  it('keeps a parenthesised part of a larger condition', () => {
    expect(m('if ((a) and b) print 1;')).toBe('if (a) && b { print 1; }');
  });
  it('writes class B < A as class B extends A', () => {
    expect(m('class A {}\nclass B < A {}')).toBe('class A {}\nclass B extends A {}');
  });
  it('adds new when calling a declared class', () => {
    expect(m('class P {}\nvar p = P();\nvar q = p.clone();\nprint P;')).toBe(
      'class P {}\nlet p = new P();\nlet q = p.clone();\nprint P;');
    expect(m('fun Make() {}\nMake();')).toBe('fn Make() {}\nMake();');
  });
});

describe('migrate_drip: for loops', () => {
  it('turns a counting loop into for ... in', () => {
    expect(m('for (var i = 0; i < 3; i = i + 1) print i;')).toBe('for i in 0..3 { print i; }');
    expect(m('for (var i = 1; i <= n; i = i + 1) { print i; }')).toBe('for i in 1..n + 1 { print i; }');
  });
  it('keeps a while loop when the loop is not a plain count', () => {
    expect(m('for (var p = 1; p < 100; p = p * 2) print p;')).toBe('let p = 1;\nwhile p < 100 {\n  print p;\n  p = p * 2;\n}');
    // assigning the variable in the body
    expect(m('for (var i = 0; i < 9; i = i + 1) { i = i + 1; }')).toMatch(/while i < 9/);
    // a bound that may change
    expect(m('for (var i = 0; i < o.n; i = i + 1) {}')).toMatch(/while i < o.n/);
  });
  it('gives the loop a block of its own inside a function', () => {
    const out = m('fun f() {\n  for (var p = 1; p < 9; p = p * 2) {\n    print p;\n  }\n}');
    expect(out).toBe('fn f() {\n  {\n    let p = 1;\n    while p < 9 {\n      print p;\n      p = p * 2;\n    }\n  }\n}');
  });
  it('handles missing clauses', () => {
    expect(m('var i = 0;\nfor (; i < 2;) i = i + 1;')).toBe('let i = 0;\nwhile i < 2 {\n  i = i + 1;\n}');
    expect(m('for (;;) { return; }')).toMatch(/^while true \{/);
  });
});

describe('migrate_drip: whole programs still work', () => {
  it('runs a migrated program with the same output', () => {
    const old = `// Shapes in old Drip.
class Shape {
  init(name) { this.name = name; }
  describe() { return this.name + " with area " + this.area(); }
}
class Square < Shape {
  init(side) { super.init("square"); this.side = side; }
  area() { return this.side * this.side; }
}
var shapes = nil;
var s = Square(3);
if (shapes == nil and s != nil) print s.area();
var total = 0;
for (var i = 1; i <= 4; i = i + 1) total = total + i;
print total;
fun count(n) {
  var out = 0;
  for (var k = n; k > 0; k = k - 1) { out = out + 1; }
  for (var k = 0; k < n; k = k + 1) { out = out + 1; }
  return out;
}
print count(3);`;
    expect(runs(old)).toEqual(['9', '10', '6']);
  });
  it('rewrites fragments token by token, and says so', () => {
    const r = migrate('1 + nil');
    expect(r.text).toBe('1 + none');
    expect(r.notes[0]).toMatch(/does not parse as old Drip/);
  });
  it('parses old Drip and finds its classes', () => {
    expect([...parseOld('class A {} class B < A {}').classes]).toEqual(['A', 'B']);
  });
});

describe('migrate_drip: output and diffs', () => {
  it('maps what printing changed', () => {
    expect(migrateOutput('nil\n3\nNaN\n-Infinity\n<fn f>')).toBe('none\n3\nnan\n-inf\nfn f');
  });
  it('diffs lines', () => {
    expect(diffLines(['a', 'b', 'c'], ['a', 'x', 'c'])).toEqual(['- b', '+ x']);
  });
});
