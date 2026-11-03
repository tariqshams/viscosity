import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { PARTS } from '../../../data/outline/index.js';

// Chapter 167: the whole book, part by part, in its three sections (the
// Prelude, the 30-day Core and the Deep dives). Every part id, title,
// section, day range, chapter range, count and one-line summary comes from
// the outline (src/data/outline), so the map follows any renumbering, split
// or rewording; nothing about the parts is typed here.
type OutlinePart = { id: string; section: string; days: string; title: string; blurb: string; chapters: { n: number }[] };
const ALL = PARTS as OutlinePart[];
const first = (p: OutlinePart) => p.chapters[0].n;
const last = (p: OutlinePart) => p.chapters[p.chapters.length - 1].n;
const total = ALL.reduce((a, p) => a + p.chapters.length, 0);
const max = Math.max(...ALL.map((p) => p.chapters.length));

const SECTIONS: { key: string; name: string; colour: string }[] = [
  { key: 'prelude', name: 'Prelude', colour: 'f3' },
  { key: 'core', name: 'Core', colour: 'brand' },
  { key: 'deep', name: 'Deep dives', colour: 'accent' },
];
const colourOf = (s: string) => SECTIONS.find((x) => x.key === s)?.colour ?? 'muted';
const sectionLabel = (s: { key: string; name: string }) => {
  const ps = ALL.filter((p) => p.section === s.key);
  if (!ps.length) return '';
  const n = ps.reduce((a, p) => a + p.chapters.length, 0);
  const parts = ps.length === 1 ? `Part ${ps[0].id}` : `Parts ${ps[0].id}–${ps[ps.length - 1].id}`;
  return `${s.name}: ${parts}, ${n} chapters (${first(ps[0])}–${last(ps[ps.length - 1])})`;
};

const STATES = [
  { i: -1, note: `The whole book: ${total} chapters in ${ALL.length} parts. ${SECTIONS.map(sectionLabel).filter(Boolean).join('; ')}. Step through the parts.` },
  ...ALL.map((p, i) => ({ i, note: `Part ${p.id}, ${p.title} (chapters ${first(p)}–${last(p)}, ${p.chapters.length} chapters, days ${p.days} of its plan): ${p.blurb}` })),
];

export default function BookSteps() {
  const s = useSteps(STATES);
  const hi = s.state.i;
  const rowH = 17;
  const top = 24;
  const X = 52;
  const W = 280;
  return (
    <StepFrame title="The whole book, part by part" steps={s} note={s.state.note}>
      <Svg w={400} h={top + ALL.length * rowH + 22} title="Every part of the book as a bar whose length is its number of chapters, coloured by section: the Prelude, the Core and the Deep dives">
        {SECTIONS.map((sec, k) => (
          <g key={sec.key}>
            <rect x={8 + k * 120} y={4} width={10} height={10} rx={2} fill={tok(sec.colour)} />
            <T x={22 + k * 120} y={9} size={11}>{sec.name}</T>
          </g>
        ))}
        {ALL.map((p, i) => {
          const y = top + i * rowH;
          const on = hi === -1 || hi === i;
          const w = (p.chapters.length / max) * W;
          return (
            <g key={p.id} opacity={on ? 1 : 0.35}>
              <T x={8} y={y + 6} size={11} mono weight={hi === i ? 700 : undefined}>{p.id}</T>
              <rect x={X} y={y} width={w} height={12} rx={2} fill={tok(colourOf(p.section), hi === i ? 1 : 0.6)} />
              <T x={X + w + 4} y={y + 6} size={11} mono fill={tok('muted')}>{`${first(p)}–${last(p)}`}</T>
            </g>
          );
        })}
        <T x={8} y={top + ALL.length * rowH + 10} size={11} fill={tok('muted')}>{`bar length: chapters in the part (most: ${max})`}</T>
      </Svg>
    </StepFrame>
  );
}
