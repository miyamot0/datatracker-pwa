const all_data_files = import.meta.glob('/src/assets/data/**', { query: '?raw', eager: true, import: 'default' });

export const DataExampleFiles = Object.entries(all_data_files).map(([key, value]) => {
  const segments = key.split('/');
  const filename = segments.pop();
  const path = segments.slice(5);
  const text = value as unknown as string;

  return {
    filename,
    path,
    text,
  };
});
