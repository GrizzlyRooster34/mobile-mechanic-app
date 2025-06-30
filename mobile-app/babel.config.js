module.exports = function (api) {
  // Smart caching based on environment
  api.cache.using(() => process.env.NODE_ENV);
  
  const isProduction = api.env('production');
  const isDevelopment = api.env('development');
  const isTest = api.env('test');

  const baseConfig = {
    presets: [
      [
        'babel-preset-expo', 
        { 
          jsxRuntime: 'automatic',
          native: {
            // Optimize for Hermes in production
            enableObjectSlots: isProduction,
            disableESTransforms: isProduction,
          },
          web: {
            // Optimize for web builds
            disableImportExportTransform: true,
          }
        }
      ]
    ],
    plugins: [
      // Path resolution for cleaner imports
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/utils': './src/utils',
            '@/types': './src/types',
            '@/hooks': './src/hooks',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/constants': './src/constants',
            '@/assets': './assets',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      
      // Performance optimizations
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: true,
          regenerator: false, // Hermes has native async/await
          useESModules: true,
          version: require('@babel/runtime/package.json').version,
        }
      ],

      // Tree shaking support
      [
        'babel-plugin-transform-imports',
        {
          'lodash': {
            transform: 'lodash/${member}',
            preventFullImport: true,
          },
          'date-fns': {
            transform: 'date-fns/${member}',
            preventFullImport: true,
          },
          '@expo/vector-icons': {
            transform: '@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/${member}',
            preventFullImport: true,
          },
        }
      ],

      // Inline environment variables at build time
      [
        'transform-inline-environment-variables',
        {
          include: [
            'NODE_ENV',
            'EXPO_PUBLIC_API_URL',
            'EXPO_PUBLIC_ENVIRONMENT'
          ]
        }
      ],
    ],
    env: {
      // Development environment optimizations
      development: {
        plugins: [
          // Hot reloading support
          'react-refresh/babel',
          
          // Better debugging
          ['@babel/plugin-transform-react-jsx-source'],
          ['@babel/plugin-transform-react-jsx-self'],
        ],
      },
      
      // Production environment optimizations
      production: {
        plugins: [
          // Remove console statements in production
          [
            'transform-remove-console',
            {
              exclude: ['error', 'warn'], // Keep error and warning logs
            }
          ],
          
          // Remove development-only code
          [
            'babel-plugin-transform-remove-imports',
            {
              test: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
            }
          ],

          // Minification helpers
          '@babel/plugin-transform-member-expression-literals',
          '@babel/plugin-transform-property-literals',
          '@babel/plugin-transform-reserved-words',
          
          // Dead code elimination
          [
            'babel-plugin-minify-dead-code-elimination',
            {
              optimizeRawSize: true,
            }
          ],

          // Constant folding
          'babel-plugin-minify-constant-folding',
          
          // Function inlining for small functions
          [
            'babel-plugin-minify-guarded-expressions',
            {
              tdz: true,
            }
          ],
        ],
      },
      
      // Test environment optimizations
      test: {
        plugins: [
          // Transform ES modules for Jest
          '@babel/plugin-transform-modules-commonjs',
          
          // Mock handling
          'babel-plugin-transform-require-context',
        ],
        presets: [
          [
            'babel-preset-expo',
            {
              jsxRuntime: 'automatic',
              native: {
                // Disable optimizations that can interfere with testing
                enableObjectSlots: false,
                disableESTransforms: false,
              }
            }
          ]
        ]
      },
    },
  };

  // Add react-native-reanimated plugin (must be last)
  baseConfig.plugins.push('react-native-reanimated/plugin');
  
  // Environment-specific final optimizations
  if (isProduction) {
    // Additional production plugins
    baseConfig.plugins.push(
      // Optimize object property access
      ['@babel/plugin-transform-computed-properties', { loose: true }],
      
      // Optimize spread operations
      ['@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true }],
      
      // Optimize class properties
      ['@babel/plugin-proposal-class-properties', { loose: true }],
    );
  }
  
  if (isDevelopment) {
    // Development-specific optimizations
    baseConfig.plugins.unshift(
      // Better error messages
      'babel-plugin-react-native-super-grid',
    );
  }

  return baseConfig;
};