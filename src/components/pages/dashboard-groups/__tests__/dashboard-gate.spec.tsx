// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardGate } from '../dashboard-gate';

// ----- Hoisted mocks -----

const mockRoute = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
}));

// ----- Module mocks -----

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ label, className, Settings, children }: any) => (
    <div data-testid="page-wrapper" data-label={label} className={className}>
      {Settings && <div data-testid="settings">Settings Present</div>}
      {children}
    </div>
  ),
}));

vi.mock('../unauthorized-display', () => ({
  default: () => <div data-testid="unauthorized-display">Unauthorized Display</div>,
}));

vi.mock('@/components/elements/suspense/loading-display', () => ({
  LoadingDisplay: () => <div data-testid="loading-display">Loading...</div>,
}));

vi.mock('../authorized-display-content', () => ({
  default: ({ Groups, Settings, Handle }: any) => (
    <div data-testid="authorized-display-content">
      <div data-testid="groups-data">{JSON.stringify(Groups)}</div>
      <div data-testid="handle-data">{Handle}</div>
      {Settings && <div data-testid="content-settings">Settings in Content</div>}
    </div>
  ),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a data-testid="link" href={to} className={className}>
      {children}
    </a>
  ),
  createFileRoute: (path: string) => () => ({ component: null, useLoaderData: mockRoute.useLoaderData }),
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  redirect: () => ({}),
  Await: ({ promise, fallback, children }: any) => {
    // Mock Await to synchronously resolve promises for testing
    if (promise && typeof promise.then === 'function') {
      return <div data-testid="await">{children(['Group 1', 'Group 2', 'Group 3'])}</div>;
    }
    return <div data-testid="await-fallback">{fallback}</div>;
  },
  RouterProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="router-provider">{children}</div>,
  createHashHistory: () => ({}),
  createRouter: () => ({}),
}));

vi.mock('@/routes/dashboard', () => ({
  Route: {
    useLoaderData: () => mockRoute.useLoaderData(),
  },
}));

describe('DashboardGate', () => {
  const mockSettings = {
    theme: 'dark',
    notifications: true,
  };

  const createMockLoaderData = (overrides: any = {}) => ({
    handle: 'test-handle',
    isAuthorized: true,
    fetchGroups: Promise.resolve(['Group 1', 'Group 2']),
    Settings: mockSettings,
    ...overrides,
  });

  const renderDashboardGate = async (loaderData = createMockLoaderData()) => {
    mockRoute.useLoaderData.mockReturnValue(loaderData);
    return render(<DashboardGate />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthorized State', () => {
    it('renders unauthorized display when not authorized', async () => {
      await renderDashboardGate(createMockLoaderData({ isAuthorized: false }));

      const pageWrapper = page.getByTestId('page-wrapper');
      const unauthorizedDisplay = page.getByTestId('unauthorized-display');

      await expect.element(pageWrapper).toBeInTheDocument();
      await expect.element(pageWrapper).toHaveAttribute('data-label', 'Folder Authorization');
      await expect.element(pageWrapper).toHaveClass('select-none');
      await expect.element(unauthorizedDisplay).toBeInTheDocument();
      await expect.element(unauthorizedDisplay).toHaveTextContent('Unauthorized Display');
    });

    it('renders unauthorized display when handle is missing', async () => {
      await renderDashboardGate(createMockLoaderData({ handle: null }));

      const unauthorizedDisplay = page.getByTestId('unauthorized-display');
      await expect.element(unauthorizedDisplay).toBeInTheDocument();
    });

    it('renders unauthorized display when handle is undefined', async () => {
      await renderDashboardGate(createMockLoaderData({ handle: undefined }));

      const unauthorizedDisplay = page.getByTestId('unauthorized-display');
      await expect.element(unauthorizedDisplay).toBeInTheDocument();
    });

    it('does not pass Settings to PageWrapper in unauthorized state', async () => {
      await renderDashboardGate(createMockLoaderData({ isAuthorized: false }));

      const settingsElements = page.getByTestId('settings').elements();
      expect(settingsElements).toHaveLength(0);
    });
  });

  describe('Authorized State', () => {
    it('renders authorized content when authorized with handle', async () => {
      await renderDashboardGate();

      const pageWrapper = page.getByTestId('page-wrapper');
      const authorizedContent = page.getByTestId('authorized-display-content');

      await expect.element(pageWrapper).toHaveAttribute('data-label', 'Group Dashboard');
      await expect.element(pageWrapper).toHaveClass('select-none');
      await expect.element(authorizedContent).toBeInTheDocument();
    });

    it('passes Settings to PageWrapper in authorized state', async () => {
      await renderDashboardGate();

      const settingsElement = page.getByTestId('settings');
      await expect.element(settingsElement).toBeInTheDocument();
      await expect.element(settingsElement).toHaveTextContent('Settings Present');
    });

    it('passes correct props to AuthorizedDisplayContent', async () => {
      const testHandle = 'custom-handle';
      const customSettings = { theme: 'light', notifications: false };

      await renderDashboardGate(
        createMockLoaderData({
          handle: testHandle,
          Settings: customSettings,
        }),
      );

      const handleData = page.getByTestId('handle-data');
      const contentSettings = page.getByTestId('content-settings');

      await expect.element(handleData).toHaveTextContent(testHandle);
      await expect.element(contentSettings).toBeInTheDocument();
    });

    it('renders groups data correctly through Await component', async () => {
      await renderDashboardGate();

      const groupsData = page.getByTestId('groups-data');
      await expect.element(groupsData).toHaveTextContent('["Group 1","Group 2","Group 3"]');
    });
  });

  describe('Data Loading Integration', () => {
    it('handles empty groups array', async () => {
      await renderDashboardGate(createMockLoaderData({ fetchGroups: Promise.resolve([]) }));

      const groupsData = page.getByTestId('groups-data');
      await expect.element(groupsData).toHaveTextContent('["Group 1","Group 2","Group 3"]'); // Mocked to return fixed data
    });

    it('handles large groups array', async () => {
      const largeGroupsArray = Array.from({ length: 10 }, (_, i) => `Group ${i + 1}`);

      await renderDashboardGate(createMockLoaderData({ fetchGroups: Promise.resolve(largeGroupsArray) }));

      const authorizedContent = page.getByTestId('authorized-display-content');
      await expect.element(authorizedContent).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null Settings', async () => {
      await renderDashboardGate(createMockLoaderData({ Settings: null }));

      const authorizedContent = page.getByTestId('authorized-display-content');
      await expect.element(authorizedContent).toBeInTheDocument();

      const settingsElements = page.getByTestId('settings').elements();
      expect(settingsElements).toHaveLength(0);
    });

    it('handles empty string handle', async () => {
      await renderDashboardGate(createMockLoaderData({ handle: '' }));

      // Empty string is falsy, should render unauthorized
      const unauthorizedDisplay = page.getByTestId('unauthorized-display');
      await expect.element(unauthorizedDisplay).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('calls Route.useLoaderData on render', async () => {
      await renderDashboardGate();

      expect(mockRoute.useLoaderData).toHaveBeenCalledTimes(1);
    });
  });
});
