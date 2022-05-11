module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
  },
  overrides: [
    {
      files: ['./**/*.js'],
      rules: {
        semi: 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'myoas/',
    'static/',
    'workflows/',
    'mochawesome-report/',
    'pub_mkdocs/',
    'out/',
    'documentation/',
    'bintra-*/',
    'test/',
    'testutils/'
  ]
}
