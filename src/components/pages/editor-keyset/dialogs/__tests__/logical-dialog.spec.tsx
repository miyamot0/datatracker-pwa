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
import { KeySet } from '@/types/keyset/core';

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

const logicFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'ls-1',
  name: 'Existing Key',
  value: 0,
  initial: { type: 'constant', value: 3 },
  steps: [],
  fields: [],
  ...overrides,
});

const renderControlled = async (props: Record<string, unknown> = {}) => {
  const ui = (p: Record<string, unknown>) => (
    <FolderContextProvider>
      <DropdownMenu open>
        <DropdownMenuContent forceMount>
          <LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} open onClose={mockOnClose} {...p} />
        </DropdownMenuContent>
      </DropdownMenu>
    </FolderContextProvider>
  );
  const result = await render(ui(props));
  return { rerender: (p: Record<string, unknown>) => result.rerender(ui(p)) };
};

const formulaText = () => (page.getByText(/Formula:/).element() as HTMLElement).textContent ?? '';

const mockOnClose = vi.hoisted(() => vi.fn());

describe('LogicalDialogKeyCreator controlled and edit modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('edit mode shows the edit title, a locked name, and Save Changes', async () => {
    await renderControlled({ logicToEdit: logicFixture(), lockName: true });

    await expect.element(page.getByText('Edit Derived Key')).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    expect(nameInput().value).toBe('Existing Key');
    expect(nameInput().readOnly).toBe(true);
  });

  it('remaps field-based initial and operand references onto keyset fields', async () => {
    await renderControlled({
      logicToEdit: logicFixture({
        initial: { type: 'field', field: { KeyCode: 65, KeyDescription: 'Hitting', Tag: 'stale' } },
        steps: [
          {
            id: 's1',
            operation: 'multiply',
            operand: { type: 'field', field: { KeyCode: 66, KeyDescription: 'Running', Tag: 'stale' } },
          },
        ],
      }),
    });

    await expect.element(page.getByText(/Formula:/)).toBeVisible();
    expect(formulaText()).toMatch(/Hitting\s+\*=\s+Running/);
  });

  it('keeps field references that do not match any keyset field', async () => {
    await renderControlled({
      logicToEdit: logicFixture({
        initial: { type: 'field', field: { KeyCode: 999, KeyDescription: 'Ghost', Tag: 'field.Ghost' } },
        steps: [
          { id: 's1', operation: 'add', operand: { type: 'constant', value: 2 } },
          {
            id: 's2',
            operation: 'subtract',
            operand: { type: 'field', field: { KeyCode: 998, KeyDescription: 'Unknown', Tag: 'field.Unknown' } },
          },
        ],
      }),
    });

    await expect.element(page.getByText(/Formula:/)).toBeVisible();
    expect(formulaText()).toMatch(/Ghost\s+\+=\s+2\s+-=\s+Unknown/);
  });

  it('formula renders every operation symbol', async () => {
    await renderControlled({
      logicToEdit: logicFixture({
        initial: { type: 'constant', value: 10 },
        steps: [
          { id: 's1', operation: 'add', operand: { type: 'constant', value: 1 } },
          { id: 's2', operation: 'subtract', operand: { type: 'constant', value: 1 } },
          { id: 's3', operation: 'multiply', operand: { type: 'constant', value: 1 } },
          { id: 's4', operation: 'divide', operand: { type: 'constant', value: 1 } },
        ],
      }),
    });

    await expect.element(page.getByText(/Formula:/)).toBeVisible();
    expect(formulaText()).toMatch(/10\s+\+=\s+1\s+-=\s+1\s+\*=\s+1\s+\/=\s+1/);
  });

  it('saves an edited key with its original id and closes the dialog', async () => {
    await renderControlled({ logicToEdit: logicFixture(), lockName: true });

    await page.getByRole('button', { name: 'Save Changes' }).click();

    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ id: 'ls-1', name: 'Existing Key' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closing an edited key via the dialog close button calls onClose without saving', async () => {
    await renderControlled({ logicToEdit: logicFixture(), lockName: true });

    await page.getByRole('button', { name: 'Close' }).click();

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('syncs when logicToEdit is set and then cleared', async () => {
    const view = await renderControlled({ logicToEdit: null });
    await expect.element(page.getByText('Derived Key Creator')).toBeVisible();

    await view.rerender({ logicToEdit: logicFixture({ name: 'Loaded Key' }), lockName: true });
    await expect.element(page.getByText('Edit Derived Key')).toBeVisible();
    expect(nameInput().value).toBe('Loaded Key');

    await view.rerender({ logicToEdit: null });
    await expect.element(page.getByText('Derived Key Creator')).toBeVisible();
    expect(nameInput().value).toBe('');
  });

  it('removes only the targeted step', async () => {
    await renderControlled({
      logicToEdit: logicFixture({
        initial: { type: 'constant', value: 0 },
        steps: [
          { id: 's1', operation: 'add', operand: { type: 'constant', value: 11 } },
          { id: 's2', operation: 'add', operand: { type: 'constant', value: 22 } },
          { id: 's3', operation: 'add', operand: { type: 'constant', value: 33 } },
        ],
      }),
      lockName: true,
    });

    const trashButtons = Array.from(document.querySelectorAll('button')).filter((b) =>
      b.className.includes('destructive'),
    );
    expect(trashButtons.length).toBe(3);
    (trashButtons[1] as HTMLButtonElement).click();

    await expect.element(page.getByText(/Formula:/)).toBeVisible();
    expect(formulaText()).toMatch(/11/);
    expect(formulaText()).toMatch(/33/);
    expect(formulaText()).not.toMatch(/22/);
  });

  it('selects a field as the initial value and reverts to a custom constant', async () => {
    await renderControlled();

    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'Hitting', exact: true }).click();
    await expect.element(page.getByText(/Formula: Hitting/)).toBeVisible();

    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'Custom Constant', exact: true }).click();
    await expect.element(page.getByText(/Formula: 0/)).toBeVisible();
  });

  it('initial constant ignores non-numeric input and accepts numbers', async () => {
    await renderControlled();

    const initialInput = document.querySelector('input[type="numeric"]') as HTMLInputElement;
    setInputValue(initialInput, '4');
    await expect.element(page.getByText(/Formula: 4/)).toBeVisible();

    setInputValue(initialInput, 'abc');
    await expect.element(page.getByText(/Formula: 4/)).toBeVisible();
  });

  it('adds a step, changes its operation, and switches its operand between field and constant', async () => {
    await renderControlled();

    await page.getByText('Add Step').click();
    await expect.element(page.getByText('Step 1')).toBeVisible();

    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'multiply', exact: true }).click();
    await expect.element(page.getByText(/\*=/)).toBeVisible();

    await page.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: 'Running', exact: true }).click();
    await expect.element(page.getByText(/\*=\s+Running/)).toBeVisible();

    await page.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: 'Custom Constant', exact: true }).click();
    const operandInput = document.querySelectorAll('input[type="numeric"]')[1] as HTMLInputElement;
    setInputValue(operandInput, '7');
    await expect.element(page.getByText(/\*=\s+7/)).toBeVisible();

    setInputValue(operandInput, 'xyz');
    await expect.element(page.getByText(/\*=\s+7/)).toBeVisible();
  });
});
