import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { useNameDialog } from '../use-name-dialog';

const onSubmit = vi.hoisted(() => vi.fn());

function Harness() {
  const { openNameDialog, nameDialog } = useNameDialog();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          openNameDialog({
            title: 'Create a New Group',
            entityLabel: 'Group',
            submitLabel: 'Create group',
            existingNames: ['GroupA'],
            onSubmit,
          })
        }
      >
        Open
      </button>
      {nameDialog}
    </>
  );
}

describe('useNameDialog', () => {
  it('renders nothing until a dialog is requested', async () => {
    render(<Harness />);

    await expect.element(page.getByRole('button', { name: 'Open' })).toBeVisible();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the lazy dialog and submits the name', async () => {
    onSubmit.mockClear();
    render(<Harness />);

    await page.getByRole('button', { name: 'Open' }).click();
    await expect.element(page.getByText('Create a New Group')).toBeVisible();

    await page.getByLabelText('Group Name').fill('GroupB');
    await page.getByRole('button', { name: 'Create group', exact: true }).click();

    expect(onSubmit).toHaveBeenCalledWith('GroupB');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes without submitting when canceled', async () => {
    onSubmit.mockClear();
    render(<Harness />);

    await page.getByRole('button', { name: 'Open' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(onSubmit).not.toHaveBeenCalled();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });
});
