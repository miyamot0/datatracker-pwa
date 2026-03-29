import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SessionRecorderPage from '../session-recorder-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { DEFAULT_SESSION_SETTINGS } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';

// ----- Module mocks -----

// Mock the heavy recorder interface so tests stay fast and focused on the wrapper
vi.mock('../views/session-recorder-interface', () => ({
  default: ({
    Group,
    Individual,
    Evaluation,
    Settings,
    Keyset,
    ApplicationSettings,
  }: {
    Group: string;
    Individual: string;
    Evaluation: string;
    Settings: unknown;
    Keyset: { Name: string };
    ApplicationSettings: { CacheBehavior: string };
  }) => (
    <div data-testid="recorder-interface">
      <span data-testid="prop-group">{Group}</span>
      <span data-testid="prop-individual">{Individual}</span>
      <span data-testid="prop-evaluation">{Evaluation}</span>
      <span data-testid="prop-keyset-name">{Keyset.Name}</span>
      <span data-testid="prop-cache">{ApplicationSettings.CacheBehavior}</span>
      <span data-testid="prop-settings">{JSON.stringify(Settings)}</span>
    </div>
  ),
}));

// ----- Helpers -----

const makeKeySet = (): KeySet => ({
  id: 'ks-1',
  Name: 'MyKeySet',
  FrequencyKeys: [],
  DurationKeys: [],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date(),
  lastModified: new Date(),
});

const renderComponent = (overrides: { Group?: string; Individual?: string; Evaluation?: string } = {}) =>
  render(
    <SessionRecorderPage
      Group={overrides.Group ?? 'GroupA'}
      Individual={overrides.Individual ?? 'ClientB'}
      Evaluation={overrides.Evaluation ?? 'Eval1'}
      KeySetObject={makeKeySet()}
      SessionParams={DEFAULT_SESSION_SETTINGS}
      Handle={{} as FileSystemDirectoryHandle}
      ApplicationSettings={DEFAULT_APPLICATION_SETTINGS}
    />,
  );

// ----- Tests -----

describe('SessionRecorderPage', () => {
  it('renders the SessionRecorderInterface', () => {
    renderComponent();
    expect(screen.getByTestId('recorder-interface')).not.toBeNull();
  });

  it('passes Group to the interface', () => {
    renderComponent({ Group: 'TestGroup' });
    expect(screen.getByTestId('prop-group').textContent).toBe('TestGroup');
  });

  it('passes Individual to the interface', () => {
    renderComponent({ Individual: 'TestClient' });
    expect(screen.getByTestId('prop-individual').textContent).toBe('TestClient');
  });

  it('passes Evaluation to the interface', () => {
    renderComponent({ Evaluation: 'TestEval' });
    expect(screen.getByTestId('prop-evaluation').textContent).toBe('TestEval');
  });

  it('passes KeySetObject.Name to the interface', () => {
    renderComponent();
    expect(screen.getByTestId('prop-keyset-name').textContent).toBe('MyKeySet');
  });

  it('passes ApplicationSettings.CacheBehavior to the interface', () => {
    renderComponent();
    expect(screen.getByTestId('prop-cache').textContent).toBe(DEFAULT_APPLICATION_SETTINGS.CacheBehavior);
  });

  it('passes SessionParams as Settings to the interface', () => {
    renderComponent();
    const settingsText = screen.getByTestId('prop-settings').textContent ?? '';
    const parsed = JSON.parse(settingsText);
    expect(parsed.KeySet).toBe(DEFAULT_SESSION_SETTINGS.KeySet);
    expect(parsed.DurationS).toBe(DEFAULT_SESSION_SETTINGS.DurationS);
  });
});
