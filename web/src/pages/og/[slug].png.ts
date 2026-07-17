import { ImageResponse } from '@vercel/og';
import type { ReactElement } from 'react';
import { getCollection } from 'astro:content';

export const prerender = true;

const CATEGORY_LABELS: Record<string, string> = {
  guide: 'Ratgeber',
  market: 'Markt',
  legal: 'Recht',
  tips: 'Tipps',
};

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { title: post.data.title, category: post.data.category },
  }));
}

export async function GET({ props }: { props: { title: string; category: string } }) {
  const { title, category } = props;

  // @vercel/og's non-JSX form is a plain { type, props } tree (documented
  // alternative to JSX), but its TS types are written against JSX.Element
  // (which requires a `key`) — the runtime doesn't need one, so this is a
  // type-only mismatch, not a real bug.
  const element = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '80px',
        backgroundColor: '#0b0d12',
        color: '#f5f5f0',
        fontFamily: 'sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: 28, color: '#4a7fe8', textTransform: 'uppercase', letterSpacing: 4 },
            children: CATEGORY_LABELS[category] ?? category,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.25, marginTop: 24 },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: 32, color: '#8a8f9c' },
            children: 'ImmoTrue',
          },
        },
      ],
    },
  } as unknown as ReactElement;

  return new ImageResponse(element, { width: 1200, height: 630 });
}
