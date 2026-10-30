import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DeIdentifyIndividualRequest } from '../mutations/types/deidentify-individual-worker-types';

const { mockMutateDeIdentifyIndividual } = vi.hoisted(() => ({
  mockMutateDeIdentifyIndividual: vi.fn(),
}));

vi.mock('../../lib/query-mutate', () => ({
  mutateDeIdentifyIndividual: mockMutateDeIdentifyIndividual,
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

import '../mutations/deidentify-individual-worker';

const send = (data: unknown) => mockSelf.onmessage!({ data } as MessageEvent<any>);

const handle = {} as FileSystemDirectoryHandle;

const makeRequest = (override: Partial<DeIdentifyIndividualRequest> = {}): DeIdentifyIndividualRequest => ({
  id: 'req-1',
  handle,
  groupName: 'GroupA',
  sourceIndividualName: 'ClientB',
  newIndividualName: 'Pseudonym1',
  replacementYear: 2001,
  redactComments: true,
  ...override,
});

describe('deidentify-individual-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('attaches an onmessage handler at import time', () => {
    expect(typeof mockSelf.onmessage).toBe('function');
  });

  describe('request validation', () => {
    it('posts a failure with id "unknown" when the event has no data', async () => {
      await send(undefined);

      expect(mockMutateDeIdentifyIndividual).not.toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unknown',
          success: false,
          error: 'Invalid request: missing id',
        }),
      );
    });

    it('posts a failure with id "unknown" when the request has an empty id', async () => {
      await send(makeRequest({ id: '' }));

      expect(mockMutateDeIdentifyIndividual).not.toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unknown',
          success: false,
          error: 'Invalid request: missing id',
        }),
      );
    });

    it('echoes the request id when the request is present but the id is missing', async () => {
      const { id: _omit, ...withoutId } = makeRequest();

      await send(withoutId);

      expect(mockMutateDeIdentifyIndividual).not.toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 'unknown', success: false }));
    });

    it('includes timestamp and executionTime on validation failures', async () => {
      await send(null);

      const response = mockPostMessage.mock.calls[0][0];
      expect(typeof response.timestamp).toBe('number');
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('successful de-identification', () => {
    it('forwards every request field to mutateDeIdentifyIndividual in order', async () => {
      mockMutateDeIdentifyIndividual.mockResolvedValueOnce([]);
      const request = makeRequest({ redactComments: false });

      await send(request);

      expect(mockMutateDeIdentifyIndividual).toHaveBeenCalledWith(
        handle,
        'GroupA',
        'ClientB',
        'Pseudonym1',
        2001,
        false,
      );
    });

    it('posts the returned individual names with success and the request id', async () => {
      mockMutateDeIdentifyIndividual.mockResolvedValueOnce(['ClientB', 'Pseudonym1']);

      await send(makeRequest());

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'req-1',
          success: true,
          data: ['ClientB', 'Pseudonym1'],
        }),
      );
    });

    it('includes timestamp and a non-negative executionTime on success', async () => {
      mockMutateDeIdentifyIndividual.mockResolvedValueOnce([]);

      await send(makeRequest());

      const response = mockPostMessage.mock.calls[0][0];
      expect(typeof response.timestamp).toBe('number');
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
      expect(response).not.toHaveProperty('error');
    });
  });

  describe('error handling', () => {
    it('posts the Error message and stack when the mutation throws an Error', async () => {
      const failure = new Error('directory missing');
      mockMutateDeIdentifyIndividual.mockRejectedValueOnce(failure);

      await send(makeRequest());

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'req-1',
          success: false,
          error: 'directory missing',
          stack: failure.stack,
        }),
      );
      expect(console.error).not.toHaveBeenCalled();
    });

    it('posts a generic message with no stack when the mutation rejects with a non-Error value', async () => {
      mockMutateDeIdentifyIndividual.mockRejectedValueOnce('oops');

      await send(makeRequest());

      const response = mockPostMessage.mock.calls[0][0];
      expect(response).toMatchObject({
        id: 'req-1',
        success: false,
        error: 'Unknown error occurred',
      });
      expect(response.stack).toBeUndefined();
    });
  });
});
