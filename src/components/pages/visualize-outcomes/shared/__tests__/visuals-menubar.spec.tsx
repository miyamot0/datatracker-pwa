import '@/styles/globals.css';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { VisualsMenubar } from '../visuals-menubar';
import { EMPTY_SERIES_STYLES } from '@/lib/graphing/series-style';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';
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
    onSavePng: vi.fn(),
    figureTextSize: 'base' as const,
    onFigureTextSizeChange: vi.fn(),
    connectSpans: false,
    onConnectSpansChange: vi.fn(),
    showTitle: true,
    onShowTitleChange: vi.fn(),
    figureLabels: EMPTY_FIGURE_LABEL_SETTINGS,
    onFigureLabelsChange: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<VisualsMenubar {...props} />) };
}

describe('VisualsMenubar', () => {
  it('renders File, Data, and Design menus', async () => {
    renderMenubar();

    await expect.element(page.getByRole('menuitem', { name: 'File' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Data' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Design' })).toBeInTheDocument();
  });

  it('calls onSavePng from File > Save to PNG', async () => {
    const onSavePng = vi.fn();
    renderMenubar({ onSavePng });

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Save to PNG' }).click();

    expect(onSavePng).toHaveBeenCalledTimes(1);
  });

  it('reports a key toggled off from Data > Keys and keeps the menu open', async () => {
    const onKeyVisibilityChange = vi.fn();
    renderMenubar({ onKeyVisibilityChange });

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitem', { name: 'Keys' }).hover();
    await page.getByRole('menuitemcheckbox', { name: 'Key A' }).click();

    expect(onKeyVisibilityChange).toHaveBeenCalledWith('Key A', false);
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Key B' })).toBeInTheDocument();
  });

  it('reports a condition toggled on from Data > Conditions', async () => {
    const onConditionVisibilityChange = vi.fn();
    renderMenubar({
      onConditionVisibilityChange,
      conditions: [
        { Condition: 'Baseline', Visible: true },
        { Condition: 'Treatment', Visible: false },
      ],
    });

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitem', { name: 'Conditions' }).hover();
    await page.getByRole('menuitemcheckbox', { name: 'Treatment' }).click();

    expect(onConditionVisibilityChange).toHaveBeenCalledWith('Treatment', true);
  });

  it('opens the Aim Lines dialog from Design > Annotations submenu', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Design' }).click();
    await page.getByRole('menuitem', { name: 'Annotations' }).hover();
    await page.getByRole('menuitem', { name: 'Aim Lines' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Aim Lines' })).toBeInTheDocument();
  });

  it('opens the Series Styles dialog from Design', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Design' }).click();
    await page.getByRole('menuitem', { name: 'Series Styles' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Series Styles' })).toBeInTheDocument();
  });

  it('selects an element magnification size from Design', async () => {
    const onFigureTextSizeChange = vi.fn();
    renderMenubar({ onFigureTextSizeChange });

    await page.getByRole('menuitem', { name: 'Design' }).click();
    await page.getByRole('menuitem', { name: 'Element Magnification' }).hover();
    await page.getByRole('menuitemradio', { name: 'Large', exact: true }).click();

    expect(onFigureTextSizeChange).toHaveBeenCalledWith('large');
  });

  it('reports Connect All Spans toggled on from Data', async () => {
    const onConnectSpansChange = vi.fn();
    renderMenubar({ onConnectSpansChange });

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Connect All Spans' }).click();

    expect(onConnectSpansChange).toHaveBeenCalledWith(true);
  });

  it('reports Show Title toggled off from Design and keeps the menu open', async () => {
    const onShowTitleChange = vi.fn();
    renderMenubar({ onShowTitleChange, showTitle: true });

    await page.getByRole('menuitem', { name: 'Design' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Show Title' }).click();

    expect(onShowTitleChange).toHaveBeenCalledWith(false);
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Show Title' })).toBeInTheDocument();
  });

  it('keeps the Data menu open after toggling Connect All Spans', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Connect All Spans' }).click();

    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Connect All Spans' })).toBeInTheDocument();
  });

  it('switches from an open menu to another menu on click', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Data' }).click();

    await expect.element(page.getByRole('menuitem', { name: 'Keys' })).toBeInTheDocument();
  });

  it('switches to another menu on hover while a menu is open', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitem', { name: 'Design' }).hover();

    await expect.element(page.getByRole('menuitem', { name: 'Series Styles' })).toBeInTheDocument();
  });

  it('closes the open menu when its own trigger is clicked again', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'Keys' })).toBeInTheDocument();
    await page.getByRole('menuitem', { name: 'Data' }).click();

    await expect.element(page.getByRole('menuitem', { name: 'Keys' })).not.toBeInTheDocument();
  });
});

describe('VisualsMenubar item hover', () => {
  it('highlights a menubar trigger on hover before any menu is open', async () => {
    renderMenubar();

    const trigger = page.getByRole('menuitem', { name: 'Data' });
    await expect.element(trigger).toBeInTheDocument();
    const before = getComputedStyle(trigger.element()).backgroundColor;
    await trigger.hover();

    expect(getComputedStyle(trigger.element()).backgroundColor).not.toBe(before);
  });

  it('highlights a menu item on hover', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitem', { name: 'Keys' }).hover();
    const item = page.getByRole('menuitemcheckbox', { name: 'Key B' });
    await expect.element(item).toBeInTheDocument();
    const before = getComputedStyle(item.element()).backgroundColor;
    await item.hover();

    expect(getComputedStyle(item.element()).backgroundColor).not.toBe(before);
  });
});
