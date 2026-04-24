// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import { SyncStatusBadge } from '../sync-status-button';

describe('SyncStatusBadge', () => {
  describe('when active is true', () => {
    it('shows the authorized text', async () => {
      render(
        <SyncStatusBadge active={true}>
          <span />
        </SyncStatusBadge>,
      );
      await expect.element(page.getByText('Remote Access Authorized')).toBeVisible();
    });

    it('does not show the no-remote text', async () => {
      render(
        <SyncStatusBadge active={true}>
          <span />
        </SyncStatusBadge>,
      );
      expect(page.getByText('No Remote Selected').query()).toBeNull();
    });

    it('applies the green background class to the badge', async () => {
      render(
        <SyncStatusBadge active={true}>
          <span />
        </SyncStatusBadge>,
      );
      const badge = page.getByText('Remote Access Authorized');
      await expect.element(badge).toHaveClass('bg-green-500');
    });

    it('does not apply the red background class to the badge', async () => {
      render(
        <SyncStatusBadge active={true}>
          <span />
        </SyncStatusBadge>,
      );
      const badge = page.getByText('Remote Access Authorized');
      await expect.element(badge).not.toHaveClass('bg-red-500');
    });
  });

  describe('when active is false', () => {
    it('shows the no-remote text', async () => {
      render(
        <SyncStatusBadge active={false}>
          <span />
        </SyncStatusBadge>,
      );
      await expect.element(page.getByText('No Remote Selected')).toBeVisible();
    });

    it('does not show the authorized text', async () => {
      render(
        <SyncStatusBadge active={false}>
          <span />
        </SyncStatusBadge>,
      );
      expect(page.getByText('Remote Access Authorized').query()).toBeNull();
    });

    it('applies the red background class to the badge', async () => {
      render(
        <SyncStatusBadge active={false}>
          <span />
        </SyncStatusBadge>,
      );
      const badge = page.getByText('No Remote Selected');
      await expect.element(badge).toHaveClass('bg-red-500');
    });

    it('does not apply the green background class to the badge', async () => {
      render(
        <SyncStatusBadge active={false}>
          <span />
        </SyncStatusBadge>,
      );
      const badge = page.getByText('No Remote Selected');
      await expect.element(badge).not.toHaveClass('bg-green-500');
    });
  });

  describe('children', () => {
    it('renders the provided children', async () => {
      render(
        <SyncStatusBadge active={true}>
          <button data-testid="child-button">Action</button>
        </SyncStatusBadge>,
      );
      await expect.element(page.getByTestId('child-button')).toBeVisible();
    });

    it('renders children alongside the badge', async () => {
      render(
        <SyncStatusBadge active={false}>
          <span data-testid="sibling">Sibling</span>
        </SyncStatusBadge>,
      );
      await expect.element(page.getByText('No Remote Selected')).toBeVisible();
      await expect.element(page.getByTestId('sibling')).toBeVisible();
    });
  });
});
