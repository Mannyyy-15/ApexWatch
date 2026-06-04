/**
 * ApexWatch Icon Generator
 * Resizes public/logo.png to all required Android and iOS icon sizes
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.resolve(__dirname, '../public/logo.png');

// Android mipmap icon sizes
const ANDROID_ICONS = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Android splash / notification icon (foreground)
const ANDROID_FOREGROUND = [
  { folder: 'mipmap-mdpi',    size: 108 },
  { folder: 'mipmap-hdpi',    size: 162 },
  { folder: 'mipmap-xhdpi',   size: 216 },
  { folder: 'mipmap-xxhdpi',  size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

// Splash drawables (used for all port/land densities)
const ANDROID_SPLASH = [
  { folder: 'drawable',              size: 300 },
  { folder: 'drawable-port-mdpi',    size: 320 },
  { folder: 'drawable-port-hdpi',    size: 480 },
  { folder: 'drawable-port-xhdpi',   size: 640 },
  { folder: 'drawable-port-xxhdpi',  size: 960 },
  { folder: 'drawable-port-xxxhdpi', size: 1280 },
  { folder: 'drawable-land-mdpi',    size: 320 },
  { folder: 'drawable-land-hdpi',    size: 480 },
  { folder: 'drawable-land-xhdpi',   size: 640 },
  { folder: 'drawable-land-xxhdpi',  size: 960 },
  { folder: 'drawable-land-xxxhdpi', size: 1280 },
];

const ANDROID_BASE = path.resolve(__dirname, '../android/app/src/main/res');

// iOS icon sizes
const IOS_ICONS = [
  { name: 'Icon-20.png',         size: 20   },
  { name: 'Icon-20@2x.png',      size: 40   },
  { name: 'Icon-20@3x.png',      size: 60   },
  { name: 'Icon-29.png',         size: 29   },
  { name: 'Icon-29@2x.png',      size: 58   },
  { name: 'Icon-29@3x.png',      size: 87   },
  { name: 'Icon-40.png',         size: 40   },
  { name: 'Icon-40@2x.png',      size: 80   },
  { name: 'Icon-40@3x.png',      size: 120  },
  { name: 'Icon-60@2x.png',      size: 120  },
  { name: 'Icon-60@3x.png',      size: 180  },
  { name: 'Icon-76.png',         size: 76   },
  { name: 'Icon-76@2x.png',      size: 152  },
  { name: 'Icon-83.5@2x.png',    size: 167  },
  { name: 'Icon-1024.png',       size: 1024 },
  { name: 'AppIcon-512@2x.png',  size: 1024 },
];

const IOS_BASE = path.resolve(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');

async function resize(src, dest, size) {
  await sharp(src)
    .resize(size, size, { fit: 'cover', background: { r: 2, g: 2, b: 2, alpha: 1 } })
    .png()
    .toFile(dest);
  console.log(`  ✓ ${path.relative(process.cwd(), dest)} (${size}x${size})`);
}

async function run() {
  console.log('\n📱 Generating Android icons...');
  for (const { folder, size } of ANDROID_ICONS) {
    const dir = path.join(ANDROID_BASE, folder);
    fs.mkdirSync(dir, { recursive: true });
    await resize(SOURCE, path.join(dir, 'ic_launcher.png'), size);
    await resize(SOURCE, path.join(dir, 'ic_launcher_round.png'), size);
  }

  console.log('\n🎨 Generating Android adaptive foreground icons...');
  for (const { folder, size } of ANDROID_FOREGROUND) {
    const dir = path.join(ANDROID_BASE, folder);
    fs.mkdirSync(dir, { recursive: true });
    await resize(SOURCE, path.join(dir, 'ic_launcher_foreground.png'), size);
  }

  console.log('\n🌅 Generating Android splash screens...');
  for (const { folder, size } of ANDROID_SPLASH) {
    const dir = path.join(ANDROID_BASE, folder);
    fs.mkdirSync(dir, { recursive: true });
    await resize(SOURCE, path.join(dir, 'splash.png'), size);
  }

  console.log('\n🍎 Generating iOS icons...');
  fs.mkdirSync(IOS_BASE, { recursive: true });
  for (const { name, size } of IOS_ICONS) {
    await resize(SOURCE, path.join(IOS_BASE, name), size);
  }

  console.log('\n✅ All icons generated successfully!\n');
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
