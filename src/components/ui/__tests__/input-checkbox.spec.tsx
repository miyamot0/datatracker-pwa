import { createRef } from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';

import '@/styles/globals.css';
import { Input } from '../input';
import { Checkbox } from '../checkbox';

describe('Input', () => {
  it('renders a text input by default with merged classes', async () => {
    await render(<Input placeholder="Type here" className="extra-class" />);
    const input = page.getByPlaceholder('Type here');
    await expect.element(input).toHaveClass('extra-class');
    await expect.element(input).toHaveClass('rounded-md');
  });

  it('passes the type attribute through', async () => {
    await render(<Input type="email" placeholder="Email" />);
    await expect.element(page.getByPlaceholder('Email')).toHaveAttribute('type', 'email');
  });

  it('forwards the ref to the input element', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('reports changes through onChange', async () => {
    const onChange = vi.fn();
    await render(<Input placeholder="Change me" onChange={onChange} />);
    await page.getByPlaceholder('Change me').fill('abc');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Checkbox', () => {
  it('renders an unchecked checkbox by default', async () => {
    await render(<Checkbox aria-label="Agree" />);
    await expect.element(page.getByRole('checkbox', { name: 'Agree' })).not.toBeChecked();
  });

  it('shows the checked state and merges className', async () => {
    await render(<Checkbox aria-label="Checked box" defaultChecked className="extra" />);
    const box = page.getByRole('checkbox', { name: 'Checked box' });
    await expect.element(box).toBeChecked();
    await expect.element(box).toHaveClass('extra');
  });

  it('toggles and reports the new value through onCheckedChange', async () => {
    const onCheckedChange = vi.fn();
    await render(<Checkbox aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    await page.getByRole('checkbox', { name: 'Toggle' }).click();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it('forwards the ref to the checkbox root', async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(<Checkbox aria-label="Ref box" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
