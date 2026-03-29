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

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabNotifications } from '../settings-tab-notifications';
import { SettingsDisplayEnum } from '@/types/settings';

// ----- Tests -----

describe('SettingsTabNotifications', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Notifications}>
        <SettingsTabNotifications />
      </Tabs>,
    );

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Notification Level label', () => {
    renderWithTabs();
    expect(screen.getByText('Notification Level')).not.toBeNull();
  });

  it('renders the notification level description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select the range and types of notifications provided/i)).not.toBeNull();
  });

  it('renders the Visual Tooltip Level label', () => {
    renderWithTabs();
    expect(screen.getByText('Visual Tooltip Level')).not.toBeNull();
  });

  it('renders the tooltip level description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select the range and level of visual tooltips provided/i)).not.toBeNull();
  });

  it('renders two Select triggers', () => {
    renderWithTabs();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBe(2);
  });
});
