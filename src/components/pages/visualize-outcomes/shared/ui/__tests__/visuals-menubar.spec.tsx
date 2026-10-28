import '@/styles/globals.css';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { VisualsMenubar } from '../visuals-menubar';
import { EMPTY_SERIES_STYLES } from '@/lib/graphing/series-style';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';
import { DEFAULT_LEGEND_SETTINGS } from '@/lib/graphing/legend-settings';
import type { ToggleDisplayCondition, ToggleDisplayKey } from '@/types/visuals';
import type { ChartImageFormat } from '@/components/pages/visualize-outcomes/shared/helpers/chart-export';
import type { VisualsSettingsState } from '../../helpers/visuals-settings-reducer';

const keys: ToggleDisplayKey[] = [
  { KeyName: 'a', KeyCode: 1, KeyDescription: 'Key A', KeyType: 'Observed', Visible: true },
  { KeyName: 'b', KeyCode: 2, KeyDescription: 'Key B', KeyType: 'Derived', Visible: false },
];

const conditions: ToggleDisplayCondition[] = [
  { Condition: 'Baseline', Visible: true },
  { Condition: 'Treatment', Visible: true },
];

function makeSettings(overrides: Partial<VisualsSettingsState> = {}): VisualsSettingsState {
  return {
    keys,
    conditions,
    schedule: { value: 'Default', label: 'Default' },
    figureTextSize: 'base',
    connectSpans: false,
    showTitle: true,
    showTooltip: true,
    showConditionLegend: true,
    showDescription: true,
    figureLabels: EMPTY_FIGURE_LABEL_SETTINGS,
    legendSettings: DEFAULT_LEGEND_SETTINGS,
    seriesStyles: EMPTY_SERIES_STYLES,
    ...overrides,
  };
}

function renderMenubar({
  settings = {},
  onSaveImage = vi.fn(),
  onWriteStyles = vi.fn(),
  onReadStyles = vi.fn(),
  onDeleteStyles = vi.fn(),
}: {
  settings?: Partial<VisualsSettingsState>;
  onSaveImage?: (format: ChartImageFormat) => void;
  onWriteStyles?: () => void;
  onReadStyles?: () => void;
  onDeleteStyles?: () => void;
} = {}) {
  const dispatch = vi.fn();

  return {
    dispatch,
    ...render(
      <VisualsMenubar
        page="rate"
        settings={makeSettings(settings)}
        dispatch={dispatch}
        styleConditions={['Baseline', 'Treatment']}
        visibleStyleConditions={['Baseline', 'Treatment']}
        onSaveImage={onSaveImage}
        onWriteStyles={onWriteStyles}
        onReadStyles={onReadStyles}
        onDeleteStyles={onDeleteStyles}
      />,
    ),
  };
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

  it('calls onWriteStyles from File > Style Information > Write styles.json', async () => {
    const onWriteStyles = vi.fn();
    renderMenubar({ onWriteStyles });

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Style Information' }).click();
    await page.getByRole('menuitem', { name: 'Write styles.json' }).click();

    expect(onWriteStyles).toHaveBeenCalledTimes(1);
  });

  it('calls onReadStyles from File > Style Information > Read styles.json', async () => {
    const onReadStyles = vi.fn();
    renderMenubar({ onReadStyles });

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Style Information' }).click();
    await page.getByRole('menuitem', { name: 'Read styles.json' }).click();

    expect(onReadStyles).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteStyles from File > Style Information > Delete styles.json', async () => {
    const onDeleteStyles = vi.fn();
    renderMenubar({ onDeleteStyles });

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Style Information' }).click();
    await page.getByRole('menuitem', { name: 'Delete styles.json' }).click();

    expect(onDeleteStyles).toHaveBeenCalledTimes(1);
  });

  it('dispatches a key toggled off from Data > Keys and keeps the menu open', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitem', { name: 'Keys' }).hover();
    await page.getByRole('menuitemcheckbox', { name: 'Key A' }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'keyVisibilityChanged', keyDescription: 'Key A', visible: false });
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Key B' })).toBeInTheDocument();
  });

  it('dispatches a condition toggled on from Data > Conditions', async () => {
    const { dispatch } = renderMenubar({
      settings: {
        conditions: [
          { Condition: 'Baseline', Visible: true },
          { Condition: 'Treatment', Visible: false },
        ],
      },
    });

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitem', { name: 'Conditions' }).hover();
    await page.getByRole('menuitemcheckbox', { name: 'Treatment' }).click();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'conditionVisibilityChanged',
      condition: 'Treatment',
      visible: true,
    });
  });

  it('opens the Aim Lines dialog from Aesthetics > Annotations submenu', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Annotations' }).hover();
    await page.getByRole('menuitem', { name: 'Aim Lines' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Aim Lines' })).toBeInTheDocument();
  });

  it('opens the Titles and Labels dialog and dispatches a hidden title', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Titles and Labels' }).click();
    await expect.element(page.getByRole('dialog', { name: 'Titles and Labels' })).toBeInTheDocument();

    await page.getByRole('checkbox', { name: 'Hide Title' }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'showTitleChanged', show: false });

    await page.getByRole('button', { name: 'Reset to Defaults' }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'figureLabelsChanged', labels: EMPTY_FIGURE_LABEL_SETTINGS });

    await page.getByRole('button', { name: 'Done' }).click();
    await expect.element(page.getByRole('dialog', { name: 'Titles and Labels' })).not.toBeInTheDocument();
  });

  it('dispatches a legend layout chosen in the Legend Position and Layout dialog', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Legend Settings' }).click();
    await page.getByRole('combobox', { name: 'Legend layout' }).click();
    await page.getByRole('option', { name: 'Vertical' }).click();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'legendSettingsChanged',
      settings: expect.objectContaining({ layout: 'vertical' }),
    });
  });

  it('dispatches a series style chosen in the Series Styles dialog', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Style Series' }).click();
    await page.getByRole('combobox', { name: 'Shape for Key A' }).click();
    await page.getByRole('option', { name: 'triangle', exact: true }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'seriesStylesChanged', styles: expect.any(Object) });
  });

  it('opens the Text Annotations dialog from Aesthetics > Annotations > Text Labels', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Annotations' }).hover();
    await page.getByRole('menuitem', { name: 'Text Labels' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Text Annotations' })).toBeInTheDocument();
  });

  it('opens the Phase Changes dialog from Aesthetics > Annotations > Phase Change Lines', async () => {
    renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Annotations' }).hover();
    await page.getByRole('menuitem', { name: 'Phase Change Lines' }).click();

    await expect.element(page.getByRole('dialog', { name: 'Phase Changes' })).toBeInTheDocument();
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

  it('dispatches the condition legend checkbox from the legend dialog', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Legend Settings' }).click();
    await page.getByRole('checkbox', { name: 'Conditions in Legend' }).click();

    expect(dispatch).toHaveBeenLastCalledWith({ type: 'showConditionLegendChanged', show: false });
  });

  it('dispatches an element magnification size from Aesthetics', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Aesthetics' }).click();
    await page.getByRole('menuitem', { name: 'Element Sizing' }).hover();
    await page.getByRole('menuitemradio', { name: 'Large', exact: true }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'figureTextSizeChanged', size: 'large' });
  });

  it('dispatches Connect All Spans toggled on from Data', async () => {
    const { dispatch } = renderMenubar();

    await page.getByRole('menuitem', { name: 'Data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Connect All Spans' }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'connectSpansChanged', connect: true });
  });

  it('dispatches Enable Tooltip toggled off from Settings and keeps the menu open', async () => {
    const { dispatch } = renderMenubar({ settings: { showTooltip: true } });

    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Enable Tooltip' }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'showTooltipChanged', show: false });
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Enable Tooltip' })).toBeInTheDocument();
  });

  it('dispatches Show Description toggled off from Settings and keeps the menu open', async () => {
    const { dispatch } = renderMenubar({ settings: { showDescription: true } });

    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Show Description' }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: 'showDescriptionChanged', show: false });
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
