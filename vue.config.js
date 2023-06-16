module.exports = {
  configureWebpack: {
    experiments: {
      topLevelAwait: true,
    },
    resolve: {
      fallback: { "crypto": false }
    }
  }
}