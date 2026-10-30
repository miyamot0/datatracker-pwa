import { render } from 'vitest-browser-react';
import { vi, describe, it, expect } from 'vitest';
import SessionRecorderPage from '../session-recorder-page';

const mockInterface = vi.hoisted(() => vi.fn(() => null));

vi.mock('../views/session-recorder-interface', () => ({
  default: mockInterface,
}));

describe('SessionRecorderPage', () => {
  it('passes route params and settings through to SessionRecorderInterface', async () => {
    const Handle = {} as FileSystemDirectoryHandle;
    const KeySetObject = { keys: [] } as any;
    const SessionParams = { name: 'session' } as any;
    const ApplicationSettings = { theme: 'light' } as any;

    await render(
      <SessionRecorderPage
        Group="Group A"
        Individual="Participant 1"
        Evaluation="Eval 1"
        KeySetObject={KeySetObject}
        SessionParams={SessionParams}
        Handle={Handle}
        ApplicationSettings={ApplicationSettings}
      />,
    );

    expect(mockInterface).toHaveBeenCalled();
    const props = mockInterface.mock.calls[0][0] as any;
    expect(props.Group).toBe('Group A');
    expect(props.Individual).toBe('Participant 1');
    expect(props.Evaluation).toBe('Eval 1');
    expect(props.Settings).toBe(SessionParams);
    expect(props.Keyset).toBe(KeySetObject);
    expect(props.Handle).toBe(Handle);
    expect(props.ApplicationSettings).toBe(ApplicationSettings);
  });
});
