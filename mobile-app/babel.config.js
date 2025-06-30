module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxRuntime: 'automatic'
      }]
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/utils': './src/utils',
            '@/types': './src/types',
            '@/hooks': './src/hooks'
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ],
    env: {
      production: {
        plugins: [
          'transform-remove-console',
        ],
      },
    },
  };
};