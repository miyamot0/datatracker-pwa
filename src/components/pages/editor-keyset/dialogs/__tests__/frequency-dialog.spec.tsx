// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

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

import FrequencyDialogKeyCreator from '../frequency-dialog';
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

const makeAssignedKeyset = (): KeySet =>
  ({
    ...makeKeyset(),
    FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Existing', KeyCode: 65 }],
  }) as any;

const renderDialog = async (keyset: KeySet = makeKeyset()) => {
  await render(
    <FolderContextProvider>
      <FrequencyDialogKeyCreator KeySet={keyset} Callback={mockCallback} />
    </FolderContextProvider>,
  );
};

const openDialog = async () => {
  await page.getByText('Add Key').click();
  await expect.element(page.getByText('Frequency Key Creator')).toBeVisible();
};

const descriptionInput = () => page.getByRole('textbox').first();
const keyCaptureInput = () => page.getByRole('textbox').nth(1);

const dispatchKeyDown = async (
  key: string,
  keyCode: number,
  options: { shiftKey?: boolean; ctrlKey?: boolean } = {},
) => {
  const input = keyCaptureInput().element();
  const keyEvent = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    shiftKey: !!options.shiftKey,
    ctrlKey: !!options.ctrlKey,
  });
  Object.defineProperty(keyEvent, 'keyCode', { get: () => keyCode });
  input.dispatchEvent(keyEvent);
};

describe('FrequencyDialogKeyCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Key trigger button', async () => {
    await renderDialog();
    await expect.element(page.getByText('Add Key')).toBeVisible();
  });

  it('dialog is closed initially (title not visible)', async () => {
    await renderDialog();
    expect(page.getByText('Frequency Key Creator').elements().length).toBe(0);
  });

  it('opens dialog when Add Key is clicked', async () => {
    await renderDialog();
    await openDialog();
  });

  it('shows dialog description when open', async () => {
    await renderDialog();
    await openDialog();
    await expect.element(page.getByText('Set key and relevant description')).toBeVisible();
  });

  it('shows Event to Record input label when open', async () => {
    await renderDialog();
    await openDialog();
    await expect.element(page.getByText(/Event to Record/)).toBeVisible();
  });

  it('shows Key Capture input label when open', async () => {
    await renderDialog();
    await openDialog();
    await expect.element(page.getByText(/Key Capture/)).toBeVisible();
  });

  it('shows Create Key button when open', async () => {
    await renderDialog();
    await openDialog();
    await expect.element(page.getByText('Create Key')).toBeVisible();
  });

  it('description input updates on change', async () => {
    await renderDialog();
    await openDialog();
    await descriptionInput().fill('Aggression');
    await expect.element(descriptionInput()).toHaveValue('Aggression');
  });

  it('does not update key capture input from direct typing (no-op onChange)', async () => {
    await renderDialog();
    await openDialog();
    await keyCaptureInput().fill('typed-value');
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('captures an allowed key press into key capture input', async () => {
    await renderDialog();
    await openDialog();
    await dispatchKeyDown('a', 65);
    await expect.element(keyCaptureInput()).toHaveValue('a');
  });

  it('shows notification and blocks Shift/Ctrl modified keys', async () => {
    await renderDialog();
    await openDialog();
    await dispatchKeyDown('A', 65, { shiftKey: true });
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Shift/Ctrl Keys Disabled',
      expect.stringContaining("'A'"),
      3000,
      true,
    );
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('shows notification when key is already assigned', async () => {
    await renderDialog(makeAssignedKeyset());
    await openDialog();
    await dispatchKeyDown('a', 65);
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Key is already assigned',
      expect.stringContaining("'a'"),
      3000,
      true,
    );
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('shows notification when key is protected', async () => {
    await renderDialog();
    await openDialog();
    await dispatchKeyDown('Tab', 9);
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Key is protected',
      expect.stringContaining("'Tab'"),
      3000,
      true,
    );
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('ignores Escape key in key capture', async () => {
    await renderDialog();
    await openDialog();
    await dispatchKeyDown('Escape', 27);
    expect(page.getByText('Frequency Key Creator').elements().length).toBe(0);
    expect(mockDisplayConditionalNotification).not.toHaveBeenCalled();
  });

  it('shows notification when description is too short', async () => {
    await renderDialog();
    await openDialog();
    await page.getByText('Create Key').click();
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Key Description Too Short',
      'The key description must be at least 2 characters long.',
      3000,
      true,
    );
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('shows notification when key capture is invalid', async () => {
    await renderDialog();
    await openDialog();
    await descriptionInput().fill('Aggression');
    await page.getByText('Create Key').click();
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'The Key Captured is Invalid',
      'The key name must be at least 1 character long.',
      3000,
      true,
    );
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('submits via Enter key in key capture input', async () => {
    await renderDialog();
    await openDialog();
    await descriptionInput().fill('Aggression');
    await dispatchKeyDown('a', 65);
    await dispatchKeyDown('Enter', 13);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Aggression', KeyName: 'a', KeyCode: 65 }),
      'Frequency',
    );
  });

  it('resets values when dialog is closed and reopened', async () => {
    await renderDialog();
    await openDialog();
    await descriptionInput().fill('Aggression');
    await dispatchKeyDown('a', 65);
    await page.getByRole('button', { name: 'Close' }).click();
    await openDialog();
    await expect.element(descriptionInput()).toHaveValue('');
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('calls Callback with Frequency type when valid input is provided', async () => {
    await renderDialog();
    await openDialog();
    await descriptionInput().fill('Aggression');
    await dispatchKeyDown('a', 65);
    await page.getByText('Create Key').click();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Aggression', KeyName: 'a', KeyCode: 65 }),
      'Frequency',
    );
  });
});
