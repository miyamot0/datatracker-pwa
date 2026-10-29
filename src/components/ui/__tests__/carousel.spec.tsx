import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import '@/styles/globals.css';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselDots } from '../carousel';

function Slides({ loop = false, autoplay = false }: { loop?: boolean; autoplay?: boolean }) {
  return (
    <Carousel opts={{ loop, autoplay }}>
      <CarouselContent>
        <CarouselItem>One</CarouselItem>
        <CarouselItem>Two</CarouselItem>
        <CarouselItem>Three</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselDots />
    </Carousel>
  );
}

describe('Carousel', () => {
  it('renders a carousel region with slides', async () => {
    await render(<Slides />);

    await expect.element(page.getByRole('region')).toBeInTheDocument();
    await expect.element(page.getByRole('group').first()).toHaveAttribute('aria-roledescription', 'slide');
  });

  it('renders one dot per slide and marks the first as current', async () => {
    await render(<Slides />);

    const dots = page.getByRole('button', { name: /^Go to slide \d+$/ });
    await expect.element(dots).toHaveLength(3);
    await expect.element(page.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute('aria-current', 'true');
    await expect.element(page.getByRole('button', { name: 'Go to slide 2' })).not.toHaveAttribute('aria-current');
  });

  it('disables previous at the first slide when not looping', async () => {
    await render(<Slides />);

    await expect.element(page.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Next slide' })).toBeEnabled();
  });

  it('enables previous when looping so it can wrap', async () => {
    await render(<Slides loop />);

    await expect.element(page.getByRole('button', { name: 'Previous slide' })).toBeEnabled();
  });

  it('advances to the next slide when next is clicked', async () => {
    await render(<Slides />);

    await page.getByRole('button', { name: 'Next slide' }).click();
    await expect.element(page.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute('aria-current', 'true');
  });

  it('jumps to a slide when its dot is clicked', async () => {
    await render(<Slides />);

    await page.getByRole('button', { name: 'Go to slide 3' }).click();
    await expect.element(page.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('moves with arrow keys', async () => {
    await render(<Slides />);

    const region = page.getByRole('region');
    await region.click();
    await page.getByRole('region').element().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await expect.element(page.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute('aria-current', 'true');
  });
});
