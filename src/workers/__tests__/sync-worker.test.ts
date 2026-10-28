import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { WorkerMessage, WorkerResponse } from '../sync/types/sync-worker-types';

const { mockProcessMessage } = vi.hoisted(() => ({
  mockProcessMessage: vi.fn(),
}));

vi.mock('../../lib/sync-core', () => ({
  SyncWorkerHandler: class {
    processMessage = mockProcessMessage;
  },
}));

// The worker assigns self.onmessage at import time, so stub self first
const { mockPostMessage, mockSelf } = vi.hoisted(() => {
  const mockPostMessage = vi.fn();
  const mockSelf = {
    postMessage: mockPostMessage,
    onmessage: null as ((event: MessageEvent<any>) => void) | null,
  };
  Object.defineProperty(globalThis, 'self', {
    value: mockSelf,
    writable: true,
    configurable: true,
  });
  return { mockPostMessage, mockSelf };
});

import '../sync/sync-worker';

const send = (data: unknown) => mockSelf.onmessage!({ data } as MessageEvent<any>);

describe('sync-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches an onmessage handler at import time', () => {
    expect(typeof mockSelf.onmessage).toBe('function');
  });

  describe('message validation', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['a string', 'LIST_FILES_LOCAL'],
      ['a number', 42],
      ['an object without a type', { payload: 1 }],
      ['an object with an empty type', { type: '' }],
    ])('posts an UNKNOWN error and skips the handler when data is %s', async (_label, data) => {
      await send(data);

      expect(mockProcessMessage).not.toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Invalid message format: missing type or data',
        operation: 'UNKNOWN',
      } satisfies WorkerResponse);
    });
  });

  describe('successful processing', () => {
    it('forwards a valid message to the handler and posts its response', async () => {
      const message = { type: 'LIST_FILES_LOCAL', payload: { handle: 'h' } } as unknown as WorkerMessage;
      const response = { type: 'LIST_FILES_LOCAL_RESULT', files: ['a.json'] } as unknown as WorkerResponse;
      mockProcessMessage.mockResolvedValueOnce(response);

      await send(message);

      expect(mockProcessMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(response);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('waits for the handler before posting, even when it resolves later', async () => {
      let resolve!: (value: WorkerResponse) => void;
      mockProcessMessage.mockReturnValueOnce(new Promise<WorkerResponse>((r) => (resolve = r)));

      const pending = send({ type: 'SYNC_FILES' });
      expect(mockPostMessage).not.toHaveBeenCalled();

      resolve({ type: 'SYNC_FILES_RESULT' } as unknown as WorkerResponse);
      await pending;

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SYNC_FILES_RESULT' });
    });
  });

  describe('error handling', () => {
    it('posts the Error message and the request type when the handler throws an Error', async () => {
      mockProcessMessage.mockRejectedValueOnce(new Error('disk unavailable'));

      await send({ type: 'SYNC_FILES' });

      expect(console.error).toHaveBeenCalledWith('Worker error:', expect.any(Error));
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'disk unavailable',
        operation: 'SYNC_FILES',
      });
    });

    it('posts a generic message when the handler rejects with a non-Error value', async () => {
      mockProcessMessage.mockRejectedValueOnce('boom');

      await send({ type: 'LIST_FILES_REMOTE' });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Unknown error occurred',
        operation: 'LIST_FILES_REMOTE',
      });
    });

    it('posts a generic message when the handler rejects with undefined', async () => {
      mockProcessMessage.mockRejectedValueOnce(undefined);

      await send({ type: 'LIST_FILES_BOTH' });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Unknown error occurred',
        operation: 'LIST_FILES_BOTH',
      });
    });

    it('reports an error when posting the success response fails', async () => {
      mockProcessMessage.mockResolvedValueOnce({ type: 'OK' });
      mockPostMessage.mockImplementationOnce(() => {
        throw new Error('clone failed');
      });

      await send({ type: 'SYNC_FILES' });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        type: 'ERROR',
        message: 'clone failed',
        operation: 'SYNC_FILES',
      });
    });
  });
});
