import { PARTS } from '../../../data/outline/index.js';

// Chapter 167: counts and chapter ranges for prose, read from the outline
// (src/data/outline), so the capstone never types a chapter number by hand
// and follows any renumbering or split.
//   k="total"          every chapter in the book
//   k="parts"          how many parts
//   k="part:III"       "chapters 57–71" for that part
//   k="n:III"          how many chapters that part has
//   k="section:core"   "Parts II–IX, chapters 48–167" for that section
//   k="sectionn:core"  how many chapters that section has
//   k="sectionp:core"  how many parts that section has
//   k="days:core"      the last day of that section's plan ("30")
type OutlinePart = { id: string; section: string; days: string; chapters: { n: number }[] };
const ALL = PARTS as OutlinePart[];
const first = (p: OutlinePart) => p.chapters[0].n;
const last = (p: OutlinePart) => p.chapters[p.chapters.length - 1].n;
const part = (id: string) => {
  const p = ALL.find((x) => x.id === id);
  if (!p) throw new Error(`Outline: no part ${id}`);
  return p;
};
const section = (s: string) => {
  const ps = ALL.filter((p) => p.section === s);
  if (!ps.length) throw new Error(`Outline: no section ${s}`);
  return ps;
};
const count = (ps: OutlinePart[]) => ps.reduce((a, p) => a + p.chapters.length, 0);

export function figure(k: string): string {
  const [what, arg] = k.split(':');
  switch (what) {
    case 'total': return String(count(ALL));
    case 'parts': return String(ALL.length);
    case 'part': { const p = part(arg); return `chapters ${first(p)}–${last(p)}`; }
    case 'n': return String(part(arg).chapters.length);
    case 'section': {
      const ps = section(arg);
      const range = ps.length === 1 ? `Part ${ps[0].id}` : `Parts ${ps[0].id}–${ps[ps.length - 1].id}`;
      return `${range}, chapters ${first(ps[0])}–${last(ps[ps.length - 1])}`;
    }
    case 'sectionn': return String(count(section(arg)));
    case 'sectionp': return String(section(arg).length);
    case 'days': { const ps = section(arg); return ps[ps.length - 1].days.split('–').pop()!; }
    default: throw new Error(`Outline: unknown figure ${k}`);
  }
}

export default function Outline({ k }: { k: string }) {
  return <span className="tabular-nums">{figure(k)}</span>;
}
