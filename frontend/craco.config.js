module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      // In development, CRA uses eval-based source maps which trigger CSP eval violations.
      // Switch to a non-eval devtool to avoid needing 'unsafe-eval' in CSP.
      if (env === "development") {
        webpackConfig.devtool = "cheap-module-source-map";
      }
      return webpackConfig;
    },
  },
};
