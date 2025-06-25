const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for .web.js, .web.ts, .web.tsx extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for TypeScript and JSX
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json', 'wasm', 'svg');

// Configure asset extensions
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  // Audio
  'mp3',
  'wav',
  'aac',
  // Video
  'mp4',
  'mov',
  // Documents
  'pdf'
);

// Configure transformer for web compatibility
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Enable NativeWind
module.exports = withNativeWind(config, { input: './src/styles/globals.css' });