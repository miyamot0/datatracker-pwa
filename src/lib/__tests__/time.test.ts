import { formatTimeSeconds, formatTimeOfDay, formatTimeSecondsMin } from '../time';

describe('formatTimeSeconds', () => {
  it('should format 0 seconds as 00:00:00.00', () => {
    const output = formatTimeSeconds(0);
    expect(output).toBe('00:00:00.00');
  });

  it('should format seconds less than 1 minute correctly', () => {
    const output = formatTimeSeconds(45.678);
    expect(output).toBe('00:00:45.68');
  });

  it('should format seconds equal to 1 minute correctly', () => {
    const output = formatTimeSeconds(60);
    expect(output).toBe('00:01:00.00');
  });

  it('should format seconds equal to 1 hour correctly', () => {
    const output = formatTimeSeconds(3600);
    expect(output).toBe('01:00:00.00');
  });

  it('should format 1 hour, 1 minute, and 1 second correctly', () => {
    const output = formatTimeSeconds(3661);
    expect(output).toBe('01:01:01.00');
  });

  it('should format more than 1 hour with fractional seconds correctly', () => {
    const output = formatTimeSeconds(3723.456);
    expect(output).toBe('01:02:03.46');
  });

  it('should handle large numbers of seconds', () => {
    const output = formatTimeSeconds(86400); // 24 hours
    expect(output).toBe('24:00:00.00');
  });
});

describe('formatTimeSecondsMin', () => {
  it('should format 0 seconds as 00:00', () => {
    const output = formatTimeSecondsMin(0);
    expect(output).toBe('00:00');
  });

  it('should format seconds less than 1 minute correctly', () => {
    const output = formatTimeSecondsMin(45.123);
    expect(output).toBe('00:45');
  });

  it('should format seconds equal to 1 minute correctly', () => {
    const output = formatTimeSecondsMin(60);
    expect(output).toBe('01:00');
  });

  it('should format seconds equal to 1 hour correctly', () => {
    const output = formatTimeSecondsMin(3000);
    expect(output).toBe('50:00');
  });
});

describe('formatTimeOfDay', () => {
  it('should format a date at midnight as 12:00:00 AM', () => {
    const date = new Date('2024-09-07T00:00:00');
    const output = formatTimeOfDay(date);
    expect(output).toEqual('12:00:00 AM');
  });

  it('should format a date at noon as 12:00:00 PM', () => {
    const date = new Date('2024-09-07T12:00:00');
    const output = formatTimeOfDay(date);
    expect(output).toEqual('12:00:00 PM');
  });

  it('should format a date in the morning as 09:15:30 AM', () => {
    const date = new Date('2024-09-07T09:15:30');
    const output = formatTimeOfDay(date);
    expect(output).toEqual('09:15:30 AM');
  });

  it('should format a date in the evening as 07:45:55 PM', () => {
    const date = new Date('2024-09-07T19:45:55');
    const output = formatTimeOfDay(date);
    expect(output).toEqual('07:45:55 PM');
  });

  it('should format a date with seconds correctly', () => {
    const date = new Date('2024-09-07T14:30:15');
    const output = formatTimeOfDay(date);
    expect(output).toEqual('02:30:15 PM');
  });
});
