// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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

const renderSpecial = async (mockCallback: ReturnType<typeof vi.fn>) => {
  await render(
    <FolderContextProvider>
      <DropdownMenu open>
        <DropdownMenuContent forceMount>
          <SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />
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

describe('SpecialDurationDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Special Timing Key trigger', async () => {
    await renderSpecial(mockCallback);
    await expect.element(page.getByText('Add Special Timing Key')).toBeVisible();
  });

  it('dialog is closed initially (title not visible)', async () => {
    await renderSpecial(mockCallback);
    expect(page.getByText('Special Duration Key Creator').elements().length).toBe(0);
  });

  it('opens dialog when trigger is clicked', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    await expect.element(page.getByText('Special Duration Key Creator')).toBeVisible();
  });

  it('shows dialog description when open', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    await expect.element(page.getByText('Set key and relevant description')).toBeVisible();
  });

  it('shows Period to Record input label when open', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    await expect.element(page.getByText(/Period to Record/)).toBeVisible();
  });

  it('shows Key Capture input label when open', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    await expect.element(page.getByText(/Key Capture/)).toBeVisible();
  });

  it('shows Create Key button when open', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    await expect.element(page.getByText('Create Key')).toBeVisible();
  });

  it('description input updates on change', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    const formSection = page.getByText(/Period to Record/).element().parentElement as HTMLElement;
    const descriptionInput = formSection.querySelectorAll('input')[0] as HTMLInputElement;
    setInputValue(descriptionInput, 'Pause Timer');
    expect(descriptionInput.value).toBe('Pause Timer');
  });

  it('calls Callback when valid input is provided and Create Key is clicked', async () => {
    await renderSpecial(mockCallback);
    openSpecialDialog();
    const formSection = page.getByText(/Period to Record/).element().parentElement as HTMLElement;
    const descriptionInput = formSection.querySelectorAll('input')[0] as HTMLInputElement;
    const keyInput = formSection.querySelectorAll('input')[1] as HTMLInputElement;
    setInputValue(descriptionInput, 'Pause Timer');
    keyInput.focus();
    const keyEvent = new KeyboardEvent('keydown', { key: 'p', bubbles: true });
    Object.defineProperty(keyEvent, 'keyCode', { get: () => 80 });
    Object.defineProperty(keyEvent, 'which', { get: () => 80 });
    keyInput.dispatchEvent(keyEvent);
    await page.getByText('Create Key').click();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Pause Timer' }),
    );
  });
});

