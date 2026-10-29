import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, type ConfirmDialogProps } from '../confirm-dialog';

const renderDialog = (overrides: Partial<ConfirmDialogProps> = {}) => {
  const props: ConfirmDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete Evaluation',
    onConfirm: vi.fn(),
    ...overrides,
  };

  render(<ConfirmDialog {...props} />);

  return props;
};

describe('ConfirmDialog', () => {
  it('renders the title, description, and default labels', async () => {
    renderDialog({ description: 'This cannot be undone.' });

    await expect.element(page.getByRole('dialog')).toBeVisible();
    await expect.element(page.getByText('Delete Evaluation')).toBeVisible();
    await expect.element(page.getByText('This cannot be undone.')).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
  });

  it('omits the description when none is provided', async () => {
    renderDialog();

    await expect.element(page.getByRole('dialog')).toBeVisible();
    await expect.element(page.getByText('This cannot be undone.')).not.toBeInTheDocument();
  });

  it('calls onConfirm and closes when confirmed', async () => {
    const props = renderDialog({ confirmLabel: 'Delete' });

    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not call onConfirm when canceled', async () => {
    const props = renderDialog({ cancelLabel: 'Keep' });

    await page.getByRole('button', { name: 'Keep', exact: true }).click();

    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when dismissed with Escape', async () => {
    const onCancel = vi.fn();
    const props = renderDialog({ onCancel });

    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not call onCancel when confirmed', async () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel, confirmLabel: 'Save' });

    await page.getByRole('button', { name: 'Save', exact: true }).click();

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('focuses the confirm button on open when autoFocusConfirm is set', async () => {
    renderDialog({ autoFocusConfirm: true, confirmLabel: 'Save' });

    await expect.element(page.getByRole('button', { name: 'Save', exact: true })).toHaveFocus();
  });

  it('styles the confirm button as destructive when requested', async () => {
    renderDialog({ confirmLabel: 'Delete', destructive: true });

    await expect.element(page.getByRole('button', { name: 'Delete', exact: true })).toHaveClass('bg-destructive');
  });

  it('uses the default button style when not destructive', async () => {
    renderDialog({ confirmLabel: 'Proceed' });

    await expect.element(page.getByRole('button', { name: 'Proceed', exact: true })).not.toHaveClass('bg-destructive');
  });
});
