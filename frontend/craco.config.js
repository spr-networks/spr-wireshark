const webpack = require('webpack');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');


//stream: require.resolve('stream-browserify')

module.exports = {
  webpack: {
    alias: { 'fs': false, 'child_process': false},
    experiments: {
      asyncWebAssembly: true,
    },

    configure: (webpackConfig, { env, paths }) => {

      webpackConfig.module.rules.push({
        test: /\.gz$/,
        type: 'asset/inline'
      });

      webpackConfig.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader', options: { inline: 'no-fallback' }, }
      })

      webpackConfig.plugins.forEach(plugin => {
        if (plugin instanceof InlineChunkHtmlPlugin) {
          plugin.tests =  [ /.+[.]js/ ]
          plugin.options =  { inject: 'body'}
        }

      })

      /*
      const oneOfRuleIdx = webpackConfig.module.rules.findIndex(rule => !!rule.oneOf);
      webpackConfig.module.rules[oneOfRuleIdx].oneOf.forEach(loader => {
        if (loader.test && loader.test.test && (loader.test.test("test.module.css") || loader.test.test("test.module.scss"))) {
          loader.use.forEach(use => {
            if (use.loader && use.loader.includes('mini-css-extract-plugin')) {
              use.loader = require.resolve('style-loader');
            }
          })
        }
      })
      */

      return webpackConfig
    }
  },
}
