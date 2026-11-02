import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { BrowserCommand } from 'vitest/node';

const OUTPUT_DIR = path.resolve(import.meta.dirname, '../../public/screenshots');

/**
 * Browser command (runs in Node): converts a base64 PNG screenshot to WebP and writes it to public/screenshots.
 */
export const saveWebp: BrowserCommand<[name: string, base64Png: string]> = async (_ctx, name, base64Png) => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await sharp(Buffer.from(base64Png, 'base64'))
    .webp({ quality: 75 })
    .toFile(path.join(OUTPUT_DIR, `${name}.webp`));
};
