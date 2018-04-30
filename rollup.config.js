import uglify from "rollup-plugin-uglify";

const DEFAULT_CONFIG = {
  input: "./index.js",
  output: {
    format: "umd",
    name: "d3",
    extend: true,
    globals: {
      "d3-array": "d3",
      "d3-scale": "d3",
      "d3-selection": "d3",
      "d3-timer": "d3"
    },
    file: "build/d3-bullet.js"
  },
  external: ["d3"]
};

export default [
  // Bundled source
  DEFAULT_CONFIG,

  // Minified output
  Object.assign(Object.assign({}, DEFAULT_CONFIG), {
    output: Object.assign(Object.assign({}, DEFAULT_CONFIG.output), {
      sourcemap: false,
      file: "build/d3-bullet.min.js"
    }),
    plugins: [uglify()]
  })
];
