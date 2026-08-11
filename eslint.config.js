import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
    globalIgnores(['dist']),
    {
      files: ['**/*.{ts,tsx}'],
      plugins: {
        'react-hooks': reactHooks,
      },
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactRefresh.configs.vite,
        prettierConfig,
      ],
      rules: {
        ...reactHooks.configs.recommended.rules,
      },
      languageOptions: {
        ecmaVersion: 2020,
        parser: tseslint.parser,
        globals: globals.browser,
      },
    },
  )