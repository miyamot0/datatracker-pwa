import { createRef } from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import '@/styles/globals.css';
import { Badge, badgeVariants } from '../badge';
import { Separator } from '../separator';
import { Label } from '../label';
import { Textarea } from '../textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Badge', () => {
  it('renders its children with the default variant', async () => {
    await render(<Badge>Status</Badge>);
    await expect.element(page.getByText('Status')).toHaveClass('bg-primary');
  });

  it.each([
    ['secondary', 'bg-secondary'],
    ['destructive', 'bg-destructive'],
    ['outline', 'text-foreground'],
  ] as const)('applies the %s variant', async (variant, expectedClass) => {
    await render(<Badge variant={variant}>Tag</Badge>);
    await expect.element(page.getByText('Tag')).toHaveClass(expectedClass);
  });

  it('merges a custom className', async () => {
    await render(<Badge className="badge-x">Custom</Badge>);
    await expect.element(page.getByText('Custom')).toHaveClass('badge-x');
  });

  it('builds classes via badgeVariants', () => {
    expect(badgeVariants({ variant: 'outline' })).toContain('text-foreground');
  });
});

describe('Separator', () => {
  it('is decorative and horizontal by default', async () => {
    await render(<Separator />);
    const separator = document.querySelector('[data-orientation]') as HTMLElement;
    expect(separator.getAttribute('role')).toBe('none');
    expect(separator.getAttribute('data-orientation')).toBe('horizontal');
    expect(separator.getAttribute('aria-orientation')).toBeNull();
    await expect.element(page.getByRole('none')).toHaveClass('h-px');
  });

  it('exposes a separator role with vertical orientation when not decorative', async () => {
    await render(<Separator orientation="vertical" decorative={false} className="sep-x" />);
    const separator = page.getByRole('separator');
    await expect.element(separator).toHaveAttribute('aria-orientation', 'vertical');
    await expect.element(separator).toHaveClass('h-full');
    await expect.element(separator).toHaveClass('sep-x');
  });

  it('forwards refs', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Label', () => {
  it('associates its text with a control via htmlFor', async () => {
    await render(
      <>
        <Label htmlFor="name-input">Name</Label>
        <input id="name-input" />
      </>,
    );
    await expect.element(page.getByLabelText('Name')).toBeVisible();
  });

  it('merges custom classes and forwards refs', async () => {
    const ref = createRef<HTMLLabelElement>();
    await render(
      <Label ref={ref} className="label-x">
        Label text
      </Label>,
    );
    await expect.element(page.getByText('Label text')).toHaveClass('label-x');
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});

describe('Textarea', () => {
  it('renders a textarea with merged classes and forwards refs', async () => {
    const ref = createRef<HTMLTextAreaElement>();
    await render(<Textarea ref={ref} placeholder="Notes" className="area-x" />);
    const area = page.getByPlaceholder('Notes');
    await expect.element(area).toHaveClass('area-x');
    await expect.element(area).toHaveClass('min-h-[60px]');
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});

describe('Tabs', () => {
  function TabsFixture() {
    return (
      <Tabs defaultValue="one">
        <TabsList className="list-x">
          <TabsTrigger value="one">First</TabsTrigger>
          <TabsTrigger value="two">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two" className="panel-x">
          Second panel
        </TabsContent>
      </Tabs>
    );
  }

  it('shows the default tab panel', async () => {
    await render(<TabsFixture />);
    await expect.element(page.getByText('First panel')).toBeVisible();
    await expect.element(page.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches panels when another trigger is clicked', async () => {
    await render(<TabsFixture />);
    await page.getByRole('tab', { name: 'Second' }).click();
    await expect.element(page.getByText('Second panel')).toBeVisible();
    await expect.element(page.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true');
  });

  it('merges custom classes onto the list and content', async () => {
    await render(<TabsFixture />);
    await expect.element(page.getByRole('tablist')).toHaveClass('list-x');
    await page.getByRole('tab', { name: 'Second' }).click();
    await expect.element(page.getByText('Second panel')).toHaveClass('panel-x');
  });
});
