module.exports = {
  root: true,

  env: {
    es6: true,
    browser: true
  },

  parserOptions: {
    parser: "@babel/eslint-parser",
    sourceType: "module",
    ecmaVersion: 2021,
    requireConfigFile: false
  },

  extends: ["eslint:recommended", "prettier"],

  plugins: [],
  rules: {},

  globals: {
    require: false,
    module: false,
    process: false,
    globalThis: false
  }
};
