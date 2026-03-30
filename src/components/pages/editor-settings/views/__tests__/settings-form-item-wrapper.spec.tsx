import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { describe, it, expect } from 'vitest';
import SettingsFormItemWrapper from '../settings-form-item-wrapper';

describe('SettingsFormItemWrapper', () => {
  it('renders the Label text', async () => {
    await render(
      <SettingsFormItemWrapper Label="My Label" Description="My description">
        <span />
      </SettingsFormItemWrapper>,
    );
    await expect.element(page.getByText('My Label')).toBeInTheDocument();
  });

  it('renders the Label with font-semibold class', async () => {
    await render(
      <SettingsFormItemWrapper Label="Bold Label" Description="desc">
        <span />
      </SettingsFormItemWrapper>,
    );
    await expect.element(page.getByText('Bold Label')).toHaveClass('font-semibold');
  });

  it('renders the Description text', async () => {
    await render(
      <SettingsFormItemWrapper Label="Label" Description="Helpful description">
        <span />
      </SettingsFormItemWrapper>,
    );
    await expect.element(page.getByText('Helpful description')).toBeInTheDocument();
  });

  it('renders the Description with text-sm class', async () => {
    await render(
      <SettingsFormItemWrapper Label="Label" Description="Small text">
        <span />
      </SettingsFormItemWrapper>,
    );
    await expect.element(page.getByText('Small text')).toHaveClass('text-sm');
  });

  it('renders children', async () => {
    await render(
      <SettingsFormItemWrapper Label="Label" Description="desc">
        <button>Click me</button>
      </SettingsFormItemWrapper>,
    );
    await expect.element(page.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders multiple children', async () => {
    await render(
      <SettingsFormItemWrapper Label="Label" Description="desc">
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </SettingsFormItemWrapper>,
    );
    await expect.element(page.getByTestId('child-a')).toBeInTheDocument();
    await expect.element(page.getByTestId('child-b')).toBeInTheDocument();
  });
});
