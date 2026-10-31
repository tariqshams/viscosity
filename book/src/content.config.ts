import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One folder per chapter: src/content/chapters/NNN-slug/index.mdx, with
// cards.js (recall prompts, quiz, exercises, runnable examples) beside it.
const chapters = defineCollection({
  loader: glob({
    pattern: '*/index.mdx',
    base: './src/content/chapters',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    n: z.number().int().positive(),
    day: z.number().int().positive(),
    part: z.string(),
    title: z.string(),
    tagline: z.string(),
    objectives: z.array(z.string()).min(2),
    introduces: z.array(z.string()),
    uses: z.array(z.string()),
    sources: z.array(z.string()).min(1),
  }),
});

const front = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/front' }),
  schema: z.object({ title: z.string(), order: z.number() }),
});

export const collections = { chapters, front };
