const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable Hermes for better performance
config.transformer.hermesCommand = path.resolve(__dirname, 'node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc');

// Advanced resolver configuration
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/utils': './src/utils',
  '@/types': './src/types',
  '@/hooks': './src/hooks',
  '@/services': './src/services',
  '@/stores': './src/stores',
  '@/constants': './src/constants',
  '@/assets': './assets',
};

// Optimize resolver for faster module resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Advanced minifier configuration for production builds
config.transformer.minifierConfig = {
  // Preserve class names and function names for better debugging
  keep_classnames: process.env.NODE_ENV !== 'production',
  keep_fnames: process.env.NODE_ENV !== 'production',
  mangle: {
    keep_classnames: process.env.NODE_ENV !== 'production',
    keep_fnames: process.env.NODE_ENV !== 'production',
    toplevel: process.env.NODE_ENV === 'production',
    eval: true,
    properties: {
      regex: /^_/,  // Mangle properties starting with underscore
    }
  },
  compress: {
    drop_console: process.env.NODE_ENV === 'production',
    drop_debugger: process.env.NODE_ENV === 'production',
    pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
    passes: 3,  // Multiple passes for better compression
    unsafe: true,
    unsafe_comps: true,
    unsafe_math: true,
    unsafe_proto: true,
  }
};

// Comprehensive asset extensions
config.resolver.assetExts = [
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico',
  // Videos  
  'mp4', 'webm', 'mov', 'avi', 'mkv', '3gp',
  // Audio
  'wav', 'mp3', 'm4a', 'aac', 'oga', 'ogg', 'flac',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // Archives
  'zip', 'tar', 'gz', 'rar',
  // Configs
  'json', 'xml', 'plist'
].filter((ext, index, arr) => arr.indexOf(ext) === index); // Remove duplicates

// Source extensions with TypeScript support
config.resolver.sourceExts = [
  'ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs'
].filter((ext, index, arr) => arr.indexOf(ext) === index);

// Advanced transformer settings
config.transformer.asyncRequireModulePath = require.resolve('metro-runtime/src/modules/asyncRequire');
config.transformer.experimentalImportSupport = false;
config.transformer.inlineRequires = true;
config.transformer.unstable_allowRequireContext = true;

// Enhanced cache configuration
config.cacheStores = [
  {
    name: 'filesystem',
    options: {
      root: path.resolve(__dirname, 'node_modules/.cache/metro'),
      // Clean cache older than 7 days
      ttl: 7 * 24 * 60 * 60 * 1000
    }
  }
];

// Serializer optimizations
config.serializer.customSerializer = null;
config.serializer.getModulesRunBeforeMainModule = () => [];
config.serializer.getPolyfills = () => [];

// Advanced serializer configuration for tree shaking
config.serializer.createModuleIdFactory = () => (path) => {
  // Use shorter module IDs in production for smaller bundles
  if (process.env.NODE_ENV === 'production') {
    let name = path.replace(__dirname, '');
    name = name.replace(/\.(ts|tsx|js|jsx)$/, '');
    name = name.replace(/[^a-zA-Z0-9]/g, '');
    return name;
  }
  return path;
};

// Server configuration for development
config.server = {
  port: 8081,
  enableVisualizer: process.env.NODE_ENV === 'development',
  rewriteRequestUrl: (url) => {
    // Rewrite URLs for better development experience
    if (url.startsWith('/assets/')) {
      return url.replace('/assets/', '/assets/');
    }
    return url;
  }
};

// Watch folder optimization
config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),
  path.resolve(__dirname, 'app'),
];

// Ignore patterns for better performance
config.resolver.blacklistRE = /(node_modules\/.*\/node_modules\/react-native\/.*|node_modules\/react-native\/Libraries\/NewAppScreen\/.*)/;

// Performance optimization for large codebases
config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length * 0.8));

// Environment-specific optimizations
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  config.transformer.minifierPath = 'metro-minify-terser';
  config.serializer.getRunModuleStatement = (moduleId) => 
    `__r(${JSON.stringify(moduleId)});`;
} else {
  // Development optimizations
  config.resolver.useWatchman = true;
  config.transformer.enableBabelRCLookup = true;
}

// Bundle splitting configuration (experimental)
config.serializer.experimentalSerializerHook = (graph, delta) => {
  // Custom logic for bundle splitting can be added here
  return delta;
};

module.exports = config;