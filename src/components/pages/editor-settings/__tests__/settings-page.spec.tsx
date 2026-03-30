// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div data-testid="page-wrapper" data-label={label}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

vi.mock('../views/settings-tab-display', () => ({
  SettingsTabDisplay: () => <div data-testid="tab-display">Display</div>,
}));

vi.mock('../views/settings-tab-notifications', () => ({
  SettingsTabNotifications: () => <div data-testid="tab-notifications">Notifications</div>,
}));

vi.mock('../views/settings-tab-io', () => ({
  SettingsTabIO: () => <div data-testid="tab-io">IO</div>,
}));

vi.mock('../views/settings-tab-admin', () => ({
  SettingsTabAdministrative: () => <div data-testid="tab-admin">Admin</div>,
}));

// ----- Import under test -----

import SettingsPage from '../settings-page';

// ----- Tests -----

describe('SettingsPage', () => {
  it('renders without crashing', async () => {
    const { container } = await render(<SettingsPage />);
    expect(container).not.toBeNull();
  });

  it('renders inside PageWrapper with label "Settings"', async () => {
    await render(<SettingsPage />);
    const wrapper = page.getByTestId('page-wrapper');
    await expect.element(wrapper).toBeInTheDocument();
    await expect.element(wrapper).toHaveAttribute('data-label', 'Settings');
  });

  it('renders the Application Settings card title', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByText('Application Settings')).toBeInTheDocument();
  });

  it('renders the card description', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByText('Manage and Update Settings for Data Tracker')).toBeInTheDocument();
  });

  it('renders the back button', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByTestId('back-button')).toBeInTheDocument();
  });

  it('renders the Display tab trigger', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByRole('tab', { name: 'Theme and Layout' })).toBeInTheDocument();
  });

  it('renders the Notifications tab trigger', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByRole('tab', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('renders the Performance (File) tab trigger', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByRole('tab', { name: 'Performance' })).toBeInTheDocument();
  });

  it('renders the Administrative tab trigger', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByRole('tab', { name: 'Administrative' })).toBeInTheDocument();
  });

  it('renders the Display tab content', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByTestId('tab-display')).toBeInTheDocument();
  });

  it('renders the Notifications tab content', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByTestId('tab-notifications')).toBeInTheDocument();
  });

  it('renders the IO tab content', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByTestId('tab-io')).toBeInTheDocument();
  });

  it('renders the Admin tab content', async () => {
    await render(<SettingsPage />);
    await expect.element(page.getByTestId('tab-admin')).toBeInTheDocument();
  });
});
