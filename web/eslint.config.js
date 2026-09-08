// @ts-check
import eslint from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // 'essential' (bug-prevention rules) rather than 'recommended', which also bundles
  // opinionated HTML formatting rules — Prettier's job elsewhere in this project, not ESLint's.
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      // TypeScript (via vue-tsc) already catches undefined identifiers, including in type
      // positions and ambient browser globals — no-undef is redundant and false-positives here.
      'no-undef': 'off',
    },
  },
  { ignores: ['dist/**', 'node_modules/**'] },
);
