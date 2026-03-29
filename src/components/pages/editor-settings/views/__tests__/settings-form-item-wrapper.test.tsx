import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SettingsFormItemWrapper from '../settings-form-item-wrapper';

describe('SettingsFormItemWrapper', () => {
  it('renders the Label text', () => {
    render(
      <SettingsFormItemWrapper Label="My Label" Description="My description">
        <span />
      </SettingsFormItemWrapper>,
    );
    expect(screen.getByText('My Label')).not.toBeNull();
  });

  it('renders the Label with font-semibold class', () => {
    render(
      <SettingsFormItemWrapper Label="Bold Label" Description="desc">
        <span />
      </SettingsFormItemWrapper>,
    );
    const label = screen.getByText('Bold Label');
    expect(label.className).toContain('font-semibold');
  });

  it('renders the Description text', () => {
    render(
      <SettingsFormItemWrapper Label="Label" Description="Helpful description">
        <span />
      </SettingsFormItemWrapper>,
    );
    expect(screen.getByText('Helpful description')).not.toBeNull();
  });

  it('renders the Description with text-sm class', () => {
    render(
      <SettingsFormItemWrapper Label="Label" Description="Small text">
        <span />
      </SettingsFormItemWrapper>,
    );
    const desc = screen.getByText('Small text');
    expect(desc.className).toContain('text-sm');
  });

  it('renders children', () => {
    render(
      <SettingsFormItemWrapper Label="Label" Description="desc">
        <button>Click me</button>
      </SettingsFormItemWrapper>,
    );
    expect(screen.getByRole('button', { name: 'Click me' })).not.toBeNull();
  });

  it('renders multiple children', () => {
    render(
      <SettingsFormItemWrapper Label="Label" Description="desc">
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </SettingsFormItemWrapper>,
    );
    expect(screen.getByTestId('child-a')).not.toBeNull();
    expect(screen.getByTestId('child-b')).not.toBeNull();
  });
});
