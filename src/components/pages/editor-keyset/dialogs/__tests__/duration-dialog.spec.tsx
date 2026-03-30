// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect, beforeEach } from 'vitest';

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

import DurationDialogKeyCreator from '../duration-dialog';
import { FolderContextProvider } from '@/context/folder-context';
import { KeySet } from '@/types/keyset';

const makeKeyset = (): KeySet =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
    lastModified: new Date(),
  }) as any;

describe('DurationDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Key trigger button', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await expect.element(page.getByText('Add Key')).toBeVisible();
  });

  it('dialog is closed initially (title not visible)', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    expect(page.getByText('Duration Key Creator').elements().length).toBe(0);
  });

  it('opens dialog when Add Key is clicked', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await expect.element(page.getByText('Duration Key Creator')).toBeVisible();
  });

  it('shows dialog description when open', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await expect.element(page.getByText('Set key and relevant description')).toBeVisible();
  });

  it('shows Event to Record input label when open', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await expect.element(page.getByText(/Event to Record/)).toBeVisible();
  });

  it('shows Key Capture input label when open', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await expect.element(page.getByText(/Key Capture/)).toBeVisible();
  });

  it('shows Create Key button when open', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await expect.element(page.getByText('Create Key')).toBeVisible();
  });

  it('description input updates on change', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await page.getByRole('textbox').first().fill('Reinforcement');
    await expect.element(page.getByRole('textbox').first()).toHaveValue('Reinforcement');
  });

  it('calls Callback with Duration type when valid input is provided', async () => {
    await render(
      <FolderContextProvider>
        <DurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
      </FolderContextProvider>,
    );
    await page.getByText('Add Key').click();
    await page.getByRole('textbox').first().fill('Reinforcement');
    const keyInput = page.getByRole('textbox').nth(1).element();
    const keyEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    Object.defineProperty(keyEvent, 'keyCode', { get: () => 65 });
    keyInput.dispatchEvent(keyEvent);
    await page.getByText('Create Key').click();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Reinforcement' }),
      'Duration',
    );
  });
});
