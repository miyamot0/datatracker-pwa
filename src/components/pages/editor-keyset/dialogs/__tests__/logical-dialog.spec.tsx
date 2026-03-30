// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';

const mockDisplayConditionalNotification = vi.hoisted(() => vi.fn());
const mockCallback = vi.hoisted(() => vi.fn());

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: mockDisplayConditionalNotification,
}));

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

import LogicalDialogKeyCreator from '../logical-dialog';
import { FolderContextProvider } from '@/context/folder-context';
import { KeySet } from '@/types/keyset';

const makeKeyset = (): KeySet =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 }],
    DurationKeys: [{ KeyName: 'b', KeyDescription: 'Running', KeyCode: 66 }],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
    lastModified: new Date(),
  }) as any;

const renderLogical = async () => {
  await render(
    <FolderContextProvider>
      <DropdownMenu open>
        <DropdownMenuContent forceMount>
          <LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
        </DropdownMenuContent>
      </DropdownMenu>
    </FolderContextProvider>,
  );
};

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const openDialog = async () => {
  (page.getByText('Add Derived Key').element() as HTMLElement).click();
  await expect.element(page.getByText('Derived Key Creator')).toBeVisible();
};

const nameInput = () => {
  const formSection = page.getByText(/Derived Key Name/).element().parentElement as HTMLElement;
  return formSection.querySelector('input') as HTMLInputElement;
};

const stepCount = () => page.getByText(/Step /).elements().length;

describe('LogicalDialogKeyCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Derived Key trigger', async () => {
    await renderLogical();
    await expect.element(page.getByText('Add Derived Key')).toBeVisible();
  });

  it('dialog is closed initially (title not visible)', async () => {
    await renderLogical();
    expect(page.getByText('Derived Key Creator').elements().length).toBe(0);
  });

  it('opens dialog when trigger is clicked', async () => {
    await renderLogical();
    await openDialog();
  });

  it('shows dialog description when open', async () => {
    await renderLogical();
    await openDialog();
    await expect.element(page.getByText('Set key and relevant description')).toBeVisible();
  });

  it('shows Derived Key Name input when open', async () => {
    await renderLogical();
    await openDialog();
    await expect.element(page.getByText(/Derived Key Name/)).toBeVisible();
  });

  it('shows Add Step button when open', async () => {
    await renderLogical();
    await openDialog();
    await expect.element(page.getByText('Add Step')).toBeVisible();
  });

  it('shows Save Derived Key button when open', async () => {
    await renderLogical();
    await openDialog();
    await expect.element(page.getByText('Save Derived Key')).toBeVisible();
  });

  it('shows Formula display when open', async () => {
    await renderLogical();
    await openDialog();
    await expect.element(page.getByText(/Formula:/)).toBeVisible();
  });

  it('name input updates on change', async () => {
    await renderLogical();
    await openDialog();
    const input = nameInput();
    setInputValue(input, 'Combined Score');
    expect(input.value).toBe('Combined Score');
  });

  it('adds and removes a step', async () => {
    await renderLogical();
    await openDialog();
    expect(stepCount()).toBe(0);
    await page.getByText('Add Step').click();
    expect(stepCount()).toBe(1);

    const deleteButtons = Array.from(document.querySelectorAll('button')).filter((button) =>
      button.className.includes('destructive'),
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    (deleteButtons[0] as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    expect(stepCount()).toBe(0);
  });

  it('updates formula when initial constant changes', async () => {
    await renderLogical();
    await openDialog();
    const numericInputs = document.querySelectorAll('input[type="numeric"]');
    const initialInput = numericInputs[0] as HTMLInputElement;
    setInputValue(initialInput, '5');
    await expect.element(page.getByText(/Formula: 5/)).toBeVisible();
  });

  it('shows notification when derived key name is too short', async () => {
    await renderLogical();
    await openDialog();
    await page.getByText('Save Derived Key').click();
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Key Description Too Short',
      'The key description must be at least 2 characters long.',
      3000,
      true,
    );
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('resets values when dialog is closed and reopened', async () => {
    await renderLogical();
    await openDialog();
    const input = nameInput();
    setInputValue(input, 'Combined Score');
    await page.getByText('Add Step').click();
    await page.getByRole('button', { name: 'Close' }).click();

    await openDialog();
    expect(nameInput().value).toBe('');
    expect(stepCount()).toBe(0);
  });

  it('calls Callback when valid name is provided and Save is clicked', async () => {
    await renderLogical();
    await openDialog();
    const input = nameInput();
    setInputValue(input, 'Combined Score');
    await page.getByText('Save Derived Key').click();
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ name: 'Combined Score' }));
  });
});
