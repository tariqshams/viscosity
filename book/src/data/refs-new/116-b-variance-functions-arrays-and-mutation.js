// New references for the second half of chapter 130 (staged split:
// variance). typescriptlang.org and docs.oracle.com were not reachable
// from this session; the TypeScript pages were read from their sources on
// raw.githubusercontent.com, and the Java behaviour from the OpenJDK
// source, both also run locally (tsc 5.9.3 in book/node_modules, OpenJDK
// 21.0.12).
export default [
  {
    id: 'ts-strict-function-types',
    authors: ['The TypeScript team (Microsoft) and contributors'],
    title: 'TSConfig Reference: strictFunctionTypes',
    venue: 'typescriptlang.org documentation',
    year: null,
    doi: null,
    url: 'https://www.typescriptlang.org/tsconfig/#strictFunctionTypes',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/tsconfig-reference/copy/en/options/strictFunctionTypes.md: “When enabled, this flag causes functions parameters to be checked more correctly”; the unsafe assignment of (x: string) => void to (ns: string | number) => void is an error with the flag on; and “the setting only applies to functions written in function syntax, not to those in method syntax”, with a Methodish example that is “Ultimately an unsafe assignment, but not detected”. Reproduced with tsc 5.9.3 --strict: a (d: Dog) => void into a property typed (a: Animal) => void is error TS2322, into a method typed handle(a: Animal): void it is accepted, and calling it with a plain animal throws “TypeError: d.bark is not a function”.',
    shaped: 'Chapter 130b and chapter 132b: contravariant checking of function-typed parameters under strict, and method parameters left bivariant.',
  },
  {
    id: 'ts-26-strict-function-types',
    authors: ['The TypeScript team (Microsoft)'],
    title: 'TypeScript 2.6 release notes: Strict function types',
    venue: 'typescriptlang.org documentation',
    year: 2017,
    doi: null,
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/release-notes/TypeScript%202.6.md, section “Strict function types”: the flag is part of the strict family; “function type parameter positions are checked contravariantly instead of bivariantly”; “The stricter checking applies to all function types, except those originating in method or constructor declarations. Methods are excluded specifically to ensure generic classes and interfaces (such as Array<T>) continue to mostly relate covariantly.” The year is that of the TypeScript 2.6 release, not stated on the page itself.',
    shaped: 'Chapter 130b: why TypeScript leaves method parameters bivariant, and its own use of the words covariant, contravariant and bivariant.',
  },
  {
    id: 'openjdk-arraystoreexception',
    authors: ['Oracle and the OpenJDK contributors'],
    title: 'java.lang.ArrayStoreException (OpenJDK 21 source and API documentation)',
    venue: 'github.com/openjdk/jdk21u',
    year: null,
    doi: null,
    url: 'https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/lang/ArrayStoreException.java',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/openjdk/jdk21u/master/src/java.base/share/classes/java/lang/ArrayStoreException.java, the class comment: “Thrown to indicate that an attempt has been made to store the wrong type of object into an array of objects. For example, the following code generates an ArrayStoreException: Object x[] = new String[3]; x[0] = Integer.valueOf(0);”. Reproduced with OpenJDK 21.0.12: String[] words = { "hi" }; Object[] things = words; things[0] = 42; compiles and throws “java.lang.ArrayStoreException: java.lang.Integer”. The same javac rejects Point p = new Pixel(); for two unrelated classes with the same fields: “incompatible types: Pixel cannot be converted to Point”.',
    shaped: 'Chapter 130b: Java’s covariant arrays and the run-time check on every store; chapter 130: the nominal-typing error message.',
  },
];
