import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEventListener } from '../event-listeners';

describe('useEventListener', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers an event listener on the window by default', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('keydown', handler));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('calls the handler when the event fires', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('keydown', handler));

    const registeredListener = addEventListenerSpy.mock.calls[0][1] as EventListener;
    const mockEvent = { key: 'a' } as unknown as Event;
    registeredListener(mockEvent);

    expect(handler).toHaveBeenCalledWith(mockEvent);
  });

  it('removes the event listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('keydown', handler));

    const registeredListener = addEventListenerSpy.mock.calls[0][1];
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', registeredListener);
  });

  it('updates the handler via ref without re-registering the listener', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(({ handler }) => useEventListener('keydown', handler), {
      initialProps: { handler: handler1 },
    });

    rerender({ handler: handler2 });

    // Only one addEventListener call — listener reference is stable
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    const registeredListener = addEventListenerSpy.mock.calls[0][1] as EventListener;
    const mockEvent = { key: 'b' } as unknown as Event;
    registeredListener(mockEvent);

    expect(handler2).toHaveBeenCalledWith(mockEvent);
    expect(handler1).not.toHaveBeenCalled();
  });

  it('re-registers the listener when eventName changes', () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ eventName }) => useEventListener(eventName, handler), {
      initialProps: { eventName: 'keydown' },
    });

    rerender({ eventName: 'keyup' });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(addEventListenerSpy).toHaveBeenNthCalledWith(2, 'keyup', expect.any(Function));
  });

  it('re-registers the listener when element changes', () => {
    const handler = vi.fn();
    const element1 = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as Window;
    const element2 = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as Window;

    const { rerender } = renderHook(({ el }) => useEventListener('keydown', handler, el), {
      initialProps: { el: element1 },
    });

    rerender({ el: element2 });

    expect(element1.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(element2.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('registers a listener on a custom element', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;

    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler, mockElement));

    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('removes the listener from a custom element on unmount', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;

    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('click', handler, mockElement));

    const registeredListener = (mockElement.addEventListener as ReturnType<typeof vi.fn>).mock.calls[0][1];
    unmount();

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', registeredListener);
  });

  it('calls the handler on a custom element when the event fires', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;

    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler, mockElement));

    const registeredListener = (mockElement.addEventListener as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as EventListener;
    const mockEvent = { type: 'click' } as unknown as Event;
    registeredListener(mockEvent);

    expect(handler).toHaveBeenCalledWith(mockEvent);
  });

  it('does nothing when element does not support addEventListener', () => {
    const unsupportedElement = {} as unknown as Window;
    const handler = vi.fn();

    expect(() => {
      renderHook(() => useEventListener('keydown', handler, unsupportedElement));
    }).not.toThrow();

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });
});
