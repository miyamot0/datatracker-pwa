// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';

const mockDisplayConditionalNotification = vi.hoisted(() => vi.fn());
const mockCallback = vi.hoisted(() => vi.fn());
const mockConsoleError = vi.hoisted(() => vi.fn());

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

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => <input value={value} onChange={onChange} {...props} />,
}));

vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onSelect, className }: any) => (
      <button
        className={className}
        onClick={() => {
          onSelect?.({ preventDefault: vi.fn() });
        }}
      >
        {children}
      </button>
    ),
  };
});

vi.mock('@/components/ui/dialog', async () => {
  const ReactLocal = await import('react');
  const Ctx = ReactLocal.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

  return {
    Dialog: ({ open, onOpenChange, children }: any) => (
      <Ctx.Provider value={{ open: Boolean(open), onOpenChange }}>{children}</Ctx.Provider>
    ),
    DialogTrigger: ({ asChild, children }: any) => {
      const ctx = ReactLocal.useContext(Ctx);
      const child = ReactLocal.Children.only(children);
      return ReactLocal.cloneElement(child, {
        onClick: (e: any) => {
          child.props.onClick?.(e);
          ctx?.onOpenChange(true);
        },
      });
    },
    DialogContent: ({ children, className }: any) => {
      const ctx = ReactLocal.useContext(Ctx);
      if (!ctx?.open) return null;
      return (
        <div className={className}>
          {children}
          <button onClick={() => ctx.onOpenChange(false)}>Close</button>
        </div>
      );
    },
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
  };
});

vi.mock('@/components/ui/select', async () => {
  const ReactLocal = await import('react');
  const SelectCtx = ReactLocal.createContext<{ onValueChange?: (value: string) => void }>({});

  return {
    Select: ({ onValueChange, children }: any) => (
      <SelectCtx.Provider value={{ onValueChange }}>
        <div>
          {children}
          <input
            aria-label="manual-select-input"
            onChange={(e: any) => onValueChange?.(e.target.value)}
            value=""
            readOnly={false}
          />
        </div>
      </SelectCtx.Provider>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const ctx = ReactLocal.useContext(SelectCtx);
      return <button onClick={() => ctx.onValueChange?.(value)}>{children}</button>;
    },
  };
});

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

const setManualSelectValue = (index: number, value: string) => {
  const selects = document.querySelectorAll('input[aria-label="manual-select-input"]');
  const input = selects[index] as HTMLInputElement;
  setInputValue(input, value);
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
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError);
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

  it('updates initial source between field and constant and handles NaN numeric input', async () => {
    await renderLogical();
    await openDialog();

    // First select controls initial value source.
    setManualSelectValue(0, 'field.Hitting');
    await expect.element(page.getByText(/Formula: Hitting/)).toBeVisible();

    setManualSelectValue(0, 'constant');
    await expect.element(page.getByText(/Formula: 0/)).toBeVisible();

    const numericInputs = document.querySelectorAll('input[type="numeric"]');
    const initialInput = numericInputs[0] as HTMLInputElement;
    setInputValue(initialInput, 'abc');
    await expect.element(page.getByText(/Formula: 0/)).toBeVisible();
  });

  it('covers operation switch cases and operand branches including unknown field', async () => {
    await renderLogical();
    await openDialog();
    await page.getByText('Add Step').click();

    // Step operation select is index 1 after initial select.
    setManualSelectValue(1, 'subtract');
    await expect.element(page.getByText(/Formula: 0  -=  0/)).toBeVisible();

    setManualSelectValue(1, 'multiply');
    await expect.element(page.getByText(/Formula: 0  \*=  0/)).toBeVisible();

    setManualSelectValue(1, 'divide');
    await expect.element(page.getByText(/Formula: 0  \/=  0/)).toBeVisible();

    // Step operand select is index 2.
    setManualSelectValue(2, 'field.Running');
    await expect.element(page.getByText(/Formula: 0  \/=  Running/)).toBeVisible();

    setManualSelectValue(2, 'constant');
    await expect.element(page.getByText(/Formula: 0  \/=  0/)).toBeVisible();

    // Unknown field value should hit the console.error branch.
    setManualSelectValue(2, 'field.DoesNotExist');
    expect(mockConsoleError).toHaveBeenCalledWith('Selected field not found for operand:', 'field.DoesNotExist');
  });

  it('updates step constant operand numeric input and ignores NaN', async () => {
    await renderLogical();
    await openDialog();
    await page.getByText('Add Step').click();

    const numericInputs = document.querySelectorAll('input[type="numeric"]');
    const stepInput = numericInputs[1] as HTMLInputElement;
    setInputValue(stepInput, '3');
    await expect.element(page.getByText(/Formula: 0  \+=  3/)).toBeVisible();

    setInputValue(stepInput, 'NaN');
    await expect.element(page.getByText(/Formula: 0  \+=  3/)).toBeVisible();
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

  it('resets form after successful save and reopen', async () => {
    await renderLogical();
    await openDialog();

    setInputValue(nameInput(), 'Derived Example');
    await page.getByText('Add Step').click();
    await page.getByText('Save Derived Key').click();

    await openDialog();
    expect(nameInput().value).toBe('');
    expect(stepCount()).toBe(0);
  });
});
