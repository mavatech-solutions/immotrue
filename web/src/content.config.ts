import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    category: z.enum(['guide', 'market', 'legal', 'tips']),
    tags: z.array(z.string()),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = { blog };
