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
import { SettingsTabIO } from '../settings-tab-io';
import { SettingsDisplayEnum } from '@/types/settings';

// ----- Tests -----

describe('SettingsTabIO', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.File}>
        <SettingsTabIO />
      </Tabs>,
    );

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Records Caching label', () => {
    renderWithTabs();
    expect(screen.getByText('Records Caching')).not.toBeNull();
  });

  it('renders the records caching description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select how aggressively to cache records/i)).not.toBeNull();
  });

  it('renders the Session Recorder Rendering label', () => {
    renderWithTabs();
    expect(screen.getByText('Session Recorder Rendering')).not.toBeNull();
  });

  it('renders the session recorder description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select the frequency of UI updates/i)).not.toBeNull();
  });

  it('renders the Post-Session Program Behavior label', () => {
    renderWithTabs();
    expect(screen.getByText('Post-Session Program Behavior')).not.toBeNull();
  });

  it('renders the post-session description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select how you wish the program to behave after recording sessions/i)).not.toBeNull();
  });

  it('renders three Select triggers', () => {
    renderWithTabs();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBe(3);
  });
});
