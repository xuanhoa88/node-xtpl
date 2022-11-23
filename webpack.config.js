const path = require("path");
const { IgnorePlugin } = require("webpack");

const optionalPlugins = [];
if (process.platform !== "darwin") {
  // don't ignore on OSX
  optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /^fsevents$/ }));
}

module.exports = {
  mode: "production",

  target: "node",

  entry: {
    xtpl: "./src/bookWriter",
  },

  plugins: [...optionalPlugins],

  output: {
    clean: true,
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    chunkFormat: "commonjs",
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: "commonjs2",
    },
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /.node$/,
        loader: "node-loader",
      },
    ],
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: [".js"],
    modules: ["node_modules"],
  },

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },

  stats: { errorDetails: true },
};
