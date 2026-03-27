import React, { MutableRefObject } from 'react';

/** useEventListener
 *
 * listener for in session recording
 *
 * @param {string} eventName By default, 'keydown' is used for session recording
 * @param {(key: React.KeyboardEvent<HTMLElement>) => void} handler Handler for key processing
 * @param {Window} element implicit--attach to window if not specified otherwise
 */
export function useEventListener(
  eventName: string,
  handler: (key: React.KeyboardEvent<HTMLElement>) => void,
  element: Window = window,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedHandler = React.useRef<any>({ current: handler } as MutableRefObject<any>);

  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventListener = (event: any): void => {
      if (typeof savedHandler.current === 'function') {
        savedHandler.current(event);
      }
    };

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
