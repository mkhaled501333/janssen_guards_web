/**
 * Simple script to generate placeholder PWA icons
 * Run with: node scripts/generate-icons.js
 * 
 * This script generates simple PNG icons using pure Node.js (no external dependencies)
 * For better quality icons, replace these with professionally designed icons.
 */

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG icon template with shield design
const createIconSVG = (size) => {
  const center = size / 2;
  const shieldSize = size * 0.6;
  const shieldX = center - shieldSize / 2;
  const shieldY = center - shieldSize / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366F1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <path d="M ${center} ${shieldY + shieldSize * 0.1} 
           L ${shieldX + shieldSize * 0.3} ${shieldY + shieldSize * 0.3}
           L ${shieldX + shieldSize * 0.3} ${shieldY + shieldSize * 0.7}
           Q ${shieldX + shieldSize * 0.3} ${shieldY + shieldSize * 0.9} ${center} ${shieldY + shieldSize * 0.9}
           Q ${shieldX + shieldSize * 0.7} ${shieldY + shieldSize * 0.9} ${shieldX + shieldSize * 0.7} ${shieldY + shieldSize * 0.7}
           L ${shieldX + shieldSize * 0.7} ${shieldY + shieldSize * 0.3}
           Z" 
        fill="white" 
        opacity="0.9"/>
</svg>`;
};

// Try to use sharp if available, otherwise fall back to SVG
let useSharp = false;
try {
  require.resolve('sharp');
  useSharp = true;
} catch (e) {
  // sharp not installed, will use SVG
}

const sizes = [192, 512];

if (useSharp) {
  const sharp = require('sharp');
  
  sizes.forEach(async (size) => {
    const svgContent = createIconSVG(size);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(pngPath);
      console.log(`✓ Created ${pngPath}`);
    } catch (error) {
      console.error(`✗ Error creating ${pngPath}:`, error.message);
      // Fallback to SVG
      const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✓ Created ${svgPath} (fallback)`);
    }
  });
  
  console.log('\n✓ PNG icon generation complete!');
} else {
  // Generate SVG icons as fallback
  sizes.forEach(size => {
    const svgContent = createIconSVG(size);
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✓ Created ${svgPath}`);
  });
  
  console.log('\n✓ SVG icon generation complete!');
  console.log('\nNote: SVG icons were created. For PNG format (recommended for PWA):');
  console.log('  1. Install sharp: npm install --save-dev sharp');
  console.log('  2. Run this script again: node scripts/generate-icons.js');
  console.log('  OR use an online converter to convert SVG to PNG');
  console.log('\nFor now, updating manifest to use SVG icons...');
  
  // Update manifest to use SVG if PNG not available
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.icons = manifest.icons.map(icon => ({
      ...icon,
      src: icon.src.replace('.png', '.svg'),
      type: 'image/svg+xml'
    }));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✓ Updated manifest.json to use SVG icons');
  }
}

