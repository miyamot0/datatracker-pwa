import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel">{children}</div>,
  CarouselContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="carousel-content">{children}</div>
  ),
  CarouselItem: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-item">{children}</div>,
  CarouselNext: () => <button data-testid="carousel-next">Next</button>,
  CarouselPrevious: () => <button data-testid="carousel-previous">Previous</button>,
}));

// ----- Import under test -----

import ImageCarousel from '../img-carousel';

// ----- Tests -----

describe('ImageCarousel', () => {
  it('renders without crashing', async () => {
    const { container } = await render(<ImageCarousel />);
    expect(container).not.toBeNull();
  });

  it('renders the Carousel wrapper', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByTestId('carousel')).toBeInTheDocument();
  });

  it('renders the CarouselContent', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByTestId('carousel-content')).toBeInTheDocument();
  });

  it('renders 6 CarouselItems', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByTestId('carousel-item').first()).toBeInTheDocument();
    const items = await page.getByTestId('carousel-item').all();
    expect(items).toHaveLength(6);
  });

  it('renders 6 img elements', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByRole('img').first()).toBeInTheDocument();
    const images = await page.getByRole('img').all();
    expect(images).toHaveLength(6);
  });

  it('each image src starts with img/', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByRole('img').first()).toBeInTheDocument();
    const images = await page.getByRole('img').all();
    for (const img of images) {
      const src = await img.element().getAttribute('src');
      expect(src?.startsWith('img/')).toBe(true);
    }
  });

  it('each image has a non-empty alt attribute', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByRole('img').first()).toBeInTheDocument();
    const images = await page.getByRole('img').all();
    for (const img of images) {
      const alt = await img.element().getAttribute('alt');
      expect(alt).not.toBe('');
    }
  });

  it('renders the CarouselPrevious button', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByTestId('carousel-previous')).toBeInTheDocument();
  });

  it('renders the CarouselNext button', async () => {
    await render(<ImageCarousel />);
    await expect.element(page.getByTestId('carousel-next')).toBeInTheDocument();
  });
});
