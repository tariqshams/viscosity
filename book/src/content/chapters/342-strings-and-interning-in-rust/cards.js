// Chapter 342 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'si-hash-twice': {
    q: 'Where does drip-rs store a string’s hash?',
    a: 'Twice: in the `ObjString`, and in every `StrRef` handle to it, beside the `Gc<ObjString>`.',
  },
  'si-no-heap': {
    q: 'Why does it matter that `Table::set` doesn’t need the heap?',
    a: 'Tables live inside heap objects. `heap[instance].fields.set(...)` already borrows the heap mutably, so `set` could not also borrow the strings arena (E0502).',
  },
  'si-box-str': {
    q: 'Why is `ObjString::chars` a `Box<str>` rather than a `String`?',
    a: 'An interned string never grows, so it needs no capacity field: `Box<str>` is 16 bytes, `String` 24.',
  },
  'si-interner': {
    q: 'What does `Heap::intern(chars)` do?',
    a: 'Hashes the text, probes the `interned` table for a string with that hash and those characters, and returns it; if there is none, allocates one and adds it.',
  },
  'si-disjoint': {
    q: 'Why may `intern` call `self.interned.find_string(&self.strings, ...)`?',
    a: 'Inside the heap’s own method, rustc sees two different fields, `interned` and `strings`, and lets them be borrowed separately.',
  },
  'si-owned': {
    q: 'Why does `Vm::add` call `intern_owned(String)` for the result of `+`?',
    a: 'It hands over the string it just built, so the heap can keep that allocation. `intern(&str)` has to copy the text.',
  },
  'si-fnv': {
    q: 'What does `hash.wrapping_mul(16_777_619)` correspond to in the TypeScript VM?',
    a: '`Math.imul(h, 16777619)`: a 32-bit multiply that keeps the low 32 bits.',
  },
  'si-tombstone': {
    q: 'How does drip-rs’s table tell an empty slot from a tombstone?',
    a: 'Both have key `None`. An empty slot has value `Value::None`; a tombstone has `Value::Bool(true)`.',
  },
  'si-first-tomb': {
    q: 'Why does `find` use `tombstone.get_or_insert(index)`?',
    a: 'To remember the first tombstone passed. If the key turns out to be absent, `set` reuses that slot.',
  },
  'si-columns': {
    q: 'Measured on rustc 1.97 here, how big is a table slot as two columns, and as one pair?',
    a: '28 bytes as columns (12 for `Option<StrRef>` plus 16 for `Value`); 32 as `(Option<StrRef>, Value)`, because of padding.',
  },
};

export const examples = {
  'interning-drip': {
    lang: 'drip-vm',
    title: 'Equal text, one string',
    code: `let a = "drip";
let b = "dr" + "ip";
print a == b;
print str(4) + str(2) == "42";
print len("héllo");
let words = [a, b];
print words;`,
  },
};

export const exercises = {
  interner: {
    lang: 'rust',
    title: 'An interner',
    prompt: `Write \`intern\` for this small interner. It keeps each string's text in \`strings\` (the string's id is its index there) and finds strings again through \`keys\`, an open-addressing table of \`CAP\` slots.

1. Hash the characters with \`fnv\`.
2. Start at slot \`hash & (CAP - 1)\`. While the slot holds a \`StrRef\`, return it if it has the same hash *and* the same text. Otherwise step to the next slot, wrapping around.
3. At an empty slot the string is new: push its text, make a \`StrRef\` with the new id and the hash, store it in that slot, and return it.

Equal strings must get equal handles, and each string's text is stored once.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        let h = fnv(chars);
        let mask = CAP - 1;
        let mut i = h as usize & mask;
        loop {
            let Some(k) = self.keys[i]
            else {
                break; // an empty slot
            };
            if k.hash == h
                && self.str(k) == chars
            {
                return k;
            }
            i = (i + 1) & mask;
        }
        // Not found: slot i is empty.
        let id = self.strings.len();
        self.strings.push(chars.into());
        let s = StrRef {
            id: id as u32,
            hash: h,
        };
        self.keys[i] = Some(s);
        s
    }
}`,
    tests: `#[test]
fn equal_text_gives_one_handle() {
    let mut t = Interner::new();
    let a = t.intern("hello");
    let built = String::from("hel") + "lo";
    let b = t.intern(&built);
    assert_eq!(a, b);
}

#[test]
fn different_text_different_handles() {
    let mut t = Interner::new();
    let a = t.intern("x");
    let b = t.intern("y");
    assert_ne!(a, b);
}

#[test]
fn the_text_comes_back() {
    let mut t = Interner::new();
    let s = t.intern("drip");
    assert_eq!(t.str(s), "drip");
}

#[test]
fn the_handle_carries_the_hash() {
    let mut t = Interner::new();
    assert_eq!(t.intern("a").hash,
        0xe40c292c);
}

#[test]
fn each_string_is_stored_once() {
    let mut t = Interner::new();
    t.intern("x");
    t.intern("x");
    t.intern("x");
    assert_eq!(t.strings.len(), 1);
}

#[test]
fn survives_collisions() {
    let mut t = Interner::new();
    let names: Vec<String> = (0..100)
        .map(|i| format!("k{i}"))
        .collect();
    let first: Vec<StrRef> = names
        .iter()
        .map(|n| t.intern(n))
        .collect();
    for (n, s) in names.iter().zip(&first) {
        assert_eq!(t.intern(n), *s);
        assert_eq!(t.str(*s), n);
    }
    assert_eq!(t.strings.len(), 100);
}`,
    hints: [
      'The first slot is `h as usize & (CAP - 1)`. `CAP` is a power of two, so the mask is a cheap remainder that also wraps around the end.',
      'Loop with `let Some(k) = self.keys[i] else { break; };`. Compare `k.hash == h` first, and only then `self.str(k) == chars`; if either differs, step to `(i + 1) & mask`.',
      'After the loop, slot `i` is empty. The new id is `self.strings.len()`, taken before you push the text; store `Some(s)` in `self.keys[i]` and return `s`.',
    ],
    walkthrough: `**How to think about it.** This is \`Heap::intern\` and \`find_string\` folded into one loop. There are two outcomes: the string is already in the table (return its handle, store nothing), or it is not (store it once and hand out a new handle). An open-addressing table answers "is it here?" by walking from the hash's home slot until it either finds the string or reaches an empty slot; the empty slot is then exactly where the new string belongs. So write the probe loop first, and put the "new string" code after it.

**The solution, line by line.**

- \`let h = fnv(chars);\` hashes the text once.
- \`let mask = CAP - 1;\` and \`let mut i = h as usize & mask;\` give the home slot; with \`CAP\` = 256, \`& 255\` keeps the low 8 bits.
- \`loop {\` probes one slot per turn.
- \`let Some(k) = self.keys[i] else { break; };\` copies the slot out (\`Option<StrRef>\` is \`Copy\`, so this borrows nothing); an empty slot ends the probe.
- \`if k.hash == h && self.str(k) == chars { return k; }\` compares the cheap \`u32\` first, and the text only when the hashes match. Equal hashes do not prove equal strings, so the text check must stay.
- \`i = (i + 1) & mask;\` steps on, wrapping from slot 255 to 0.
- \`let id = self.strings.len();\` is the new string's id: the index it is about to get.
- \`self.strings.push(chars.into());\` stores the text once, as a \`Box<str>\`.
- \`let s = StrRef { id: id as u32, hash: h };\` makes the handle, carrying the hash as drip-rs's does.
- \`self.keys[i] = Some(s);\` records it in the empty slot the probe stopped at, and \`s\` is returned.

**Common wrong attempts.**

- Returning whatever is in the home slot when it is taken, without comparing: two different strings that share a slot then share a handle.
- On a collision, overwriting the slot instead of probing on: the string that was there can no longer be found, so interning it again makes a second copy, which the last test catches.
- Comparing only hashes: it passes small tests, but two different strings with equal hashes would become one.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        let h = fnv(chars);
        let mask = CAP - 1;
        let i = h as usize & mask;
        if let Some(k) = self.keys[i] {
            // Assume it is our string.
            return k;
        }
        let id = self.strings.len();
        self.strings.push(chars.into());
        let s = StrRef {
            id: id as u32,
            hash: h,
        };
        self.keys[i] = Some(s);
        s
    }
}`,
        why: 'A string whose slot is taken gets back whoever is there. Two different strings that share a slot then share a handle. Check the hash and the text, and probe on.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        let h = fnv(chars);
        let mask = CAP - 1;
        let i = h as usize & mask;
        if let Some(k) = self.keys[i] {
            if self.str(k) == chars {
                return k;
            }
        }
        // Take the slot anyway.
        let id = self.strings.len();
        self.strings.push(chars.into());
        let s = StrRef {
            id: id as u32,
            hash: h,
        };
        self.keys[i] = Some(s);
        s
    }
}`,
        why: 'On a collision it overwrites the slot instead of probing, so the string that was there can no longer be found, and interning it again makes a second copy.',
      },
    ],
  },
  tableFind: {
    optional: true,
    lang: 'rust',
    title: 'Find, with tombstones',
    prompt: `Write drip-rs's \`find\` for this fixed-size, two-column table. It returns the slot holding \`key\`, or, if \`key\` isn't there, the slot where \`set\` should put it.

- Start at \`key.hash & mask\`, and step \`(i + 1) & mask\`.
- A slot with key \`None\` and value \`Value::None\` is empty: the probe ends there.
- A slot with key \`None\` and value \`Bool(true)\` is a tombstone: keep probing, but remember the *first* one.
- If the probe ends without finding \`key\`, return the first tombstone, or the empty slot if there was none.

Keys are equal when the whole \`StrRef\` is equal, as with interned strings.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    let mut tomb = None;
    loop {
        let e = vals[i] == Value::None;
        match keys[i] {
            None if e => break,
            None => {
                tomb.get_or_insert(i);
            }
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i = (i + 1) & mask;
    }
    // Absent: reuse a tombstone if any.
    tomb.unwrap_or(i)
}`,
    tests: `// Keys with hand-picked hashes, so they
// collide on purpose.
fn k(id: u32, hash: u32) -> StrRef {
    StrRef { id, hash }
}

#[test]
fn colliding_keys_are_all_found() {
    let mut t = Table::new();
    t.set(k(1, 4), Value::Num(1.0));
    t.set(k(2, 4), Value::Num(2.0));
    t.set(k(3, 12), Value::Num(3.0));
    assert_eq!(t.get(k(1, 4)),
        Some(Value::Num(1.0)));
    assert_eq!(t.get(k(2, 4)),
        Some(Value::Num(2.0)));
    assert_eq!(t.get(k(3, 12)),
        Some(Value::Num(3.0)));
}

#[test]
fn a_missing_key_is_none() {
    let mut t = Table::new();
    t.set(k(1, 4), Value::Num(1.0));
    assert_eq!(t.get(k(9, 4)), None);
}

#[test]
fn probes_past_a_tombstone() {
    let mut t = Table::new();
    t.set(k(1, 4), Value::None);
    t.set(k(2, 4), Value::None);
    t.set(k(3, 4), Value::Num(3.0));
    t.delete(k(2, 4));
    assert_eq!(t.get(k(3, 4)),
        Some(Value::Num(3.0)));
}

#[test]
fn reuses_the_first_tombstone() {
    let mut t = Table::new();
    for id in 1..=4 {
        t.set(k(id, 4), Value::None);
    }
    t.delete(k(2, 4)); // slot 5
    t.delete(k(3, 4)); // slot 6
    t.set(k(9, 4), Value::Num(9.0));
    assert_eq!(t.keys[5], Some(k(9, 4)));
}

#[test]
fn wraps_around_the_end() {
    let mut t = Table::new();
    t.set(k(1, 7), Value::None);
    t.set(k(2, 7), Value::Num(2.0));
    assert_eq!(t.keys[0], Some(k(2, 7)));
    assert_eq!(t.get(k(2, 7)),
        Some(Value::Num(2.0)));
}`,
    hints: [
      'Keep `let mut tomb: Option<usize> = None;` outside the loop, and start at `key.hash as usize & mask`.',
      'Inside, `match keys[i]` with guards: `None if vals[i] == Value::None` ends the probe, a plain `None` is a tombstone, and `Some(k) if k == key` is the hit.',
      '`tomb.get_or_insert(i)` sets it only the first time. After the loop, return `tomb.unwrap_or(i)`.',
    ],
    walkthrough: `**How to think about it.** A probe has to tell three kinds of slot apart: a live key (is it ours?), an empty slot (the key is not here, stop), and a tombstone (someone was deleted here; the key might still be further on). Both empty slots and tombstones have key \`None\`, so the value column decides. And when the key is absent, \`set\` wants the best place to put it, which is the first reusable slot on the way.

**The solution, line by line.**

- \`let mask = keys.len() - 1;\` relies on the length being a power of two (8 here).
- \`let mut i = key.hash as usize; i &= mask;\` is the home slot.
- \`let mut tomb = None;\` will hold the first tombstone's index, if any.
- \`let e = vals[i] == Value::None;\` reads the value column once per slot: \`e\` says whether the value is \`none\`, as an empty slot's is.
- \`None if e => break,\` a truly empty slot: the key is absent.
- \`None => { tomb.get_or_insert(i); }\` a tombstone: remember it if it is the first, and keep probing.
- \`Some(k) if k == key => { return i; }\` found it; keys compare as whole \`StrRef\`s, as interned strings do.
- \`Some(_) => {}\` another key: keep probing.
- \`i = (i + 1) & mask;\` steps on, wrapping from 7 to 0.
- \`tomb.unwrap_or(i)\` after the loop returns the first tombstone if there was one, or the empty slot that ended the probe.

drip-rs's real \`find\` has exactly this shape, and takes the two columns as slices so that \`grow\` can call it on the new, empty columns while it reads entries from the old ones.

**Common wrong attempts.**

- Treating every \`None\` key as empty: a lookup stops at the first tombstone and misses keys placed after it (the \`probes_past_a_tombstone\` test).
- \`tomb = Some(i)\` at every tombstone: it remembers the last one passed, not the first, so \`set\` puts the key further from home.
- \`i += 1\` with no mask: a probe that starts near the end runs off the \`Vec\`, and indexing it panics.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    loop {
        match keys[i] {
            None => return i,
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i = (i + 1) & mask;
    }
}`,
        why: 'It treats every `None` key as empty, so a lookup stops at the first tombstone and misses keys placed after it.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    let mut tomb = None;
    loop {
        let e = vals[i] == Value::None;
        match keys[i] {
            None if e => break,
            None => tomb = Some(i),
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i = (i + 1) & mask;
    }
    // Absent: reuse a tombstone if any.
    tomb.unwrap_or(i)
}`,
        why: '`tomb = Some(i)` overwrites the remembered slot at every tombstone, so `set` uses the last one passed, not the first.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    let mut tomb = None;
    loop {
        let e = vals[i] == Value::None;
        match keys[i] {
            None if e => break,
            None => {
                tomb.get_or_insert(i);
            }
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i += 1;
    }
    // Absent: reuse a tombstone if any.
    tomb.unwrap_or(i)
}`,
        why: '`i += 1` never wraps. A probe that starts near the end runs off the `Vec`, and indexing it panics.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a drip-rs `StrRef` contain?',
    options: [
      { t: 'The string’s characters', why: 'The characters live in the `ObjString`, in the strings arena.' },
      { t: 'A `Gc<ObjString>` handle and the string’s 32-bit hash', correct: true, why: 'The hash rides along for free inside the 16-byte `Value`.' },
      { t: 'A `&str` borrowed from the source', why: 'That is a token’s lexeme. A Drip string value must outlive the source text.' },
      { t: 'An `Rc<str>`', why: 'drip-rs’s heap owns every object; values hold handles.' },
    ],
  },
  {
    q: 'Why doesn’t drip-rs’s `Table::get` take the heap as a parameter?',
    options: [
      { t: 'Tables are only used for globals', why: 'They are also every instance’s fields and every class’s methods, which is why it matters.' },
      { t: 'The key’s hash is in the `StrRef`, and interned keys compare by handle, so nothing in the heap is needed', correct: true, why: 'And so a table inside a heap object can be used while the heap is borrowed.' },
      { t: 'Rust forbids passing the heap to a method', why: 'It doesn’t, but it would conflict with `heap[instance]` borrowing the heap mutably.' },
    ],
  },
  {
    q: 'In `Heap::intern`, when does drip-rs compare characters?',
    options: [
      { t: 'For every slot it probes', why: 'Only slots whose stored hash equals the new string’s hash.' },
      { t: 'Never: equal hashes mean equal strings', why: 'Different strings can share a hash, so the text must be checked.' },
      { t: 'Only when a probed key’s hash matches, to rule out a collision', correct: true, why: '`key.hash == hash && &*strings[key.handle].chars == chars`.' },
      { t: 'Only when the table grows', why: 'Growing rehashes by the stored hashes, without reading text.' },
    ],
  },
  {
    q: 'A drip-rs table slot has key `None` and value `Value::Bool(true)`. What is it?',
    options: [
      { t: 'An empty slot', why: 'An empty slot has value `Value::None`.' },
      { t: 'A key whose value is `true`', why: 'A live entry always has `Some(key)`.' },
      { t: 'A tombstone: a deleted entry that probes must step past', correct: true, why: 'Lookups keep going; `set` may reuse it.' },
    ],
  },
  {
    q: 'After a collection whose roots never reach the string `"lost"`, what does `heap.intern("lost")` return?',
    options: [
      { t: 'The old `StrRef`, because the interned table keeps every string', why: 'The table holds its strings weakly: the collector deleted the entry.' },
      { t: 'A new `StrRef`, since the old string was freed and the table forgot it', correct: true, why: 'That is `gc.rs`’s own test: `assert_ne!(heap.intern("lost"), lost)`.' },
      { t: 'A panic: use after free', why: 'The table forgot the string before the sweep, so no stale handle is read.' },
      { t: '`None`', why: '`intern` always returns a `StrRef`; it makes one if need be.' },
    ],
  },
];
