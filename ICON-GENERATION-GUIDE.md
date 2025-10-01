# Icon Generation Guide

This guide will help you generate all the required PNG icons from the SVG templates for your PWA.

## Required Icon Files

You need to generate the following PNG files from the SVG templates provided:

### 1. PWA Icons (from `icon-base.svg`)
- `pwa-192x192.png` - 192x192px
- `pwa-512x512.png` - 512x512px

### 2. Maskable Icon (from `icon-maskable.svg`)
- `pwa-maskable-512x512.png` - 512x512px

### 3. Apple Touch Icons (from `icon-base.svg`)
- `apple-touch-icon.png` - 180x180px (default)
- `apple-touch-icon-120x120.png` - 120x120px (iPhone)
- `apple-touch-icon-152x152.png` - 152x152px (iPad)
- `apple-touch-icon-167x167.png` - 167x167px (iPad Pro)
- `apple-touch-icon-180x180.png` - 180x180px (iPhone Plus/X)

### 4. Favicon
- `favicon.ico` - Multi-size icon (16x16, 32x32, 48x48)

## Option 1: Use Online Tools (Easiest)

### PWA Image Generator
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload `icon-base.svg`
3. Download the generated icons
4. Rename and place them in the `/public/` directory

### RealFaviconGenerator
1. Go to https://realfavicongenerator.net/
2. Upload `icon-base.svg`
3. Configure settings for iOS, Android, etc.
4. Download the package
5. Extract and place icons in `/public/` directory

## Option 2: Use ImageMagick (Command Line)

If you have ImageMagick installed:

\`\`\`bash
# PWA Icons
magick icon-base.svg -resize 192x192 pwa-192x192.png
magick icon-base.svg -resize 512x512 pwa-512x512.png

# Maskable Icon
magick icon-maskable.svg -resize 512x512 pwa-maskable-512x512.png

# Apple Touch Icons
magick icon-base.svg -resize 120x120 apple-touch-icon-120x120.png
magick icon-base.svg -resize 152x152 apple-touch-icon-152x152.png
magick icon-base.svg -resize 167x167 apple-touch-icon-167x167.png
magick icon-base.svg -resize 180x180 apple-touch-icon-180x180.png
magick icon-base.svg -resize 180x180 apple-touch-icon.png

# Favicon (requires multiple sizes)
magick icon-base.svg -resize 16x16 favicon-16.png
magick icon-base.svg -resize 32x32 favicon-32.png
magick icon-base.svg -resize 48x48 favicon-48.png
magick favicon-16.png favicon-32.png favicon-48.png favicon.ico
\`\`\`

## Option 3: Use Sharp (Node.js)

Create a script `generate-icons.js`:

\`\`\`javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = {
  'pwa-192x192.png': 192,
  'pwa-512x512.png': 512,
  'pwa-maskable-512x512.png': 512,
  'apple-touch-icon-120x120.png': 120,
  'apple-touch-icon-152x152.png': 152,
  'apple-touch-icon-167x167.png': 167,
  'apple-touch-icon-180x180.png': 180,
  'apple-touch-icon.png': 180,
};

async function generateIcons() {
  for (const [filename, size] of Object.entries(sizes)) {
    const inputFile = filename.includes('maskable') ? 'icon-maskable.svg' : 'icon-base.svg';

    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(\`public/\${filename}\`);

    console.log(\`Generated \${filename}\`);
  }
}

generateIcons();
\`\`\`

Run: \`npm install sharp && node generate-icons.js\`

## Verification Checklist

After generating all icons, verify:

- [ ] All PNG files are in `/public/` directory
- [ ] File sizes are correct (192x192, 512x512, etc.)
- [ ] Images have transparent or blue backgrounds
- [ ] Maskable icon has proper safe zone (content not cut off)
- [ ] Favicon.ico contains multiple sizes
- [ ] All files are properly named
- [ ] Icons are visible and clear at small sizes

## Quick Test

After generating icons, run:
\`\`\`bash
npm run build
\`\`\`

Check the `dist/` folder - all icon files should be copied there.
