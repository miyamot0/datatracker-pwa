/**
 * Main sync worker entry point
 * Handles message passing and delegates work to organized modules
 */

import { WorkerMessage, WorkerResponse } from './types/sync-worker-types';
import { SyncWorkerHandler } from '../../lib/sync-core';

const handler = new SyncWorkerHandler();

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { data } = event;

  try {
    // Validate data exists and has required properties
    if (!data || typeof data !== 'object' || !data.type) {
      const errorResponse: WorkerResponse = {
        type: 'ERROR',
        message: 'Invalid message format: missing type or data',
        operation: 'UNKNOWN',
      };
      self.postMessage(errorResponse);
      return;
    }

    const response = await handler.processMessage(data);
    self.postMessage(response);
  } catch (error) {
    console.error('Worker error:', error);
    const errorResponse: WorkerResponse = {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      operation: data?.type || 'UNKNOWN',
    };
    self.postMessage(errorResponse);
  }
};
