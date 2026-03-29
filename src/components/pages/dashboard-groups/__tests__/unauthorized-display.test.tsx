// @ts-nocheck

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UnauthorizedDisplay from '../unauthorized-display';
import { FolderHandleContext } from '@/context/folder-context';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { ApplicationSettingsTypes } from '@/types/settings';

// ----- Module mocks -----

const mockInvalidate = vi.fn().mockResolvedValue(undefined);

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouter: () => ({ invalidate: mockInvalidate }),
    useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
  };
});

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

import { displayConditionalNotification } from '@/lib/notifications';

const mockDisplayNotification = displayConditionalNotification as ReturnType<typeof vi.fn>;

// ----- Helpers -----

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

function renderWithContext(
  settings: Partial<ApplicationSettingsTypes> = {},
  setHandle: ReturnType<typeof vi.fn> = vi.fn(),
) {
  const contextSettings = { ...DEFAULT_APPLICATION_SETTINGS, ...settings };
  return render(
    <FolderHandleContext.Provider
      value={{
        handle: undefined,
        setHandle,
        settings: contextSettings,
        setSettings: vi.fn(),
        saveSettings: vi.fn(),
        isInitialized: false,
        setIsInitialized: vi.fn(),
      }}
    >
      <UnauthorizedDisplay />
    </FolderHandleContext.Provider>,
  );
}

// ----- Tests -----

describe('UnauthorizedDisplay', () => {
  let showDirectoryPickerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockInvalidate.mockClear();
    mockDisplayNotification.mockClear();
    // jsdom does not implement showDirectoryPicker — define it so we can mock it
    showDirectoryPickerMock = vi.fn();
    (window as unknown as Record<string, unknown>).showDirectoryPicker = showDirectoryPickerMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('renders the card title', () => {
      renderWithContext();
      expect(screen.getByText('Program Access and Authorization')).not.toBeNull();
    });

    it('renders the card description', () => {
      renderWithContext();
      expect(screen.getByText(/You need to authorize the program/)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      renderWithContext();
      expect(screen.getByText('Back')).not.toBeNull();
    });

    it('renders the informational content paragraphs', () => {
      renderWithContext();
      expect(screen.getByText(/Web-apps need to have/)).not.toBeNull();
      expect(screen.getByText(/Depending on your settings/)).not.toBeNull();
    });

    it('renders the Authorize Access button', () => {
      renderWithContext();
      expect(screen.getByRole('button', { name: 'Authorize Access' })).not.toBeNull();
    });
  });

  // ---- Directory picker: cancelled by user ----

  describe('when the user cancels the directory picker', () => {
    it('does not call setHandle', async () => {
      const setHandle = vi.fn();
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new DOMException('User cancelled', 'AbortError'),
      );
      renderWithContext({}, setHandle);
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(setHandle).not.toHaveBeenCalled();
      });
    });

    it('shows an error notification when picker throws', async () => {
      const error = new Error('User cancelled');
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockRejectedValue(error);
      renderWithContext();
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(mockDisplayNotification).toHaveBeenCalledWith(
          expect.anything(),
          'Error Authorizing Directory',
          'User cancelled',
          3000,
          true,
        );
      });
    });
  });

  // ---- Directory picker: wrong folder name ----

  describe('when EnforceDataFolderName is true and wrong folder is selected', () => {
    it('shows an error notification and does not call setHandle', async () => {
      const setHandle = vi.fn();
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockResolvedValue(makeHandle('WrongFolder'));
      renderWithContext({ EnforceDataFolderName: true }, setHandle);
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(mockDisplayNotification).toHaveBeenCalledWith(
          expect.anything(),
          'Error Authorizing Directory',
          expect.stringContaining("'DataTracker'"),
          3000,
          true,
        );
        expect(setHandle).not.toHaveBeenCalled();
      });
    });
  });

  // ---- Directory picker: enforcement off, any folder accepted ----

  describe('when EnforceDataFolderName is false', () => {
    it('calls setHandle even if the folder is not named DataTracker', async () => {
      const setHandle = vi.fn();
      const handle = makeHandle('AnyFolder');
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockResolvedValue(handle);
      renderWithContext({ EnforceDataFolderName: false }, setHandle);
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(setHandle).toHaveBeenCalledWith(handle);
      });
    });

    it('shows a success notification after authorizing', async () => {
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockResolvedValue(makeHandle('AnyFolder'));
      renderWithContext({ EnforceDataFolderName: false });
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(mockDisplayNotification).toHaveBeenCalledWith(
          expect.anything(),
          'Access Authorized',
          expect.any(String),
        );
      });
    });
  });

  // ---- Directory picker: correct DataTracker folder ----

  describe('when EnforceDataFolderName is true and DataTracker folder is selected', () => {
    it('calls setHandle with the directory handle', async () => {
      const setHandle = vi.fn();
      const handle = makeHandle('DataTracker');
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockResolvedValue(handle);
      renderWithContext({ EnforceDataFolderName: true }, setHandle);
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(setHandle).toHaveBeenCalledWith(handle);
      });
    });

    it('invalidates the router after authorizing', async () => {
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockResolvedValue(makeHandle('DataTracker'));
      renderWithContext({ EnforceDataFolderName: true });
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(mockInvalidate).toHaveBeenCalled();
      });
    });

    it('shows a success notification', async () => {
      (showDirectoryPickerMock as ReturnType<typeof vi.fn>).mockResolvedValue(makeHandle('DataTracker'));
      renderWithContext({ EnforceDataFolderName: true });
      fireEvent.click(screen.getByRole('button', { name: 'Authorize Access' }));
      await waitFor(() => {
        expect(mockDisplayNotification).toHaveBeenCalledWith(
          expect.anything(),
          'Access Authorized',
          expect.any(String),
        );
      });
    });
  });
});
