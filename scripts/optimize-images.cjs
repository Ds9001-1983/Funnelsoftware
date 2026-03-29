const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIRS = [
  { path: path.join(__dirname, '..', 'client', 'public', 'templates'), maxWidth: 600, quality: 80 },
  { path: path.join(__dirname, '..', 'client', 'public', 'images'), maxWidth: 1200, quality: 80 },
];

// Skip favicon files - they need to stay as PNG
const SKIP_FILES = ['favicon-192.png', 'favicon-512.png'];

async function optimizeImages() {
  let totalSaved = 0;

  for (const dir of DIRS) {
    if (!fs.existsSync(dir.path)) {
      console.log(`Skipping ${dir.path} (not found)`);
      continue;
    }

    const files = fs.readdirSync(dir.path).filter(f => f.endsWith('.png') && !SKIP_FILES.includes(f));
    console.log(`\n--- ${dir.path} (${files.length} PNG files) ---`);

    for (const file of files) {
      const inputPath = path.join(dir.path, file);
      const originalSize = fs.statSync(inputPath).size;

      // Skip already small PNGs (< 500 KB)
      if (originalSize < 500 * 1024) {
        console.log(`SKIP ${file} (${Math.round(originalSize / 1024)} KB — already small)`);
        continue;
      }

      // 1. Create/update WebP version
      const webpPath = path.join(dir.path, file.replace('.png', '.webp'));
      await sharp(inputPath)
        .resize({ width: dir.maxWidth, withoutEnlargement: true })
        .webp({ quality: dir.quality })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;

      // 2. Compress the PNG itself (for fallback/social bots)
      const tmpPath = inputPath + '.tmp';
      await sharp(inputPath)
        .resize({ width: dir.maxWidth, withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true })
        .toFile(tmpPath);

      fs.renameSync(tmpPath, inputPath);
      const pngSize = fs.statSync(inputPath).size;
      const saved = originalSize - pngSize;
      totalSaved += saved;

      console.log(
        `${file}: ${(originalSize / 1024 / 1024).toFixed(1)} MB → PNG: ${Math.round(pngSize / 1024)} KB, WebP: ${Math.round(webpSize / 1024)} KB (saved ${(saved / 1024 / 1024).toFixed(1)} MB)`
      );
    }
  }

  console.log(`\nTotal saved: ${(totalSaved / 1024 / 1024).toFixed(1)} MB`);
}

optimizeImages().catch(console.error);
