import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthorizationStatus from '../authorization-status';

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

describe('AuthorizationStatus', () => {
  describe('when handle is undefined', () => {
    beforeEach(() => {
      render(<AuthorizationStatus />);
    });

    it('renders the "Access Not Authorized" badge', () => {
      expect(screen.getByText('Access Not Authorized')).not.toBeNull();
    });

    it('renders the tooltip prompting folder authorization', () => {
      expect(screen.getByText('Authorize a specific folder to begin.')).not.toBeNull();
    });

    it('does not render the "Access Authorized" badge', () => {
      expect(screen.queryByText('Access Authorized')).toBeNull();
    });

    it('renders the badge with destructive variant', () => {
      const badge = screen.getByText('Access Not Authorized');
      expect(badge.getAttribute('data-variant')).toBe('destructive');
    });
  });

  describe('when handle is provided', () => {
    const handle = makeHandle('my-data-folder');

    beforeEach(() => {
      render(<AuthorizationStatus handle={handle} />);
    });

    it('renders the "Access Authorized" badge', () => {
      expect(screen.getByText('Access Authorized')).not.toBeNull();
    });

    it('renders the folder name in the tooltip content', () => {
      expect(screen.getByText('Folder Authorized: my-data-folder')).not.toBeNull();
    });

    it('does not render the "Access Not Authorized" badge', () => {
      expect(screen.queryByText('Access Not Authorized')).toBeNull();
    });
  });
});
