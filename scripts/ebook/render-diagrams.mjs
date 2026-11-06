import {readdir, mkdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/ebook/render-diagrams.mjs <asset-root>');
await mkdir(path.join(root, 'png'), {recursive: true});
for (const name of (await readdir(path.join(root, 'svg'))).filter(n => n.endsWith('.svg'))) {
  await sharp(path.join(root, 'svg', name), {density: 96}).png().toFile(path.join(root, 'png', name.replace(/\.svg$/, '.png')));
}
console.log('Rendered original diagrams with installed Korean fonts');
