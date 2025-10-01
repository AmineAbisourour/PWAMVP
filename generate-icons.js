// Script to generate all required PWA icons from SVG templates
// Run: node generate-icons.js

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const icons = [
  // PWA Icons (from icon-base.svg)
  { input: 'icon-base.svg', output: 'pwa-192x192.png', size: 192 },
  { input: 'icon-base.svg', output: 'pwa-512x512.png', size: 512 },

  // Maskable Icon (from icon-maskable.svg)
  { input: 'icon-maskable.svg', output: 'pwa-maskable-512x512.png', size: 512 },

  // Apple Touch Icons (from icon-base.svg)
  { input: 'icon-base.svg', output: 'apple-touch-icon-120x120.png', size: 120 },
  { input: 'icon-base.svg', output: 'apple-touch-icon-152x152.png', size: 152 },
  { input: 'icon-base.svg', output: 'apple-touch-icon-167x167.png', size: 167 },
  { input: 'icon-base.svg', output: 'apple-touch-icon-180x180.png', size: 180 },
  { input: 'icon-base.svg', output: 'apple-touch-icon.png', size: 180 },

  // Favicon sizes
  { input: 'icon-base.svg', output: 'favicon-16x16.png', size: 16 },
  { input: 'icon-base.svg', output: 'favicon-32x32.png', size: 32 },
  { input: 'icon-base.svg', output: 'favicon-48x48.png', size: 48 },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const icon of icons) {
    try {
      const inputPath = join(__dirname, 'public', icon.input);
      const outputPath = join(__dirname, 'public', icon.output);

      await sharp(inputPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${icon.output} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.output}:`, error.message);
    }
  }

  console.log('\n📦 Generating favicon.ico...');

  try {
    // For favicon.ico, we'll just use the 32x32 version as a simple fallback
    // A proper multi-size .ico would require a specialized library
    const favicon32 = join(__dirname, 'public', 'favicon-32x32.png');
    const faviconIco = join(__dirname, 'public', 'favicon.ico');

    await sharp(join(__dirname, 'public', 'icon-base.svg'))
      .resize(32, 32)
      .png()
      .toFile(faviconIco);

    console.log('✅ Generated favicon.ico (32x32)');
  } catch (error) {
    console.error('❌ Error generating favicon.ico:', error.message);
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Check the /public folder for all generated icons');
  console.log('2. Run "npm run build" to build the PWA');
  console.log('3. Test the icons in the built version\n');
}

// Check if sharp is installed
try {
  await generateIcons();
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('\n❌ Sharp is not installed!');
    console.error('\n📦 Please run: npm install --save-dev sharp');
    console.error('   Then run this script again: node generate-icons.js\n');
  } else {
    console.error('Error:', error.message);
  }
  process.exit(1);
}
