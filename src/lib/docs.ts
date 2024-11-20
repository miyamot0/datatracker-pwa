const all_md_files = import.meta.glob('/src/assets/content/*.md', { query: '?raw', eager: true, import: 'default' });

export const DocumentationObjects = Object.entries(all_md_files).map(([key, value], index) => {
  const filename = key.split('/').pop();
  const content = (value as string).split('---');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matter = {} as any;
  const entries = content[1].split('\n').filter((str: string) => str.trim() !== '');

  entries.forEach((entry) => {
    const [key, value] = entry.split(':');
    matter[key.trim()] = value.trim().replaceAll("'", '');
  });

  matter.index = index;
  matter.filename = filename;

  return {
    matter,
    value: content[2],
  };
});
