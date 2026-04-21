import { PluginOption } from 'vite';
import fs from 'node:fs/promises';
import { ISLAND_OUT_DIR } from '../../vite.config';

/**
 * Deletes files from the island build output that are not needed and may cause CSP issues.
 */
export const deleteUnnecessaryPlugin: PluginOption = {
  name: 'delete-unnecessary',
  async writeBundle() {
    await fs.rm(`${ISLAND_OUT_DIR}/screenshots`, { recursive: true });
    await fs.rm(`${ISLAND_OUT_DIR}/manifest.json`);
    await fs.rm(`${ISLAND_OUT_DIR}/robots.txt`);

    (await fs.readdir(ISLAND_OUT_DIR))
      .filter((f) => f.endsWith('.png'))
      .forEach((f) => fs.rm(`${ISLAND_OUT_DIR}/${f}`));
  },
};
