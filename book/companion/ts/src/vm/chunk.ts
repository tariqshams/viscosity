// Bytecode chunks and Drip's instruction set (the book's chapters “Why bytecode?” to “Bytecode as data”).
//
// Operands follow the opcode byte:
//   k   a two-byte constant index (big-endian), so a function can hold
//       up to 65,536 constants
//   s   a one-byte stack slot, upvalue index or count
//   j   a two-byte jump distance
import type { Value } from './object.ts';

export const Op = {
  // values
  Const: 0,        // k     push constant k
  None: 1,         //       push none
  True: 2,
  False: 3,
  Pop: 4,          //       drop the top value
  Dup: 5,          //       a        -> a a
  Dup2: 6,         //       a b      -> a b a b
  List: 7,         // s     the top s values -> a new list of them
  // variables
  LoadLocal: 8,    // s
  StoreLocal: 9,   // s     (leaves the value on the stack)
  LoadGlobal: 10,  // k     k names the global
  DefineGlobal: 11,// k     pops the value
  StoreGlobal: 12, // k
  LoadUpvalue: 13, // s
  StoreUpvalue: 14,// s
  // properties and elements
  GetProp: 15,     // k     instance -> its field k, or method k bound to it
  SetProp: 16,     // k     instance value -> value
  GetSuper: 17,    // k     self superclass -> super's method k bound to self
  IndexGet: 18,    //       list index -> element
  IndexSet: 19,    //       list index value -> value
  // arithmetic and comparison
  Add: 20, Sub: 21, Mul: 22, Div: 23, Rem: 24,
  Eq: 25, Ne: 26, Lt: 27, Le: 28, Gt: 29, Ge: 30,
  Not: 31, Neg: 32,
  // statements and control flow
  Print: 33,
  Jump: 34,        // j     forward
  JumpUnless: 35,  // j     pops the condition; jumps if it is false
  JumpUnlessKeep: 36, // j  for &&: jumps if false, keeping the value
  JumpIfKeep: 37,  // j     for ||: jumps if true, keeping the value
  Loop: 38,        // j     backward
  // loops
  IterRange: 39,   //       start end: both must be numbers
  IterList: 40,    //       list: must be a list
  ListLen: 41,     //       list -> its length
  IncLocal: 42,    // s     add 1 to a number in a local slot
  // calls and functions
  Call: 43,        // s     callee args... -> result
  Invoke: 44,      // k s   receiver args... -> receiver.k(args)
  InvokeSuper: 45, // k s   self args... superclass -> super.k(args)
  New: 46,         // s     class args... -> new instance
  Closure: 47,     // k     then a (isLocal, index) byte pair per upvalue
  CloseUpvalue: 48,//       move the top local into its upvalue, then pop
  Return: 49,
  // classes
  Class: 50,       // k     push a new class named k
  Inherit: 51,     //       superclass class -> superclass (methods copied down)
  Method: 52,      // k     class closure -> class
} as const;

export type OpCode = (typeof Op)[keyof typeof Op];

/** The disassembler's name for each opcode: `load.local`, `jump.unless`... */
export const OP_NAMES: string[] = [];
for (const [k, v] of Object.entries(Op)) {
  OP_NAMES[v] = k.replace(/([a-z0-9])([A-Z])/g, '$1.$2').toLowerCase();
}

export class Chunk {
  code: number[] = [];
  /** the source line of each byte */
  lines: number[] = [];
  constants: Value[] = [];

  write(byte: number, line: number): void {
    this.code.push(byte);
    this.lines.push(line);
  }

  addConstant(v: Value): number {
    this.constants.push(v);
    return this.constants.length - 1;
  }
}
