const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  webpack: {
    alias: { fs: false, child_process: false },
    experiments: {
      asyncWebAssembly: true
    },

    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /\.gz$/,
        type: 'asset/inline'
      })

      webpackConfig.module.rules.push({
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: { inline: 'no-fallback' }
        }
      })

      // SPR renders plugin HTML with iframe srcdoc. Keep every executable and
      // stylesheet byte in index.html so the browser never has to resolve
      // plugin assets against the parent application's origin.
      let inlineChunkPluginFound = false
      webpackConfig.plugins.forEach((plugin) => {
        if (plugin instanceof InlineChunkHtmlPlugin) {
          plugin.tests = [/.+[.]js/]
          inlineChunkPluginFound = true
        }
        if (plugin instanceof HtmlWebpackPlugin) {
          plugin.userOptions.inject = 'body'
          plugin.userOptions.scriptLoading = 'blocking'
          plugin.options.inject = 'body'
          plugin.options.scriptLoading = 'blocking'
        }
      })
      if (!inlineChunkPluginFound) {
        throw new Error('InlineChunkHtmlPlugin not found')
      }

      const oneOfRule = webpackConfig.module.rules.find(
        (rule) => Array.isArray(rule.oneOf)
      )
      if (!oneOfRule) {
        throw new Error('webpack oneOf rules not found')
      }
      oneOfRule.oneOf.forEach((loader) => {
        if (
          loader.test?.test?.('test.module.css') ||
          loader.test?.test?.('test.module.scss')
        ) {
          loader.use?.forEach((entry) => {
            if (
              entry.loader &&
              entry.loader.includes('mini-css-extract-plugin')
            ) {
              entry.loader = require.resolve('style-loader')
              entry.options = {}
            }
          })
        }
      })

      return webpackConfig
    }
  }
}
