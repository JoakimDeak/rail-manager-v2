import { FlatCompat } from '@eslint/eslintrc'
import tseslint from 'typescript-eslint'
import importSort from 'eslint-plugin-simple-import-sort'
import { globalIgnores } from 'eslint/config'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

export default tseslint.config(
  [globalIgnores(['next-env.d.ts'])],
  {
    ignores: ['.next'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', next: 'return', prev: '*' },
      ],
      'simple-import-sort/exports': 'warn',
      'simple-import-sort/imports': 'warn',
    },
    plugins: {
      'simple-import-sort': importSort,
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
)
