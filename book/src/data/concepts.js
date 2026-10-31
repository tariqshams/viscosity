// The concept registry: every idea the book teaches, by id.
//
// Book rule: nothing is used before it has been introduced. Each chapter's
// frontmatter lists `introduces: [...]` and `uses: [...]` with ids from
// here, and scripts/check_chapters.mjs fails the build if a chapter uses a
// concept that no earlier chapter (or the reader's starting knowledge)
// introduced.

/** What the reader already knows on page one: "a little JavaScript". */
export const ASSUMED = {
  'variables': 'let and const: giving a value a name',
  'numbers': 'numbers and arithmetic (+ - * / %)',
  'strings': 'text in quotes, joined with +',
  'booleans': 'true and false',
  'comparison': '=== !== < > <= >=',
  'if': 'if / else',
  'for-loop': 'for (let i = 0; i < n; i++)',
  'console-log': 'console.log(...) to print',
};

/** Concepts the book introduces, in roughly the order it introduces them. */
export const CONCEPTS = {
  // Chapter 1: functions
  'function': 'a named, reusable piece of work',
  'parameter': 'a name a function gives to the value it is handed',
  'argument': 'the actual value passed in a call',
  'return': 'sending a value back out of a function',
  'call': 'running a function: name(args)',
  'local-variable': 'a variable that exists only inside one function call',
  'undefined': 'the value meaning "nothing was given or returned"',
  // Chapter 2: arrays
  'array': 'an ordered list of values in numbered slots',
  'index': 'a slot number, starting at 0',
  'length': 'how many slots an array has',
  'push': 'adding a value to the end of an array',
  'array-loop': 'visiting every slot with a for loop',
  // Chapter 3: objects
  'object': 'a value made of named parts',
  'property': 'one named part of an object (a key and its value)',
  'dot-access': 'reading or writing obj.name',
  'bracket-access': "reading or writing obj['name'] with a computed key",
  'array-of-objects': 'a list of records: the AoS (array of structs) shape',
  // Chapter 4: references
  'reference': 'a variable holds an arrow to an object, not the object itself',
  'aliasing': 'two names pointing at the same object',
  'identity': '=== on objects compares arrows, not contents',
  'mutation': 'changing an object in place',
  'copy-spread': 'making a new object with {...obj}',
};

export function isKnown(id) {
  return id in ASSUMED || id in CONCEPTS;
}
