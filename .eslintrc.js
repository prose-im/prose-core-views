module.exports = {
  root: true,

  env: {
    browser: true
  },

  parserOptions: {
    parser: "@babel/eslint-parser",
    sourceType: "module",
    ecmaVersion: 2021,
    requireConfigFile: false
  },

  extends: ["prettier"],

  plugins: [],
  rules: {}
};
