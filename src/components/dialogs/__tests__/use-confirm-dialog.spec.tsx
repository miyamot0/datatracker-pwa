import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { useConfirmDialog } from '../use-confirm-dialog';

const onConfirm = vi.hoisted(() => vi.fn());

function Harness() {
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          openConfirmDialog({
            title: 'Delete Group',
            description: 'This CANNOT be undone.',
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm,
          })
        }
      >
        Open
      </button>
      {confirmDialog}
    </>
  );
}

describe('useConfirmDialog', () => {
  it('renders nothing until a dialog is requested', async () => {
    render(<Harness />);

    await expect.element(page.getByRole('button', { name: 'Open' })).toBeVisible();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the lazy dialog and runs onConfirm', async () => {
    onConfirm.mockClear();
    render(<Harness />);

    await page.getByRole('button', { name: 'Open' }).click();
    await expect.element(page.getByText('Delete Group')).toBeVisible();

    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes without running onConfirm when canceled', async () => {
    onConfirm.mockClear();
    render(<Harness />);

    await page.getByRole('button', { name: 'Open' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(onConfirm).not.toHaveBeenCalled();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });
});
