import { isOnMobilePlatform } from '../user-agent';

describe('isOnMobilePlatform', () => {
  it('Should return user age', () => {
    const isOnMobilePlatformResult = isOnMobilePlatform();

    expect(typeof isOnMobilePlatformResult).toBe('boolean');
  });
});
