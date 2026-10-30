import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { NameDialog, type NameDialogProps } from '../name-dialog';

const renderDialog = (overrides: Partial<NameDialogProps> = {}) => {
  const props: NameDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Add an Evaluation',
    entityLabel: 'Evaluation',
    submitLabel: 'Add',
    existingNames: ['Existing'],
    onSubmit: vi.fn(),
    ...overrides,
  };

  render(<NameDialog {...props} />);

  return props;
};

describe('NameDialog', () => {
  it('renders the title, description, and title-cased label', async () => {
    renderDialog({ description: 'Pick a unique name.' });

    await expect.element(page.getByRole('dialog')).toBeVisible();
    await expect.element(page.getByText('Add an Evaluation')).toBeVisible();
    await expect.element(page.getByText('Pick a unique name.')).toBeVisible();
    await expect.element(page.getByLabelText('Evaluation Name')).toBeVisible();
  });

  it('prefills the input and shows no error for an empty value', async () => {
    renderDialog({ initialValue: 'Prefilled name' });

    await expect.element(page.getByLabelText('Evaluation Name')).toHaveValue('Prefilled name');
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it('disables submit and shows an error for a name that is too short', async () => {
    renderDialog();

    await page.getByLabelText('Evaluation Name').fill('abc');

    await expect.element(page.getByRole('alert')).toHaveTextContent('Evaluation name must be at least 4 characters long.');
    await expect.element(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
    await expect.element(page.getByLabelText('Evaluation Name')).toHaveAttribute('aria-invalid', 'true');
    await expect.element(page.getByLabelText('Evaluation Name')).toHaveAttribute('aria-describedby');
  });

  it('shows an error for a reserved name', async () => {
    renderDialog({ reservedNames: ['styles.json'] });

    await page.getByLabelText('Evaluation Name').fill('STYLES.json');

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent("'STYLES.json' is a reserved name. Choose a different name.");
    await expect.element(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
  });

  it('shows an error for an existing name, ignoring case and whitespace', async () => {
    renderDialog();

    await page.getByLabelText('Evaluation Name').fill('  existing ');

    await expect.element(page.getByRole('alert')).toHaveTextContent('Evaluation already exists.');
    await expect.element(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
  });

  it('rejects renaming to the same name', async () => {
    renderDialog({ previous: 'Current Name', initialValue: 'Current Name', submitLabel: 'Rename' });

    await expect.element(page.getByRole('alert')).toHaveTextContent('Enter a different name to rename.');
    await expect.element(page.getByRole('button', { name: 'Rename', exact: true })).toBeDisabled();
  });

  it('submits the trimmed name and closes', async () => {
    const props = renderDialog();

    await page.getByLabelText('Evaluation Name').fill('  New Evaluation  ');
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    expect(props.onSubmit).toHaveBeenCalledWith('New Evaluation');
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits on Enter when valid', async () => {
    const props = renderDialog();

    await page.getByLabelText('Evaluation Name').fill('Enter Submit');
    await userEvent.keyboard('{Enter}');

    expect(props.onSubmit).toHaveBeenCalledWith('Enter Submit');
  });

  it('ignores Enter while the name is invalid', async () => {
    const props = renderDialog();

    await page.getByLabelText('Evaluation Name').fill('abc');
    await userEvent.keyboard('{Enter}');

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('does not submit when Cancel is clicked', async () => {
    const props = renderDialog();

    await page.getByLabelText('Evaluation Name').fill('Valid Name');
    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});
