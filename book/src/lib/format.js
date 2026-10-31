// Turns values into text the way Node's console.log does (simplified), so
// what readers see in the browser matches what they'd see in a terminal:
//   console.log('hi')        -> hi
//   console.log([1, 'a'])    -> [ 1, 'a' ]
//   console.log({ x: 1 })    -> { x: 1 }

export function formatValue(v, depth = 0, seen = new Set()) {
  if (typeof v === 'string') return depth === 0 ? v : `'${v}'`;
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (typeof v === 'bigint') return `${v}n`;
  if (typeof v === 'boolean' || typeof v === 'symbol') return String(v);
  if (typeof v === 'function') return v.name ? `[Function: ${v.name}]` : '[Function (anonymous)]';
  if (seen.has(v)) return '[Circular]';
  if (depth > 3) return Array.isArray(v) ? '[Array]' : '[Object]';
  seen.add(v);
  try {
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]';
      const items = [];
      for (let i = 0; i < v.length; i++) items.push(i in v ? formatValue(v[i], depth + 1, seen) : '<empty>');
      return `[ ${items.join(', ')} ]`;
    }
    if (ArrayBuffer.isView(v) && !(v instanceof DataView)) {
      const name = v.constructor.name;
      return `${name}(${v.length}) [ ${Array.from(v).map((x) => formatValue(x, depth + 1, seen)).join(', ')} ]`;
    }
    if (v instanceof Map) {
      const items = [...v].map(([k, x]) => `${formatValue(k, depth + 1, seen)} => ${formatValue(x, depth + 1, seen)}`);
      return `Map(${v.size}) { ${items.join(', ')} }`.replace('{  }', '{}');
    }
    if (v instanceof Set) {
      const items = [...v].map((x) => formatValue(x, depth + 1, seen));
      return `Set(${v.size}) { ${items.join(', ')} }`.replace('{  }', '{}');
    }
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    const keys = Object.keys(v);
    const ctor = v.constructor && v.constructor !== Object ? `${v.constructor.name} ` : '';
    if (keys.length === 0) return `${ctor}{}`;
    const body = keys.map((k) => {
      const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`;
      return `${key}: ${formatValue(v[k], depth + 1, seen)}`;
    });
    return `${ctor}{ ${body.join(', ')} }`;
  } finally {
    seen.delete(v);
  }
}

export function formatArgs(args) {
  return args.map((a) => formatValue(a)).join(' ');
}
