import { PluginOption } from 'vite';

/**
 * Rewrites `?worker` import suffixes to `?worker&inline` so that
 * workers are embedded as Blob URLs instead of separate script files.
 * This is required for the island build, which is loaded from a
 * file:// origin where cross-origin worker scripts are blocked.
 */
export const inlineWorkersPlugin: PluginOption = {
  name: 'inline-workers',
  transform(code: string, id: string) {
    if (id.includes('node_modules')) return null;
    if (!/\.(ts|tsx|js|jsx)$/.test(id.split('?')[0])) return null;

    const updated = code.replace(/(['"`])([^'"`]*\?worker)(['"`])/g, (_, open, path, close) => {
      if (path.includes('&inline')) return `${open}${path}${close}`;
      return `${open}${path}&inline${close}`;
    });

    return updated !== code ? { code: updated, map: null } : null;
  },
};
