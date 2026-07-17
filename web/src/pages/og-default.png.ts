import { ImageResponse } from '@vercel/og';
import type { ReactElement } from 'react';

export const prerender = true;

export async function GET() {
  // See og/[slug].png.ts for why this cast is needed (non-JSX element tree
  // vs. @vercel/og's JSX-shaped TS types).
  const element = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0b0d12',
        color: '#f5f5f0',
        fontFamily: 'sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: 88, fontWeight: 700 },
            children: 'ImmoTrue',
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: 32, color: '#8a8f9c', marginTop: 16 },
            children: 'Wahrheit über jedes Inserat',
          },
        },
      ],
    },
  } as unknown as ReactElement;

  return new ImageResponse(element, { width: 1200, height: 630 });
}
