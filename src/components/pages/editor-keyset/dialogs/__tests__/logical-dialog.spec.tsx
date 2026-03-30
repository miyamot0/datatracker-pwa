// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';

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
  displayConditionalNotification: vi.fn(),
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

const renderLogical = async (mockCallback: ReturnType<typeof vi.fn>) => {
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
};

describe('LogicalDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Derived Key trigger', async () => {
    await renderLogical(mockCallback);
    await expect.element(page.getByText('Add Derived Key')).toBeVisible();
  });

  it('dialog is closed initially (title not visible)', async () => {
    await renderLogical(mockCallback);
    expect(page.getByText('Derived Key Creator').elements().length).toBe(0);
  });

  it('opens dialog when trigger is clicked', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    await expect.element(page.getByText('Derived Key Creator')).toBeVisible();
  });

  it('shows dialog description when open', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    await expect.element(page.getByText('Set key and relevant description')).toBeVisible();
  });

  it('shows Derived Key Name input when open', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    await expect.element(page.getByText(/Derived Key Name/)).toBeVisible();
  });

  it('shows Add Step button when open', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    await expect.element(page.getByText('Add Step')).toBeVisible();
  });

  it('shows Save Derived Key button when open', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    await expect.element(page.getByText('Save Derived Key')).toBeVisible();
  });

  it('shows Formula display when open', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    await expect.element(page.getByText(/Formula:/)).toBeVisible();
  });

  it('name input updates on change', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    const formSection = page.getByText(/Derived Key Name/).element().parentElement as HTMLElement;
    const nameInput = formSection.querySelector('input') as HTMLInputElement;
    setInputValue(nameInput, 'Combined Score');
    expect(nameInput.value).toBe('Combined Score');
  });

  it('calls Callback when valid name is provided and Save is clicked', async () => {
    await renderLogical(mockCallback);
    await openDialog();
    const formSection = page.getByText(/Derived Key Name/).element().parentElement as HTMLElement;
    const nameInput = formSection.querySelector('input') as HTMLInputElement;
    setInputValue(nameInput, 'Combined Score');
    await page.getByText('Save Derived Key').click();
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ name: 'Combined Score' }));
  });
});
