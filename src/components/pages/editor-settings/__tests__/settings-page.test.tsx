import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SettingsPage from '../settings-page';
import { SettingsDisplayEnum } from '@/types/settings';

// ----- Module mocks -----

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-wrapper">{children}</div>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('../views/settings-tab-display', () => ({
  SettingsTabDisplay: () => <div data-testid="tab-display">Display Tab Content</div>,
}));

vi.mock('../views/settings-tab-io', () => ({
  SettingsTabIO: () => <div data-testid="tab-io">IO Tab Content</div>,
}));

vi.mock('../views/settings-tab-notifications', () => ({
  SettingsTabNotifications: () => <div data-testid="tab-notifications">Notifications Tab Content</div>,
}));

vi.mock('../views/settings-tab-admin', () => ({
  SettingsTabAdministrative: () => <div data-testid="tab-admin">Admin Tab Content</div>,
}));

// ----- Tests -----

describe('SettingsPage', () => {
  // ---- Static rendering ----

  describe('static rendering', () => {
    it('renders inside a PageWrapper', () => {
      render(<SettingsPage />);
      expect(screen.getByTestId('page-wrapper')).not.toBeNull();
    });

    it('renders the Application Settings card title', () => {
      render(<SettingsPage />);
      expect(screen.getByText('Application Settings')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<SettingsPage />);
      expect(screen.getByText(/Manage and Update Settings for Data Tracker/i)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<SettingsPage />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });
  });

  // ---- Tabs ----

  describe('tab triggers', () => {
    it('renders the Theme and Layout tab trigger', () => {
      render(<SettingsPage />);
      expect(screen.getByRole('tab', { name: SettingsDisplayEnum.Display })).not.toBeNull();
    });

    it('renders the Notifications tab trigger', () => {
      render(<SettingsPage />);
      expect(screen.getByRole('tab', { name: SettingsDisplayEnum.Notifications })).not.toBeNull();
    });

    it('renders the Performance tab trigger', () => {
      render(<SettingsPage />);
      expect(screen.getByRole('tab', { name: SettingsDisplayEnum.File })).not.toBeNull();
    });

    it('renders the Administrative tab trigger', () => {
      render(<SettingsPage />);
      expect(screen.getByRole('tab', { name: SettingsDisplayEnum.Admin })).not.toBeNull();
    });

    it('the Display tab is active by default', () => {
      render(<SettingsPage />);
      const displayTab = screen.getByRole('tab', { name: SettingsDisplayEnum.Display });
      expect(displayTab.getAttribute('data-state')).toBe('active');
    });

    it('the other tabs are inactive by default', () => {
      render(<SettingsPage />);
      const notificationsTab = screen.getByRole('tab', { name: SettingsDisplayEnum.Notifications });
      expect(notificationsTab.getAttribute('data-state')).toBe('inactive');
    });
  });

  // ---- Tab content ----

  describe('tab content panels', () => {
    it('renders the mocked Display tab content', () => {
      render(<SettingsPage />);
      expect(screen.getByTestId('tab-display')).not.toBeNull();
    });

    it('renders the mocked Notifications tab content', () => {
      render(<SettingsPage />);
      expect(screen.getByTestId('tab-notifications')).not.toBeNull();
    });

    it('renders the mocked IO tab content', () => {
      render(<SettingsPage />);
      expect(screen.getByTestId('tab-io')).not.toBeNull();
    });

    it('renders the mocked Admin tab content', () => {
      render(<SettingsPage />);
      expect(screen.getByTestId('tab-admin')).not.toBeNull();
    });
  });
});
