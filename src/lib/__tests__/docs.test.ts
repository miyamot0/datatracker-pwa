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

  it('loads a pre-rendered HTML body for a known slug', async () => {
    const entry = await loadEntry(AllFrontMatter[0].slug);

    expect(entry?.matter).toEqual(AllFrontMatter[0]);
    expect(entry?.value).toContain('<');
  });

  it('returns undefined for an unknown slug', async () => {
    expect(await loadEntry('does-not-exist')).toBeUndefined();
  });
});
