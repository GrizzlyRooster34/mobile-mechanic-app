const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
      logLevel: 'info',
      defaultSizes: 'parsed',
      statsOptions: {
        source: false,
        reasons: false,
        modules: false,
        chunks: false,
        chunkModules: false,
        chunkOrigins: false,
        modulesSort: 'size',
        chunksSort: 'size',
        assetsSort: 'size',
      },
    }),
  ],
};