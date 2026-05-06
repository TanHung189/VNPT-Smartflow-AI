const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    configure: (webpackConfig, { env }) => {
      // In development, CRA uses eval-based source maps which trigger CSP eval violations.
      // Switch to a non-eval devtool to avoid needing 'unsafe-eval' in CSP.
      if (env === "development") {
        webpackConfig.devtool = "cheap-module-source-map";
      }
      return webpackConfig;
    },
  },
  // FIX: Thêm headers COOP/COEP để cho phép Google Login popup giao tiếp
  // qua window.postMessage mà không bị trình duyệt chặn.
  devServer: {
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
};
