import '@/styles/globals.css';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { VisualsMenubar } from '../visuals-menubar';
import { EMPTY_SERIES_STYLES } from '@/lib/graphing/series-style';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';
import { DEFAULT_LEGEND_SETTINGS } from '@/lib/graphing/legend-settings';
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
    onSaveImage: vi.fn(),
    figureTextSize: 'base' as const,
    onFigureTextSizeChange: vi.fn(),
    connectSpans: false,
    onConnectSpansChange: vi.fn(),
    showTitle: true,
    onShowTitleChange: vi.fn(),
    figureLabels: EMPTY_FIGURE_LABEL_SETTINGS,
    onFigureLabelsChange: vi.fn(),
    showTooltip: true,
    onShowTooltipChange: vi.fn(),
    showConditionLegend: true,
    onShowConditionLegendChange: vi.fn(),
    legendSettings: DEFAULT_LEGEND_SETTINGS,
    onLegendSettingsChange: vi.fn(),
    showDescription: true,
    onShowDescriptionChange: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<VisualsMenubar {...props} />) };
}

describe('VisualsMenubar', () => {
  it('renders File, Data Display, Design, and Settings menus', async () => {
    renderMenubar();

    await expect.element(page.getByRole('menuitem', { name: 'File' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Data Display' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Aesthetics' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
  });

  it('calls onSaveImage with svg from File > Figure Output > Save to SVG', async () => {
    const onSaveImage = vi.fn();
    renderMenubar({ onSaveImage });

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Figure Output' }).click();
    await page.getByRole('menuitem', { name: 'Save to SVG' }).click();

    expect(onSaveImage).toHaveBeenCalledWith('svg');
  });

  it('calls onSaveImage with png from File > Figure Output > Save to PNG', async () => {
    const onSaveImage = vi.fn();
    renderMenubar({ onSaveImage });

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Figure Output' }).click();
    await page.getByRole('menuitem', { name: 'Save to PNG' }).click();

    expect(onSaveImage).toHaveBeenCalledWith('png');
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

  it('opens the Aim Lines dialog from Aesthetics > Annotations submenu', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Annotations' }).hover();
    await page.getByRole('menuitem', { name: 'Aim Lines' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Aim Lines' })).toBeInTheDocument();
  });

  it('opens the Series Styles dialog from Aesthetics', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Style Series' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Series Styles' })).toBeInTheDocument();
  });

  it('opens the Legend Position and Layout dialog from Aesthetics', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Legend Settings' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Legend Position and Layout' })).toBeInTheDocument();
  });

  it('wires the condition legend checkbox in the legend dialog to the page callback', async () => {
    const onShowConditionLegendChange = vi.fn();
    renderMenubar({ onShowConditionLegendChange });

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Legend Settings' }).click();
    await page.getByRole('checkbox', { name: 'Show Condition Legend' }).click();

    expect(onShowConditionLegendChange).toHaveBeenLastCalledWith(false);
  });

  it('selects an element magnification size from Aesthetics', async () => {
    const onFigureTextSizeChange = vi.fn();
    renderMenubar({ onFigureTextSizeChange });

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Element Sizing' }).hover();
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

  it('reports Enable Tooltip toggled off from Settings and keeps the menu open', async () => {
    const onShowTooltipChange = vi.fn();
    renderMenubar({ onShowTooltipChange, showTooltip: true });

    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Enable Tooltip' }).click();

    expect(onShowTooltipChange).toHaveBeenCalledWith(false);
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Enable Tooltip' })).toBeInTheDocument();
  });

  it('reports Show Description toggled off from Settings and keeps the menu open', async () => {
    const onShowDescriptionChange = vi.fn();
    renderMenubar({ onShowDescriptionChange, showDescription: true });

    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Show Description' }).click();

    expect(onShowDescriptionChange).toHaveBeenCalledWith(false);
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Show Description' })).toBeInTheDocument();
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
    await page.getByRole('menuitem', { name: 'Aesthetics' }).hover();

    await expect.element(page.getByRole('menuitem', { name: 'Style Series' })).toBeInTheDocument();
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
