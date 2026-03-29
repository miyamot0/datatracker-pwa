import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsTabContainer } from '../settings-tab-container';

describe('SettingsTabContainer', () => {
  it('renders children', () => {
    render(
      <SettingsTabContainer>
        <span data-testid="child">Content</span>
      </SettingsTabContainer>,
    );
    expect(screen.getByTestId('child')).not.toBeNull();
  });

  it('renders multiple children', () => {
    render(
      <SettingsTabContainer>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </SettingsTabContainer>,
    );
    expect(screen.getByTestId('first')).not.toBeNull();
    expect(screen.getByTestId('second')).not.toBeNull();
  });

  it('renders a div wrapper with flex column layout class', () => {
    const { container } = render(
      <SettingsTabContainer>
        <span>Child</span>
      </SettingsTabContainer>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-col');
  });

  it('renders a div wrapper with full width class', () => {
    const { container } = render(
      <SettingsTabContainer>
        <span>Child</span>
      </SettingsTabContainer>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('w-full');
  });
});
