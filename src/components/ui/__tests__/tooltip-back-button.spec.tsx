import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import '@/styles/globals.css';
import { FolderHandleContext, type FolderHandleContextType } from '@/context/folder-context';
import ToolTipWrapper from '../tooltip-wrapper';
import { TooltipProvider } from '../tooltip';

function withSettings(EnableToolTip: boolean | undefined) {
  return {
    settings: { EnableToolTip },
  } as unknown as FolderHandleContextType;
}

function Harness({ enabled, side, label }: { enabled: boolean | undefined; side?: 'top' | 'right'; label: string }) {
  return (
    <FolderHandleContext.Provider value={withSettings(enabled)}>
      <TooltipProvider>
        <ToolTipWrapper Label={label} side={side}>
          <button>Hover target</button>
        </ToolTipWrapper>
      </TooltipProvider>
    </FolderHandleContext.Provider>
  );
}

describe('ToolTipWrapper', () => {
  it('renders children without a tooltip when tooltips are disabled', async () => {
    await render(<Harness enabled={false} label="Hidden label" />);
    await expect.element(page.getByRole('button', { name: 'Hover target' })).toBeVisible();
    await page.getByRole('button', { name: 'Hover target' }).hover();
    expect(document.body.textContent).not.toContain('Hidden label');
  });

  it('wraps children in a tooltip trigger when tooltips are enabled', async () => {
    await render(<Harness enabled label="Shown label" />);
    const trigger = page.getByRole('button', { name: 'Hover target' });
    await expect.element(trigger).toBeVisible();
    await trigger.hover();
    await expect.element(page.getByText('Shown label')).toBeVisible();
  });

  it('defaults to showing a tooltip when the setting is unset', async () => {
    await render(<Harness enabled={undefined} label="Default label" side="right" />);
    const trigger = page.getByRole('button', { name: 'Hover target' });
    await trigger.hover();
    await expect.element(page.getByText('Default label')).toBeVisible();
  });
});

const { mockGo, mockHotkey } = vi.hoisted(() => ({
  mockGo: vi.fn(),
  mockHotkey: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useRouter: () => ({ history: { go: mockGo } }),
}));

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: (...args: unknown[]) => mockHotkey(...args),
}));

import BackButton from '../back-button';

describe('BackButton', () => {
  beforeEach(() => {
    mockGo.mockReset();
    mockHotkey.mockReset();
  });

  it('shows the default label and navigates back on click', async () => {
    await render(<BackButton />);
    const button = page.getByRole('button', { name: 'Back' });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(mockGo).toHaveBeenCalledWith(-1);
  });

  it('uses a custom label', async () => {
    await render(<BackButton Label="Return" />);
    await expect.element(page.getByRole('button', { name: 'Return' })).toBeVisible();
  });

  it('registers an Escape hotkey that navigates back', async () => {
    await render(<BackButton />);
    expect(mockHotkey).toHaveBeenCalledWith('Escape', expect.any(Function), expect.any(Object));
    const handler = mockHotkey.mock.calls[0][1] as () => void;
    handler();
    expect(mockGo).toHaveBeenCalledWith(-1);
  });

  it('does not navigate from the hotkey when Silence is set', async () => {
    await render(<BackButton Silence />);
    const handler = mockHotkey.mock.calls[0][1] as () => void;
    handler();
    expect(mockGo).not.toHaveBeenCalled();
  });

  it('still navigates from the click when Silence is set', async () => {
    await render(<BackButton Silence />);
    await page.getByRole('button', { name: 'Back' }).click();
    expect(mockGo).toHaveBeenCalledWith(-1);
  });
});
