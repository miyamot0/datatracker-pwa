import React, { MutableRefObject } from 'react';

/** useEventListener
 *
 * listener for events
 *
 * @param {string} eventName ...
 * @param {(key: React.KeyboardEvent<HTMLElement>) => void} handler ...
 * @param {Window} element ...
 */
export function useEventListener(
  eventName: string,
  handler: (key: React.KeyboardEvent<HTMLElement>) => void,
  element: Window = window
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedHandler = React.useRef<any>({ current: handler } as MutableRefObject<any>);

  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(
    () => {
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
    },
    [eventName, element] // Re-run if eventName or element changes
  );
}
