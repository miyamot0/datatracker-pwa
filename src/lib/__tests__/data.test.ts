import { DataExampleFiles } from '../data';

describe('DataExampleFiles', () => {
  it('some type of array', () => {
    const objects = DataExampleFiles;

    expect(objects.length).toBeGreaterThan(0);
  });
});
