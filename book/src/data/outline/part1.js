// Part I: JavaScript for engine builders (days 1–6).
// Each chapter lists the concepts it introduces: { id: description }.
// The concept registry (../concepts.js) is built from these files.
export default {
  id: 'I', track: 'A', days: '1–7', title: 'JavaScript for engine builders',
  blurb: 'Functions, arrays, objects, references, closures, classes, strings, errors, modules, TypeScript, testing, and the raw bytes behind typed arrays.',
  chapters: [
    { n: 1, title: 'Functions: naming a piece of work', introduces: {
      function: 'a named, reusable piece of work',
      parameter: 'a name a function gives to the value it is handed',
      argument: 'the actual value passed in a call',
      return: 'sending a value back out of a function',
      call: 'running a function: name(args)',
    } },
    { n: 2, title: 'What a call leaves behind: undefined and local variables', introduces: {
      undefined: 'the value meaning "nothing was given or returned"',
      'local-variable': 'a variable that exists only inside one function call',
    } },
    { n: 3, title: 'Arrays: a row of numbered boxes', introduces: {
      array: 'an ordered list of values in numbered slots',
      index: 'a slot number, starting at 0',
      length: 'how many slots an array has',
      push: 'adding a value to the end of an array',
    } },
    { n: 4, title: 'Visiting every slot: the array loop', introduces: {
      'array-loop': 'visiting every slot with a for loop',
    } },
    { n: 5, title: 'Objects: things with named parts', introduces: {
      object: 'a value made of named parts', property: 'one named part of an object (a key and its value)',
      'dot-access': 'reading or writing obj.name', 'bracket-access': "reading or writing obj['name'] with a computed key",
      'array-of-objects': 'a list of records: the AoS (array of structs) shape' } },
    { n: 6, title: 'References: two names, one object', introduces: {
      reference: 'a variable holds an arrow to an object, not the object itself', aliasing: 'two names pointing at the same object',
      identity: '=== on objects compares arrows, not contents', mutation: 'changing an object in place',
      'copy-spread': 'making a new object with {...obj}' } },
    { n: 7, title: 'Functions as values', introduces: {
      'first-class-function': 'functions are values: stored, passed and returned like numbers', callback: 'a function handed to another function to call later',
      'arrow-function': 'the short (x) => x * 2 syntax', 'higher-order-function': 'a function that takes or returns functions',
      'map-filter-reduce': 'the array methods map, filter and reduce', 'while-loop': 'while (cond) { ... } and break/continue' } },
    { n: 8, title: 'Closures: functions that remember', introduces: {
      scope: 'the region of code where a name is visible', 'block-scope': 'let/const are visible only inside their { } block',
      'lexical-scope': 'a function sees the names around where it was written', closure: 'a function bundled with the variables it captured',
      'nested-function': 'a function defined inside another function' } },
    { n: 9, title: 'Classes, methods and this', introduces: {
      class: 'a blueprint for making objects of the same shape', constructor: 'the function that sets up a new instance',
      instance: 'one object made from a class', this: 'the object a method was called on', method: 'a function stored on an object or class',
      new: 'the new keyword that creates an instance', 'instanceof': 'checking which class made an object' } },
    { n: 10, title: 'Map and Set', introduces: {
      map: 'a Map: key → value lookup for any key type', set: 'a Set: a collection of unique values',
      'hash-intuition': 'how lookups can be fast without searching (intuition only)', 'for-of': 'for (const x of collection) loops' } },
    { n: 11, title: 'Recursion and the call stack', introduces: {
      recursion: 'a function that calls itself on a smaller problem', 'base-case': 'the case a recursive function answers directly',
      'call-stack': 'the stack of active calls, one frame per call', tree: 'data made of nodes that contain child nodes',
      'stack-overflow': 'running out of call-stack space' } },
    { n: 12, title: 'Strings up close', introduces: {
      'string-index': 'reading one character: str[i] and length', 'char-code': 'characters are numbers: charCodeAt and fromCharCode',
      'string-methods': 'slice, includes, startsWith, split, join', 'template-literal': '`backtick strings with ${expressions}`',
      'string-building': 'building strings piece by piece' } },
    { n: 13, title: 'Errors and exceptions', introduces: {
      throw: 'throw new Error(...) to signal a problem', 'try-catch': 'try { } catch (e) { } finally { }',
      'error-object': 'Error objects: name, message, custom error classes', 'error-propagation': 'how a thrown error unwinds the call stack' } },
    { n: 14, title: 'Modules: import and export', introduces: {
      module: 'a file that keeps its names private unless exported', 'import-export': 'export and import between files',
      'program-structure': 'splitting a program into modules with clear jobs' } },
    { n: 15, title: 'TypeScript I: types as labels', introduces: {
      typescript: 'JavaScript plus a type checker', 'type-annotation': 'x: number, labelling what a value may be',
      'type-checking': 'catching mistakes before the program runs', interface: 'describing the shape of an object',
      'type-erasure': 'types are removed before the code runs',
      typeof: 'typeof x: asking a value what kind it is at run time' } },
    { n: 16, title: 'TypeScript II: unions, narrowing and generics', introduces: {
      'union-type': 'A | B: a value that may be one of several types', narrowing: 'TypeScript learning a more exact type from a check',
      'discriminated-union': 'unions tagged by a kind field: the shape of every AST', generic: 'types with type parameters: Array<T>',
      'exhaustiveness': 'making the compiler prove every case is handled' } },
    { n: 17, title: 'Testing your code', introduces: {
      test: 'code that checks other code', assertion: 'a statement that must be true, e.g. expect(x).toBe(3)',
      'edge-case': 'unusual inputs: empty, zero, negative, huge', 'differential-testing-intro': 'checking two implementations agree' } },
    { n: 18, title: 'Bits, bytes and typed arrays', introduces: {
      binary: 'numbers written in base 2', bit: 'a single 0 or 1', byte: '8 bits', 'bit-ops': '& | ^ << >> >>>',
      arraybuffer: 'a raw block of bytes', 'typed-array': 'Float64Array, Int32Array, ... views over an ArrayBuffer',
      'float64': 'a 64-bit floating-point number, what every JS number is' } },
    { n: 19, title: 'TypeScript III: generics in depth', introduces: {
      'generic-constraint': 'limiting a type parameter with extends',
      'generic-inference': 'TypeScript working out type arguments from the call',
      'generic-default': 'a type parameter with a fallback type',
    } },
    { n: 20, title: 'TypeScript IV: computing with types', introduces: {
      keyof: 'the union of an object type’s keys',
      'indexed-access-type': 'T[K]: the type of one property',
      'mapped-type': '{ [K in keyof T]: ... }: a type built key by key',
      'conditional-type': 'T extends U ? X : Y',
      'template-literal-type': 'string types built from patterns',
      'utility-types': 'Partial, Pick, Omit, Record and friends',
    } },
    { n: 21, title: 'Iterators and generators', introduces: {
      'iterator-protocol': 'next() returning { value, done }',
      generator: 'a function* that can pause',
      yield: 'pausing a generator and handing out a value',
      'lazy-sequence': 'values produced only when asked for',
    } },
    { n: 22, title: 'Asynchronous code: promises and the event loop', introduces: {
      promise: 'a value that will be ready later',
      'async-await': 'writing promise code as if it were sequential',
      'event-loop': 'the loop that runs callbacks one at a time',
      microtask: 'the queue promise callbacks wait in',
    } },
    { n: 23, title: 'The toolchain: tsconfig, modules and npm', introduces: {
      tsconfig: 'the file that configures the TypeScript compiler',
      'strict-mode-ts': 'the strict compiler options and why to turn them on',
      'package-json': 'a package’s name, version, scripts and dependencies',
      bundler: 'a tool that joins modules into files to ship',
    } },
    { n: 24, title: 'Designing with types', introduces: {
      'type-driven-design': 'choosing types first so the code follows',
      'branded-type': 'a nominal tag on a structural type',
      'illegal-states-unrepresentable': 'types that make wrong data impossible to build',
    } },
    { n: 25, title: 'Checkpoint: a JSON parser in TypeScript', introduces: {
      json: 'the JSON data format',
      'checkpoint-ts': 'a whole TypeScript program, written without the book’s scaffolding',
    } },
  ],
};
