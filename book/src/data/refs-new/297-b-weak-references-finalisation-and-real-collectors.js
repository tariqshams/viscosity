// New references for staged chapter 300-b (second half of chapter 300).
// Checked 2026-11-02, all read raw from GitHub. The chapter also relies
// on go-runtime-gc (refs-new/296), hotspot-card-table and dotnet-gc-botr
// (refs-new/295), zgc-barrier (refs-new/325-b), v8-trash-talk and
// v8-concurrent-marking. Evidence produced in this session with Node
// v22.23.4 and --expose-gc: a WeakRef whose only strong reference was
// dropped read `big` when dereferenced in the same job after gc(), and
// `undefined` when gc() and deref() ran in a later timer task; a
// FinalizationRegistry held only in a top-level const never ran its
// callback (three runs at each of four timer delays, 0 to 100 ms), and
// the same program with `globalThis.keepReg = reg` printed “cleanup: big
// is gone” every time, after “after gc: undefined” and before the next
// timer's “end”. Collector lines quoted in the chapter come from the runs
// recorded in refs-new/295, 296 and 296-b, plus Node v22.23.4 --trace-gc
// (“Scavenge 18.3 (27.5) -> 11.9 (28.0) MB, … 4.46 / 0.00 ms”), OpenJDK
// 21.0.12 -XX:+UseG1GC -Xlog:gc (“Pause Young (Normal) (G1 Evacuation
// Pause) 79M->8M(128M) 7.871ms”) and Go 1.24.7 gctrace (“gc 120 @1.043s
// 8%: 0.024+9.9+0.058 ms clock, … 15->15->9 MB, 16 MB goal”).
export default [
  {
    id: 'mdn-weakref',
    authors: ['MDN contributors'],
    title: 'WeakRef',
    venue: 'MDN Web Docs; source files/en-us/web/javascript/reference/global_objects/weakref/index.md in github.com/mdn/content',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/mdn/content/main on 2026-11-02: a WeakRef does not keep its target alive; deref() returns the target or undefined once it has been reclaimed; “Avoid where possible”; and “If your code has just created a WeakRef for a target object, or has gotten a target object from a WeakRef’s deref method, that target object will not be reclaimed until the end of the current JavaScript job (including any promise reaction jobs that run at the end of a script job). That is, you can only ‘see’ an object get reclaimed between turns of the event loop.”',
    shaped: 'Chapter 300-b: WeakRef, deref, and the rule that a target lives until the end of the current job.',
  },
  {
    id: 'mdn-finalizationregistry',
    authors: ['MDN contributors'],
    title: 'FinalizationRegistry',
    venue: 'MDN Web Docs; source files/en-us/web/javascript/reference/global_objects/finalizationregistry/index.md in github.com/mdn/content',
    year: null,
    doi: null,
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/mdn/content/main on 2026-11-02: register(target, heldValue); the cleanup callback receives the held value; “Avoid where possible”; “A conforming JavaScript implementation, even one that does garbage collection, is not required to call cleanup callbacks. When and whether it does so is entirely down to the implementation … may be called then, or some time later, or not at all.”',
    shaped: 'Chapter 300-b: FinalizationRegistry and what it does not promise.',
  },
  {
    id: 'v8-weakrefs',
    authors: ['Sathya Gunasekaran', 'Mathias Bynens', 'Shu-yu Guo', 'Leszek Swirski'],
    title: 'Weak references and finalizers',
    venue: 'V8 feature explainer (v8.dev), 9 July 2019, updated 19 June 2020',
    year: 2019,
    doi: null,
    url: 'https://v8.dev/features/weak-references',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/v8/v8.dev/main/src/features/weak-references.md (the article’s source; v8.dev itself not opened): finalizer callbacks “Might not happen immediately after garbage collection”, “Might not happen in the same order as actual garbage collection”, “Might not happen at all, e.g. if the browser window is closed”; “A FinalizationRegistry is not kept alive by objects that are registered on it. If a registry is itself garbage-collected, its finalizer may not run.”; avoid placing important logic in a finalizer.',
    shaped: 'Chapter 300-b: why finalisation is fragile, and the registry that dies first.',
  },
  {
    id: 'java-object-finalize',
    authors: ['Oracle and/or its affiliates (OpenJDK)'],
    title: 'java.lang.Object.finalize (Object.java, OpenJDK 21)',
    venue: 'OpenJDK source, github.com/openjdk/jdk21u (master), src/java.base/share/classes/java/lang/Object.java',
    year: 2023,
    doi: null,
    url: 'https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/lang/Object.java',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw on 2026-11-02: `@Deprecated(since="9", forRemoval=true) protected void finalize() throws Throwable { }`, with the Javadoc “Finalization is deprecated and subject to removal in a future release. The use of finalization can lead to problems with security, performance, and reliability. See JEP 421 …”, recommending java.lang.ref.Cleaner and PhantomReference, or a close method with AutoCloseable and try-with-resources.',
    shaped: 'Chapter 300-b: Java’s deprecation of finalize and its suggested replacements.',
  },
];
