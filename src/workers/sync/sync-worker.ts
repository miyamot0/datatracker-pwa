/**
 * Main sync worker entry point
 * Handles message passing and delegates work to organized modules
 */

import { WorkerMessage, WorkerResponse } from './types/sync-worker-types';
import { SyncWorkerHandler } from './helpers/sync-handler';

const handler = new SyncWorkerHandler();

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { data } = event;

  try {
    const response = await handler.processMessage(data);
    self.postMessage(response);
  } catch (error) {
    console.error('Worker error:', error);
    const errorResponse: WorkerResponse = {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      operation: data.type,
    };
    self.postMessage(errorResponse);
  }
};
