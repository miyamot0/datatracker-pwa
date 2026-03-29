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

vi.mock('@/lib/analytics/analytics-consent', () => ({
  getConsent: vi.fn(() => 'denied'),
  setConsent: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabAdministrative } from '../settings-tab-admin';
import { SettingsDisplayEnum } from '@/types/settings';

// ----- Tests -----

describe('SettingsTabAdministrative', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Admin}>
        <SettingsTabAdministrative />
      </Tabs>,
    );

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Allow Elevated Privileges label', () => {
    renderWithTabs();
    expect(screen.getByText('Allow Elevated Privileges')).not.toBeNull();
  });

  it('renders the elevated privileges description', () => {
    renderWithTabs();
    expect(screen.getByText(/Display options for copying\/deleting\/renaming records/i)).not.toBeNull();
  });

  it("renders the Enforce 'DataTracker' Folder Name label", () => {
    renderWithTabs();
    expect(screen.getByText("Enforce 'DataTracker' Folder Name")).not.toBeNull();
  });

  it('renders the enforce folder name description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select whether to allow folders named other than/i)).not.toBeNull();
  });

  it('renders the anonymous error logging label', () => {
    renderWithTabs();
    expect(screen.getByText('Contribute Anonymous Error Logging')).not.toBeNull();
  });

  it('renders the analytics consent description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select whether to allow anonymous error logging/i)).not.toBeNull();
  });

  it('renders three Select triggers', () => {
    renderWithTabs();
    // Each SettingsFormItemWrapper adds one SelectTrigger
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBe(3);
  });
});
