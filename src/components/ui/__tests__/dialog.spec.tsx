import { createRef } from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import '@/styles/globals.css';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog';

function DialogFixture() {
  return (
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader className="header-class">
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>Are you sure?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="footer-class">
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('stays closed until the trigger is clicked', async () => {
    await render(<DialogFixture />);
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with a title, description, and footer when triggered', async () => {
    await render(<DialogFixture />);
    await page.getByRole('button', { name: 'Open dialog' }).click();

    const dialog = page.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'Confirm action' })).toBeVisible();
    await expect.element(page.getByText('Are you sure?')).toBeVisible();
  });

  it('applies custom classes to header and footer', async () => {
    await render(<DialogFixture />);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect.element(page.getByRole('dialog')).toBeVisible();
    await expect.element(document.querySelector('.header-class') as HTMLElement).toBeVisible();
    await expect.element(document.querySelector('.footer-class') as HTMLElement).toBeVisible();
  });

  it('closes from the built-in close button', async () => {
    await render(<DialogFixture />);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes from a DialogClose button in the footer', async () => {
    await render(<DialogFixture />);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('forwards refs on the content element', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Dialog defaultOpen>
        <DialogContent ref={ref} className="content-class">
          <DialogTitle>Ref test</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await expect.element(page.getByRole('dialog')).toHaveClass('content-class');
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
