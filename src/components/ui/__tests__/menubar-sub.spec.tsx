import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';

import '@/styles/globals.css';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../menubar';

describe('Menubar outside interactions', () => {
  it('switches to another menubar menu from its trigger instead of closing', async () => {
    await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New file</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'File' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'Undo' })).toBeVisible();
  });

  it('forwards outside pointer events and supports a callback ref on the content', async () => {
    const onPointerDownOutside = vi.fn();
    const nodes: (HTMLDivElement | null)[] = [];
    await render(
      <div>
        <p>Outside area</p>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent ref={(node) => nodes.push(node)} onPointerDownOutside={onPointerDownOutside}>
              <MenubarItem>New file</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>,
    );

    await page.getByRole('menuitem', { name: 'File' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();
    await page.getByText('Outside area').click();
    expect(onPointerDownOutside).toHaveBeenCalled();
    expect(nodes.some((node) => node instanceof HTMLDivElement)).toBe(true);
  });
});

describe('Menubar submenus', () => {
  it('applies the inset padding only when requested on a sub trigger', async () => {
    await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarPortal>
            <MenubarContent>
              <MenubarSub defaultOpen>
                <MenubarSubTrigger>Plain</MenubarSubTrigger>
                <MenubarSubContent className="sub-content-marker">
                  <div>Child</div>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const trigger = page.getByRole('menuitem', { name: 'Plain' });
    await expect.element(trigger).not.toHaveClass('pl-8');
  });

  it('renders inset sub triggers with the inset padding class', async () => {
    await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarPortal>
            <MenubarContent>
              <MenubarSub defaultOpen>
                <MenubarSubTrigger inset>Indented</MenubarSubTrigger>
                <MenubarSubContent>
                  <div>Child</div>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'Indented' })).toHaveClass('pl-8');
  });
});
