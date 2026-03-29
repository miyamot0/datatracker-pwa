import React from 'react';
import { render, screen } from '@testing-library/react';
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
  it('renders without crashing', () => {
    const { container } = render(<ImageCarousel />);
    expect(container).not.toBeNull();
  });

  it('renders the Carousel wrapper', () => {
    render(<ImageCarousel />);
    expect(screen.getByTestId('carousel')).not.toBeNull();
  });

  it('renders the CarouselContent', () => {
    render(<ImageCarousel />);
    expect(screen.getByTestId('carousel-content')).not.toBeNull();
  });

  it('renders 6 CarouselItems', () => {
    render(<ImageCarousel />);
    expect(screen.getAllByTestId('carousel-item').length).toBe(6);
  });

  it('renders 6 img elements', () => {
    render(<ImageCarousel />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(6);
  });

  it('each image src starts with img/', () => {
    render(<ImageCarousel />);
    const images = screen.getAllByRole('img') as HTMLImageElement[];
    images.forEach((img) => {
      expect(img.getAttribute('src')?.startsWith('img/')).toBe(true);
    });
  });

  it('each image has a non-empty alt attribute', () => {
    render(<ImageCarousel />);
    const images = screen.getAllByRole('img') as HTMLImageElement[];
    images.forEach((img) => {
      expect(img.getAttribute('alt')).not.toBe('');
    });
  });

  it('renders the CarouselPrevious button', () => {
    render(<ImageCarousel />);
    expect(screen.getByTestId('carousel-previous')).not.toBeNull();
  });

  it('renders the CarouselNext button', () => {
    render(<ImageCarousel />);
    expect(screen.getByTestId('carousel-next')).not.toBeNull();
  });
});
