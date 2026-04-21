import { PluginOption } from 'vite';
import fs from 'node:fs/promises';
import { PROD_OUT_DIR } from '../../vite.config';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';

export const compressPNGPlugin: PluginOption = {
  name: 'convert-base-png-docs',
  async writeBundle() {
    // Pull relevant PNGs
    const pngFiles = await fs.readdir(`${PROD_OUT_DIR}/docs`);

    const prePng = performance.now();
    console.log(`Found ${pngFiles.length} PNG files in docs, starting optimization and conversion...`);

    for (const file of pngFiles) {
      if (file.endsWith('.png')) {
        // Convert old
        await imagemin([`${PROD_OUT_DIR}/docs/${file}`], {
          destination: `${PROD_OUT_DIR}/docs`,
          plugins: [imageminWebp({ quality: 75 })],
        });

        // Trash old
        await fs.rm(`${PROD_OUT_DIR}/docs/${file}`);
      }
    }

    const postPng = performance.now();
    console.log('Docs images optimized and converted!', ((postPng - prePng) / 1000).toFixed(2), 'seconds');
    console.log();

    /*
          Note: This wasn't really worth the complexity TBH
          // Pull relevant MDs
          const mdFiles = await fs.readdir(`${PROD_OUT_DIR}/content`);

          console.log(`Found ${mdFiles.length} Markdown files, starting update...`);
          const preMd = performance.now();

          for (const file of mdFiles) {
            if (file.endsWith('.md')) {
              const filePath = `${PROD_OUT_DIR}/content/${file}`;
              let content = await fs.readFile(filePath, 'utf-8');

              // Replace .png with .webp in markdown content
              content = content.replaceAll('.png', '.webp');

              await fs.writeFile(filePath, content, 'utf-8');
            }
          }
          const postMd = performance.now();
          console.log(
            'Markdown files updated with new image formats!',
            ((postMd - preMd) / 1000).toFixed(2),
            'seconds',
          );
          console.log();
          */
  },
};
