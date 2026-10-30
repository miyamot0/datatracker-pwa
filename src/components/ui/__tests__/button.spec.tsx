import { createRef } from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';

import '@/styles/globals.css';
import { Button, buttonVariants } from '../button';

describe('Button', () => {
  it('renders a native button with its label', async () => {
    await render(<Button>Save</Button>);
    await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('applies the default variant and size classes', async () => {
    await render(<Button>Default</Button>);
    await expect.element(page.getByRole('button', { name: 'Default' })).toHaveClass('bg-primary');
    await expect.element(page.getByRole('button', { name: 'Default' })).toHaveClass('h-10');
  });

  it.each([
    ['destructive', 'bg-destructive'],
    ['outline', 'border-input'],
    ['navigation', 'shadow-lg'],
    ['secondary', 'bg-secondary'],
    ['ghost', 'hover:bg-accent'],
    ['link', 'underline-offset-4'],
  ] as const)('applies the %s variant', async (variant, expectedClass) => {
    await render(<Button variant={variant}>Variant</Button>);
    await expect.element(page.getByRole('button', { name: 'Variant' })).toHaveClass(expectedClass);
  });

  it.each([
    ['sm', 'h-9'],
    ['lg', 'h-11'],
    ['icon', 'w-10'],
  ] as const)('applies the %s size', async (size, expectedClass) => {
    await render(<Button size={size}>Sized</Button>);
    await expect.element(page.getByRole('button', { name: 'Sized' })).toHaveClass(expectedClass);
  });

  it('merges a custom className with the variant classes', async () => {
    await render(<Button className="custom-class">Custom</Button>);
    const button = page.getByRole('button', { name: 'Custom' });
    await expect.element(button).toHaveClass('custom-class');
    await expect.element(button).toHaveClass('bg-primary');
  });

  it('forwards clicks to the onClick handler', async () => {
    const onClick = vi.fn();
    await render(<Button onClick={onClick}>Click me</Button>);
    await page.getByRole('button', { name: 'Click me' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forwards the ref to the underlying button element', async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Ref');
  });

  it('renders the child element instead of a button when asChild is set', async () => {
    await render(
      <Button asChild variant="link">
        <a href="#somewhere">Link child</a>
      </Button>,
    );
    const link = page.getByRole('link', { name: 'Link child' });
    await expect.element(link).toHaveAttribute('href', '#somewhere');
    await expect.element(link).toHaveClass('text-primary');
    expect(document.querySelector('button')).toBeNull();
  });

  it('builds the same classes from buttonVariants', () => {
    const classes = buttonVariants({ variant: 'ghost', size: 'sm', className: 'extra' });
    expect(classes).toContain('hover:bg-accent');
    expect(classes).toContain('h-9');
    expect(classes).toContain('extra');
  });
});
