import { AllFrontMatter, findFrontMatter, loadEntry } from '../docs';

describe('docs', () => {
  it('exposes front matter sorted by index', () => {
    expect(AllFrontMatter.length).toBeGreaterThan(0);

    const indexes = AllFrontMatter.map((matter) => matter.index);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it('finds front matter by slug', () => {
    const first = AllFrontMatter[0];

    expect(findFrontMatter(first.slug)).toEqual(first);
    expect(findFrontMatter('does-not-exist')).toBeUndefined();
  });

  it.each(AllFrontMatter)('loads a pre-parsed document for $slug', async (matter) => {
    const entry = await loadEntry(matter.slug);

    expect(entry?.matter).toEqual(matter);
    expect(entry?.value.type).toBe('root');
    expect(entry?.value.children.length).toBeGreaterThan(0);
  });

  it('returns undefined for an unknown slug', async () => {
    expect(await loadEntry('does-not-exist')).toBeUndefined();
  });
});
