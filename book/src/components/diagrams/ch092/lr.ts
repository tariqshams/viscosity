// The SLR table for  (1) E → E + T  (2) E → T  (3) T → T * F
//                    (4) T → F      (5) F → n
// computed from the grammar's LR(0) states and FOLLOW sets.
export const PRODS: [string, string[]][] = [
  ["S'", ['E']], ['E', ['E', '+', 'T']], ['E', ['T']],
  ['T', ['T', '*', 'F']], ['T', ['F']], ['F', ['n']],
];
export const ACTION: Record<number, Record<string, string>> = {
  0: { n: 's4' },
  1: { '+': 's5', $: 'acc' },
  2: { '+': 'r2', '*': 's6', $: 'r2' },
  3: { '+': 'r4', '*': 'r4', $: 'r4' },
  4: { '+': 'r5', '*': 'r5', $: 'r5' },
  5: { n: 's4' },
  6: { n: 's4' },
  7: { '+': 'r1', '*': 's6', $: 'r1' },
  8: { '+': 'r3', '*': 'r3', $: 'r3' },
};
export const GOTO: Record<number, Record<string, number>> = {
  0: { E: 1, T: 2, F: 3 }, 5: { T: 7, F: 3 }, 6: { F: 8 },
};
export const rule = (k: number) => `${PRODS[k][0]} → ${PRODS[k][1].join(' ')}`;

export type Row = { states: number[]; syms: string[]; input: string[]; act: string };

/** Run the driver, recording every configuration. */
export function trace(tokens: string[]): Row[] {
  const input = [...tokens, '$'];
  const states = [0];
  const syms: string[] = [];
  const rows: Row[] = [];
  for (let guard = 0; guard < 100; guard++) {
    const a = input[0];
    const act = ACTION[states[states.length - 1]][a] ?? 'error';
    rows.push({ states: [...states], syms: [...syms], input: [...input], act });
    if (act === 'acc' || act === 'error') break;
    if (act[0] === 's') {
      states.push(Number(act.slice(1)));
      syms.push(input.shift()!);
    } else {
      const [head, body] = PRODS[Number(act.slice(1))];
      states.length -= body.length;
      syms.length -= body.length;
      syms.push(head);
      states.push(GOTO[states[states.length - 1]][head]);
    }
  }
  return rows;
}
