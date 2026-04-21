import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { SettingsTabContainer } from '../settings-tab-container';

describe('SettingsTabContainer', () => {
  it('renders children', async () => {
    await render(
      <SettingsTabContainer>
        <span data-testid="child">Content</span>
      </SettingsTabContainer>,
    );
    await expect.element(page.getByTestId('child')).toBeInTheDocument();
  });

  it('renders multiple children', async () => {
    await render(
      <SettingsTabContainer>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </SettingsTabContainer>,
    );
    await expect.element(page.getByTestId('first')).toBeInTheDocument();
    await expect.element(page.getByTestId('second')).toBeInTheDocument();
  });

  it('renders a div wrapper with flex column layout class', async () => {
    await render(
      <SettingsTabContainer>
        <span>Child</span>
      </SettingsTabContainer>,
    );
    expect(document.querySelector('.flex-col')).not.toBeNull();
  });

  it('renders a div wrapper with full width class', async () => {
    await render(
      <SettingsTabContainer>
        <span>Child</span>
      </SettingsTabContainer>,
    );
    expect(document.querySelector('.w-full')).not.toBeNull();
  });
});
