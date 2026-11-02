import { PARTS } from '../../../data/outline/index.js';

// Chapter 458: counts and chapter ranges for prose, read from the outline
// (src/data/outline), so the capstone never types a chapter number by hand
// and follows any renumbering or split.
//   k="total"        every chapter in the book
//   k="parts"        how many parts
//   k="part:III"     "chapters 63–135" for that part
//   k="n:III"        how many chapters that part has
//   k="track:A"      "Parts I–X, chapters 1–328" for that track
//   k="trackn:A"     how many chapters that track has
type OutlinePart = { id: string; track: string; chapters: { n: number }[] };
const ALL = PARTS as OutlinePart[];
const first = (p: OutlinePart) => p.chapters[0].n;
const last = (p: OutlinePart) => p.chapters[p.chapters.length - 1].n;
const part = (id: string) => {
  const p = ALL.find((x) => x.id === id);
  if (!p) throw new Error(`Outline: no part ${id}`);
  return p;
};
const track = (t: string) => ALL.filter((p) => p.track === t);

export function figure(k: string): string {
  const [what, arg] = k.split(':');
  switch (what) {
    case 'total': return String(ALL.reduce((a, p) => a + p.chapters.length, 0));
    case 'parts': return String(ALL.length);
    case 'part': { const p = part(arg); return `chapters ${first(p)}–${last(p)}`; }
    case 'n': return String(part(arg).chapters.length);
    case 'track': {
      const ps = track(arg);
      return `Parts ${ps[0].id}–${ps[ps.length - 1].id}, chapters ${first(ps[0])}–${last(ps[ps.length - 1])}`;
    }
    case 'trackn': return String(track(arg).reduce((a, p) => a + p.chapters.length, 0));
    default: throw new Error(`Outline: unknown figure ${k}`);
  }
}

export default function Outline({ k }: { k: string }) {
  return <span className="tabular-nums">{figure(k)}</span>;
}
