import { CleanUpString } from '../strings';

describe('CleanUpString', () => {
  it("should replace '%20' with a space", () => {
    const input = 'Hello%20World';
    const output = CleanUpString(input);
    expect(output).toBe('Hello World');
  });

  it("should replace multiple '%20' with spaces", () => {
    const input = 'Hello%20World%20from%20ChatGPT';
    const output = CleanUpString(input);
    expect(output).toBe('Hello World from ChatGPT');
  });

  it("should return the same string if there is no '%20'", () => {
    const input = 'Hello World';
    const output = CleanUpString(input);
    expect(output).toBe('Hello World');
  });

  it('should handle an empty string', () => {
    const input = '';
    const output = CleanUpString(input);
    expect(output).toBe('');
  });

  it("should handle a string with only '%20'", () => {
    const input = '%20';
    const output = CleanUpString(input);
    expect(output).toBe(' ');
  });

  it("should handle a string with multiple consecutive '%20'", () => {
    const input = 'Hello%20%20World';
    const output = CleanUpString(input);
    expect(output).toBe('Hello  World');
  });
});
