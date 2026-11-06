import {ebookAssets} from '../../lib/ebook-assets-manifest.js';
import {createEbookAssetHandler} from '../../lib/ebook-asset-service.js';

export const onRequest = createEbookAssetHandler({assets: ebookAssets});
