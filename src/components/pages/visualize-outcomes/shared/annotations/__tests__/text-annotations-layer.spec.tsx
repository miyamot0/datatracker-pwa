import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { TextAnnotationsLayer } from '../text-annotations-layer';
import type { TextAnnotation } from '@/lib/graphing/series-style';

const data = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
];

const annotation = (overrides: Partial<TextAnnotation>): TextAnnotation => ({
  label: 'Note',
  x: 5,
  y: 5,
  anchor: 'middle-center',
  justify: 'center',
  ...overrides,
});

function AnnotatedChart({ annotations }: { annotations: TextAnnotation[] }) {
  return (
    <LineChart width={400} height={300} data={data}>
      <XAxis dataKey="x" type="number" domain={[0, 10]} />
      <YAxis domain={[0, 10]} />
      <Line dataKey="y" isAnimationActive={false} />
      <TextAnnotationsLayer annotations={annotations} />
    </LineChart>
  );
}

describe('TextAnnotationsLayer', () => {
  it('draws annotations that fall inside the plot area', async () => {
    await render(<AnnotatedChart annotations={[annotation({ label: 'Inside Mark' })]} />);

    await expect.element(page.getByText('Inside Mark')).toBeInTheDocument();
  });

  it('skips annotations whose coordinates fall outside the plot area', async () => {
    await render(
      <AnnotatedChart
        annotations={[
          annotation({ label: 'Beyond Right', x: 50 }),
          annotation({ label: 'Below Floor', y: -50 }),
          annotation({ label: 'Left Of Plot', x: -50 }),
          annotation({ label: 'Above Ceiling', y: 50 }),
          annotation({ label: 'Visible Mark' }),
        ]}
      />,
    );

    await expect.element(page.getByText('Visible Mark')).toBeInTheDocument();
    await expect.element(page.getByText('Beyond Right')).not.toBeInTheDocument();
    await expect.element(page.getByText('Below Floor')).not.toBeInTheDocument();
    await expect.element(page.getByText('Left Of Plot')).not.toBeInTheDocument();
    await expect.element(page.getByText('Above Ceiling')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no chart to take scales from', async () => {
    await render(<TextAnnotationsLayer annotations={[annotation({ label: 'Orphan' })]} />);

    await expect.element(page.getByText('Orphan')).not.toBeInTheDocument();
  });
});
