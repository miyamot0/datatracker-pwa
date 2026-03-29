import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => ({
    options: { defaultViewTransition: undefined },
  })),
}));

vi.mock('@/components/ui/theme-provider', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabDisplay } from '../settings-tab-display';
import { SettingsDisplayEnum } from '@/types/settings';

// ----- Tests -----

describe('SettingsTabDisplay', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Display}>
        <SettingsTabDisplay />
      </Tabs>,
    );

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Visual Theme label', () => {
    renderWithTabs();
    expect(screen.getByText('Visual Theme')).not.toBeNull();
  });

  it('renders the Visual Theme description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select light\/dark\/system themes/i)).not.toBeNull();
  });

  it('renders the Transitions/Animations label', () => {
    renderWithTabs();
    expect(screen.getByText('Transitions/Animations')).not.toBeNull();
  });

  it('renders the transitions description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select or disable animations when traversing/i)).not.toBeNull();
  });

  it('renders the Application Layout label', () => {
    renderWithTabs();
    expect(screen.getByText('Application Layout')).not.toBeNull();
  });

  it('renders the application layout description', () => {
    renderWithTabs();
    expect(screen.getByText(/Set preferred widths for application/i)).not.toBeNull();
  });

  it('renders multiple Select triggers', () => {
    renderWithTabs();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBeGreaterThanOrEqual(3);
  });
});
