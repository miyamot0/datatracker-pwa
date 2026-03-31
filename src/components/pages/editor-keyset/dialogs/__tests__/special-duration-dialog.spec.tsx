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

import SpecialDurationDialogKeyCreator from '../special-duration-dialog';
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
    SpecialDurationKeys: [{ KeyName: 'p', KeyDescription: 'Existing', KeyCode: 80 }],
  }) as any;

const renderSpecial = async (keyset: KeySet = makeKeyset()) => {
  await render(
    <FolderContextProvider>
      <DropdownMenu open>
        <DropdownMenuContent forceMount>
          <SpecialDurationDialogKeyCreator KeySet={keyset} Callback={mockCallback} />
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

const openSpecialDialog = () => {
  (page.getByText('Add Special Timing Key').element() as HTMLElement).click();
};

const openDialog = async () => {
  openSpecialDialog();
  await expect.element(page.getByText('Special Duration Key Creator')).toBeVisible();
};

const formSection = () => page.getByText(/Period to Record/).element().parentElement as HTMLElement;
const descriptionInput = () => formSection().querySelectorAll('input')[0] as HTMLInputElement;
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

describe('SpecialDurationDialogKeyCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Special Timing Key trigger', async () => {
    await renderSpecial();
    await expect.element(page.getByText('Add Special Timing Key')).toBeVisible();
  });

  it('dialog is closed initially (title not visible)', async () => {
    await renderSpecial();
    expect(page.getByText('Special Duration Key Creator').elements().length).toBe(0);
  });

  it('opens dialog when trigger is clicked', async () => {
    await renderSpecial();
    await openDialog();
  });

  it('shows dialog description when open', async () => {
    await renderSpecial();
    await openDialog();
    await expect.element(page.getByText('Set key and relevant description')).toBeVisible();
  });

  it('shows Period to Record input label when open', async () => {
    await renderSpecial();
    await openDialog();
    await expect.element(page.getByText(/Period to Record/)).toBeVisible();
  });

  it('shows Key Capture input label when open', async () => {
    await renderSpecial();
    await openDialog();
    await expect.element(page.getByText(/Key Capture/)).toBeVisible();
  });

  it('shows Create Key button when open', async () => {
    await renderSpecial();
    await openDialog();
    await expect.element(page.getByText('Create Key')).toBeVisible();
  });

  it('description input updates on change', async () => {
    await renderSpecial();
    await openDialog();
    setInputValue(descriptionInput(), 'Pause Timer');
    expect(descriptionInput().value).toBe('Pause Timer');
  });

  it('does not update key capture input from direct change event (no-op onChange)', async () => {
    await renderSpecial();
    await openDialog();
    const input = keyCaptureInput().element();
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('invokes key capture onChange via input event without mutating state', async () => {
    await renderSpecial();
    await openDialog();
    const input = keyCaptureInput().element() as HTMLInputElement;
    setInputValue(input, 'manual');
    expect(input.value).toBe('');
  });

  it('captures an allowed key press into key capture input', async () => {
    await renderSpecial();
    await openDialog();
    await dispatchKeyDown('p', 80);
    await expect.element(keyCaptureInput()).toHaveValue('p');
  });

  it('shows notification and blocks Shift/Ctrl modified keys', async () => {
    await renderSpecial();
    await openDialog();
    await dispatchKeyDown('P', 80, { shiftKey: true });
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Shift/Ctrl Keys are Disabled',
      expect.stringContaining("'P'"),
      3000,
      true,
    );
  });

  it('shows notification when key is already assigned', async () => {
    await renderSpecial(makeAssignedKeyset());
    await openDialog();
    await dispatchKeyDown('p', 80);
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Key is already assigned',
      expect.stringContaining("'p'"),
      3000,
      true,
    );
  });

  it('shows notification when key is protected', async () => {
    await renderSpecial();
    await openDialog();
    await dispatchKeyDown('Tab', 9);
    expect(mockDisplayConditionalNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Key is protected',
      expect.stringContaining("'Tab'"),
      3000,
      true,
    );
  });

  it('ignores Escape key in key capture', async () => {
    await renderSpecial();
    await openDialog();
    await dispatchKeyDown('Escape', 27);
    expect(page.getByText('Special Duration Key Creator').elements().length).toBe(1);
    expect(mockDisplayConditionalNotification).not.toHaveBeenCalled();
  });

  it('shows notification when description is too short', async () => {
    await renderSpecial();
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
    await renderSpecial();
    await openDialog();
    setInputValue(descriptionInput(), 'Pause Timer');
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
    await renderSpecial();
    await openDialog();
    setInputValue(descriptionInput(), 'Pause Timer');
    await dispatchKeyDown('p', 80);
    await dispatchKeyDown('Enter', 13);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Pause Timer', KeyName: 'p', KeyCode: 80 }),
    );
  });

  it('resets values when dialog is closed and reopened', async () => {
    await renderSpecial();
    await openDialog();
    setInputValue(descriptionInput(), 'Pause Timer');
    await dispatchKeyDown('p', 80);
    await page.getByRole('button', { name: 'Close' }).click();
    await openDialog();
    expect(descriptionInput().value).toBe('');
    await expect.element(keyCaptureInput()).toHaveValue('');
  });

  it('calls Callback when valid input is provided and Create Key is clicked', async () => {
    await renderSpecial();
    await openDialog();
    setInputValue(descriptionInput(), 'Pause Timer');
    await dispatchKeyDown('p', 80);
    await page.getByText('Create Key').click();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Pause Timer', KeyName: 'p', KeyCode: 80 }),
    );
  });
});
