import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LayoutFooter from '../footer';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// Globals injected by Vite define
(globalThis as Record<string, unknown>).BUILD_VERSION = '1.0.0';
(globalThis as Record<string, unknown>).BUILD_DATE = '3/29/2026';

describe('LayoutFooter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('content and links', () => {
    beforeEach(() => {
      render(<LayoutFooter />);
    });

    it('renders the DataTracker (PWA) link', () => {
      const link = screen.getByRole('link', { name: 'DataTracker (PWA)' });
      expect(link.getAttribute('href')).toBe('https://github.com/miyamot0/datatracker-pwa');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the Shawn P. Gilroy link', () => {
      const link = screen.getByRole('link', { name: 'Shawn P. Gilroy' });
      expect(link.getAttribute('href')).toBe('https://www.smallnstats.com');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the Louisiana State University link', () => {
      const link = screen.getByRole('link', { name: 'Louisiana State University' });
      expect(link.getAttribute('href')).toBe('https://www.lsu.edu/hss/psychology/faculty/school/gilroy.php');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the GitHub Issues link', () => {
      const link = screen.getByRole('link', { name: 'GitHub Issues page' });
      expect(link.getAttribute('href')).toBe('https://github.com/miyamot0/datatracker-pwa/issues');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the Twitter button with correct link', () => {
      const link = screen.getByRole('link', { name: 'Link to Twitter/X page' });
      expect(link.getAttribute('href')).toBe('https://x.com/gilroy_shawn');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the GitHub button with correct link', () => {
      const link = screen.getByRole('link', { name: 'Link to GitHub website' });
      expect(link.getAttribute('href')).toBe('https://github.com/miyamot0');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the SmallNStats button with correct link', () => {
      const link = screen.getByRole('link', { name: 'Link to SmallNStats website' });
      expect(link.getAttribute('href')).toBe('https://www.smallnstats.com');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('renders the diagnostics link pointing to /diagnostics', () => {
      const link = screen.getByRole('link', { name: /Build Version/i });
      expect(link.getAttribute('href')).toBe('/diagnostics');
    });

    it('renders build version and date in the diagnostics link', () => {
      expect(screen.getByText(/Build Version 1\.0\.0/)).not.toBeNull();
      expect(screen.getByText(/3\/29\/2026/)).not.toBeNull();
    });
  });

  describe('MODALITY label', () => {
    it('shows no modality suffix when VITE_MODE is "base"', () => {
      vi.stubEnv('VITE_MODE', 'base');
      render(<LayoutFooter />);
      expect(screen.getByText(/Build Version 1\.0\.0 \(3\/29\/2026\)$/)).not.toBeNull();
    });

    it('shows ": Island Mode" suffix when VITE_MODE is not "base"', () => {
      vi.stubEnv('VITE_MODE', 'island');
      render(<LayoutFooter />);
      expect(screen.getByText(/Build Version 1\.0\.0 \(3\/29\/2026: Island Mode\)/)).not.toBeNull();
    });
  });
});
