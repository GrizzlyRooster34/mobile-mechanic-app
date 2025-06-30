const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Customize the config for better performance
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/utils': './src/utils',
  '@/types': './src/types',
  '@/hooks': './src/hooks',
};

// Enable caching for faster builds
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Add asset extensions for better asset handling
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'mp4',
  'webm',
  'wav',
  'mp3',
  'm4a',
  'aac',
  'oga',
];

// Add source extensions for TypeScript
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'jsx',
  'js',
  'json',
];

// Enable Metro's new JavaScript engine for better performance
config.transformer.experimentalImportSupport = false;
config.transformer.inlineRequires = true;

module.exports = config;