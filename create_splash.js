const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

async function createSplash() {
  const splashPath = path.join(__dirname, 'static', 'splash.png');
  const iconPath = path.join(__dirname, 'unpackage', 'res', 'icons', '1024x1024.png');
  const nativeSplashDir = path.join(__dirname, 'static', 'splash');
  const nativeSplashSizes = [
    ['splash-hdpi.9.png', 480, 762],
    ['splash-xhdpi.9.png', 720, 1242],
    ['splash-xxhdpi.9.png', 1080, 1882]
  ];

  await fs.mkdir(nativeSplashDir, { recursive: true });

  async function renderSplash(outputPath, width, height) {
    const scale = width / 1080;
    
    // Apple Proportions: Logo symbol size is 20% of width
    const iconSize = Math.round(width * 0.20);
    // Centered vertically and slightly above middle (41% height)
    const iconTop = Math.round(height * 0.41);
    const iconLeft = Math.round((width - iconSize) / 2);
    
    // Bottom branding positions
    const brandY = Math.round(height * 0.86);
    const subBrandY = Math.round(height * 0.895);
    
    // Font sizes scaled proportionally
    const fontSizeBrand = Math.round(40 * scale);
    const fontSizeSubBrand = Math.round(13 * scale);

    // Base background SVG
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background: Solid Apple Dark Obsidian -->
      <rect width="${width}" height="${height}" fill="#08080c"/>

      <!-- Bottom Branding (SF Pro style typography) -->
      <!-- Main Brand "幻签" -->
      <text x="${width / 2}" y="${brandY}" font-family="-apple-system, SF Pro Display, Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="${fontSizeBrand}" fill="#ffffff" text-anchor="middle" letter-spacing="${4 * scale}">幻签</text>
      
      <!-- Sub Brand "HUANQIAN" -->
      <text x="${width / 2}" y="${subBrandY}" font-family="-apple-system, SF Pro Text, Helvetica Neue, Arial, sans-serif" font-weight="500" font-size="${fontSizeSubBrand}" fill="rgba(255, 255, 255, 0.35)" text-anchor="middle" letter-spacing="${8 * scale}">HUANQIAN</text>
    </svg>`;

    const buffer = Buffer.from(svg);
    const base = await sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .png()
      .toBuffer();

    // Prepare raw icon resize
    const resizedIcon = await sharp(iconPath)
      .resize(iconSize, iconSize, { fit: 'contain' })
      .png()
      .toBuffer();

    // Perform high-quality background removal to isolate logo symbol
    const transparentIcon = await removeDarkIconBackground(resizedIcon, iconSize);

    // Create a very soft, dark ambient shadow for depth
    const shadow = await sharp(transparentIcon)
      .blur(Math.max(8, Math.round(width * 0.012)))
      .modulate({ brightness: 0.15 })
      .png()
      .toBuffer();

    // Composite: Base -> Soft Shadow (slightly offset downward) -> Floating Logo Symbol
    const composited = await sharp(base)
      .composite([
        { input: shadow, left: iconLeft, top: iconTop + Math.round(height * 0.008) },
        { input: transparentIcon, left: iconLeft, top: iconTop }
      ])
      .png({ quality: 98 })
      .toBuffer();

    if (outputPath.endsWith('.9.png')) {
      const rawImage = sharp(composited).ensureAlpha().raw();
      const { data, info } = await rawImage.toBuffer({ resolveWithObject: true });
      const pixels = Buffer.from(data);

      const newWidth = width + 2;
      const newHeight = height + 2;
      const newPixels = Buffer.alloc(newWidth * newHeight * 4); // default transparent

      // Copy original pixels into center (offset 1, 1)
      for (let y = 0; y < height; y++) {
        const srcOffset = y * width * 4;
        const destOffset = ((y + 1) * newWidth + 1) * 4;
        pixels.copy(newPixels, destOffset, srcOffset, srcOffset + width * 4);
      }

      // Draw Nine-Patch black lines on top border (y = 0)
      const drawBlackPixel = (x, y) => {
        const offset = (y * newWidth + x) * 4;
        newPixels[offset] = 0;
        newPixels[offset + 1] = 0;
        newPixels[offset + 2] = 0;
        newPixels[offset + 3] = 255;
      };

      // Top border columns
      for (let x = 1; x <= iconLeft - 5; x++) {
        drawBlackPixel(x, 0);
      }
      for (let x = iconLeft + iconSize + 5; x <= width; x++) {
        drawBlackPixel(x, 0);
      }

      // Left border rows
      for (let y = 1; y <= iconTop - 5; y++) {
        drawBlackPixel(0, y);
      }
      for (let y = iconTop + iconSize + 5; y <= brandY - 15; y++) {
        drawBlackPixel(0, y);
      }
      for (let y = subBrandY + 25; y <= height; y++) {
        drawBlackPixel(0, y);
      }

      await sharp(newPixels, {
        raw: {
          width: newWidth,
          height: newHeight,
          channels: 4
        }
      })
      .png()
      .toFile(outputPath);
    } else {
      await sharp(composited).toFile(outputPath);
    }
  }

  // Chroma-keying background removal algorithm with smooth alpha transition
  async function removeDarkIconBackground(input, size) {
    const image = sharp(input).ensureAlpha().raw();
    const { data, info } = await image.toBuffer({ resolveWithObject: true });
    const pixels = Buffer.from(data);

    for (let i = 0; i < pixels.length; i += info.channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const originalAlpha = pixels[i + 3];
      
      const maxChannel = Math.max(r, g, b);
      const blueGlow = Math.max(0, b - Math.max(r, g));
      
      // If pixel is black or near-black and has no blue glow, make it transparent
      if (maxChannel < 32 && blueGlow < 18) {
        pixels[i + 3] = 0;
        continue;
      }
      
      // Smooth alpha transition to prevent jagged edges
      const brightnessAlpha = Math.max(0, Math.min(255, (maxChannel - 28) * 7));
      const glowAlpha = Math.max(0, Math.min(255, (blueGlow - 10) * 7));
      pixels[i + 3] = Math.round(originalAlpha * Math.max(brightnessAlpha, glowAlpha) / 255);
    }

    return sharp(pixels, {
      raw: {
        width: size,
        height: size,
        channels: info.channels
      }
    }).png().toBuffer();
  }

  // Render main splash image
  await renderSplash(splashPath, 1080, 1920);

  // Render native splash sizes
  for (const [fileName, width, height] of nativeSplashSizes) {
    await renderSplash(path.join(nativeSplashDir, fileName), width, height);
  }

  // Generate high-resolution transparent splash logo for Vue animation
  const logoOutPath = path.join(__dirname, 'static', 'splash_logo.png');
  const rawLogo = await sharp(iconPath)
    .resize(512, 512, { fit: 'contain' })
    .png()
    .toBuffer();
  const transparentLogo = await removeDarkIconBackground(rawLogo, 512);
  await sharp(transparentLogo).png({ quality: 100 }).toFile(logoOutPath);
  console.log('Vue splash logo created successfully:', logoOutPath);

  console.log('Apple-style floating splash created successfully:', splashPath);
  console.log('Native splash screens created successfully:', nativeSplashDir);
  const info = await sharp(splashPath).metadata();
  console.log('Main dimensions:', info.width + 'x' + info.height);
}

createSplash().catch(e => { console.error(e); process.exit(1); });
