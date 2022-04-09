module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript/base',
  ],
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      { multiline: { delimiter: 'none' } },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all', args: 'after-used', ignoreRestSiblings: true, argsIgnorePattern: '^_',
      },
    ],
    'import/extensions': [
       'error',
       'ignorePackages',
       {
         'js': 'never',
         'jsx': 'never',
         'ts': 'never',
         'tsx': 'never',
       },
    ],
    'no-console': 'warn',
    quotes: ['error', 'single', { avoidEscape: true }],
    'import/prefer-default-export': 'off',
    'max-len': ['error', 120],
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
    'sort-imports': ['error', {
      ignoreDeclarationSort: true,
      allowSeparatedGroups: true,
    }],
    'arrow-parens': ['error', 'as-needed'],
    semi: 'off',
    'max-classes-per-file': 'off',

  },
}
