import { DocumentationObjects } from '../docs';

describe('DocumentationObjects', () => {
  it('some type of array', () => {
    const objects = DocumentationObjects;

    expect(objects.length).toBeGreaterThan(0);
  });
});
