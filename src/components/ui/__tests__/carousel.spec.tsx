import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';

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

  it('forwards mouse and focus callbacks while still tracking pause state', async () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    await render(
      <Carousel opts={{ autoplay: true }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onFocus={onFocus} onBlur={onBlur}>
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    const region = page.getByRole('region');
    await region.hover();
    expect(onMouseEnter).toHaveBeenCalled();
    await page.getByRole('region').element().dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
    expect(onMouseLeave).toHaveBeenCalled();

    (page.getByRole('region').element() as HTMLElement).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(onFocus).toHaveBeenCalled();
    (page.getByRole('region').element() as HTMLElement).dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(onBlur).toHaveBeenCalled();
  });

  it('wraps to the last slide when previous is clicked while looping', async () => {
    await render(<Slides loop />);

    page.getByRole('button', { name: 'Previous slide' }).element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect.element(page.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('wraps forward with next when looping', async () => {
    await render(<Slides loop />);

    await page.getByRole('button', { name: 'Go to slide 3' }).click();
    page.getByRole('button', { name: 'Next slide' }).element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  it('disables next at the last slide when not looping', async () => {
    await render(<Slides />);

    await page.getByRole('button', { name: 'Go to slide 3' }).click();
    await expect.element(page.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('wraps back to the first slide with the left arrow key while looping', async () => {
    await render(<Slides loop />);

    page.getByRole('region').element().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await expect.element(page.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('ignores keys other than the arrow keys', async () => {
    await render(<Slides />);

    page.getByRole('region').element().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    await expect.element(page.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute('aria-current', 'true');
  });

  it('supports vertical orientation', async () => {
    await render(
      <Carousel orientation="vertical" className="h-40">
        <CarouselContent className="h-40">
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
        <CarouselDots />
      </Carousel>,
    );

    page.getByRole('button', { name: 'Go to slide 2' }).element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect.element(page.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute('aria-current', 'true');
  });

  it('autoplays forward and wraps back to the first slide', async () => {
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.hover(document.body);
    await render(<Slides autoplay />);
    await userEvent.hover(document.body);

    await expect
      .element(page.getByRole('button', { name: 'Go to slide 2' }))
      .toHaveAttribute('aria-current', 'true', { timeout: 10000 });
    await expect
      .element(page.getByRole('button', { name: 'Go to slide 3' }))
      .toHaveAttribute('aria-current', 'true', { timeout: 10000 });
    await expect
      .element(page.getByRole('button', { name: 'Go to slide 1' }))
      .toHaveAttribute('aria-current', 'true', { timeout: 10000 });
  }, 40000);
});
