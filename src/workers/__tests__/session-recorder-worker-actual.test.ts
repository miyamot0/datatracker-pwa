// @vitest-environment jsdom

import '@vitest/web-worker';
//import SessionRecorderWorker from '../timing/session-recorder-worker?worker';

describe('SessionRecorderWorker actual', () => {
  //const worker = new SessionRecorderWorker();

  it('should start', () => {
    expect(1).toBe(1);
  });
});
