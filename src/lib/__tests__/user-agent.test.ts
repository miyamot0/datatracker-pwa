import { isOnMobilePlatform } from '../user-agent';

describe('isOnMobilePlatform', () => {
  it('Should return a boolean indicating if the platform is mobile', () => {
    const isOnMobilePlatformResult = isOnMobilePlatform();

    expect(typeof isOnMobilePlatformResult).toBe('boolean');
  });

  it('Should return true for a mobile user agent', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    const isOnMobilePlatformResult = isOnMobilePlatform();
    expect(isOnMobilePlatformResult).toBe(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('Should return false for a desktop user agent', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true,
    });
    const isOnMobilePlatformResult = isOnMobilePlatform();
    expect(isOnMobilePlatformResult).toBe(false);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('Should return true for an empty user agent', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: '',
      configurable: true,
    });
    const isOnMobilePlatformResult = isOnMobilePlatform();
    expect(isOnMobilePlatformResult).toBe(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });
});
