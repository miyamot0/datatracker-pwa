import '@/styles/globals.css';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { VisualsMenubar } from '../visuals-menubar';
import { EMPTY_SERIES_STYLES } from '@/lib/graphing/series-style';
import type { ToggleDisplayCondition, ToggleDisplayKey } from '@/types/visuals';

const keys: ToggleDisplayKey[] = [
  { KeyName: 'a', KeyCode: 1, KeyDescription: 'Key A', KeyType: 'Observed', Visible: true },
  { KeyName: 'b', KeyCode: 2, KeyDescription: 'Key B', KeyType: 'Derived', Visible: false },
];

const conditions: ToggleDisplayCondition[] = [
  { Condition: 'Baseline', Visible: true },
  { Condition: 'Treatment', Visible: true },
];

function renderMenubar(overrides: Partial<React.ComponentProps<typeof VisualsMenubar>> = {}) {
  const props = {
    page: 'rate' as const,
    keys,
    onKeyVisibilityChange: vi.fn(),
    conditions,
    onConditionVisibilityChange: vi.fn(),
    styleConditions: ['Baseline', 'Treatment'],
    visibleStyleConditions: ['Baseline', 'Treatment'],
    styles: EMPTY_SERIES_STYLES,
    onStylesChange: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<VisualsMenubar {...props} />) };
}

describe('VisualsMenubar', () => {
  it('renders Keys, Conditions, and Annotations menus', async () => {
    renderMenubar();

    await expect.element(page.getByRole('menuitem', { name: 'Keys' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Conditions' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Annotations' })).toBeInTheDocument();
  });

  it('reports a key toggled off from the Keys menu and keeps the menu open', async () => {
    const onKeyVisibilityChange = vi.fn();
    renderMenubar({ onKeyVisibilityChange });

    await page.getByRole('menuitem', { name: 'Keys' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Key A' }).click();

    expect(onKeyVisibilityChange).toHaveBeenCalledWith('Key A', false);
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Key B' })).toBeInTheDocument();
  });

  it('reports a condition toggled on from the Conditions menu', async () => {
    const onConditionVisibilityChange = vi.fn();
    renderMenubar({
      onConditionVisibilityChange,
      conditions: [
        { Condition: 'Baseline', Visible: true },
        { Condition: 'Treatment', Visible: false },
      ],
    });

    await page.getByRole('menuitem', { name: 'Conditions' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Treatment' }).click();

    expect(onConditionVisibilityChange).toHaveBeenCalledWith('Treatment', true);
  });

  it('opens the Aim Lines dialog from the Annotations menu', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Annotations' }).click();
    await page.getByRole('menuitem', { name: 'Aim Lines' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Aim Lines' })).toBeInTheDocument();
  });

  it('switches from an open menu to another menu on click', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Keys' }).click();
    await page.getByRole('menuitem', { name: 'Conditions' }).click();

    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Treatment' })).toBeInTheDocument();
  });

  it('switches to another menu on hover while a menu is open', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Keys' }).click();
    await page.getByRole('menuitem', { name: 'Conditions' }).hover();

    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Treatment' })).toBeInTheDocument();
  });

  it('closes the open menu when its own trigger is clicked again', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Keys' }).click();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Key A' })).toBeInTheDocument();
    await page.getByRole('menuitem', { name: 'Keys' }).click();

    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Key A' })).not.toBeInTheDocument();
  });
});

describe('VisualsMenubar item hover', () => {
  it('highlights a menubar trigger on hover before any menu is open', async () => {
    renderMenubar();

    const trigger = page.getByRole('menuitem', { name: 'Keys' });
    await expect.element(trigger).toBeInTheDocument();
    const before = getComputedStyle(trigger.element()).backgroundColor;
    await trigger.hover();

    expect(getComputedStyle(trigger.element()).backgroundColor).not.toBe(before);
  });

  it('highlights a menu item on hover', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Keys' }).click();
    const item = page.getByRole('menuitemcheckbox', { name: 'Key A' });
    const before = getComputedStyle(item.element()).backgroundColor;
    await item.hover();

    expect(getComputedStyle(item.element()).backgroundColor).not.toBe(before);
  });
});
