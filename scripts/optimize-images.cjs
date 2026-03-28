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
    console.log(`\n--- ${dir.path} (${files.length} files) ---`);

    for (const file of files) {
      const inputPath = path.join(dir.path, file);
      const outputPath = path.join(dir.path, file.replace('.png', '.webp'));

      const originalSize = fs.statSync(inputPath).size;

      await sharp(inputPath)
        .resize({ width: dir.maxWidth, withoutEnlargement: true })
        .webp({ quality: dir.quality })
        .toFile(outputPath);

      const newSize = fs.statSync(outputPath).size;
      const saved = originalSize - newSize;
      totalSaved += saved;

      console.log(
        `${file}: ${(originalSize / 1024 / 1024).toFixed(1)} MB -> ${file.replace('.png', '.webp')}: ${(newSize / 1024).toFixed(0)} KB (saved ${(saved / 1024 / 1024).toFixed(1)} MB)`
      );
    }
  }

  console.log(`\nTotal saved: ${(totalSaved / 1024 / 1024).toFixed(1)} MB`);
}

optimizeImages().catch(console.error);
