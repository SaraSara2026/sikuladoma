import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // `catch {}` je v celém repu záměrný vzor pro "best effort, ignoruj
      // selhání" (localStorage zápisy, apiLogout při odhlášení apod.) —
      // desítky výskytů, ne opomenutí.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // `const { password_hash, ...safe } = user` (omit a field before
      // sending to the client) deliberately never reads `password_hash`.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // api/ (Vercel Functions) a scripts/ (CLI) běží v Node.js, ne v
    // prohlížeči — bez tohohle bloku lint hlásil `process`/`Buffer` jako
    // nedefinované ve všech server-side souborech.
    files: ['api/**/*.js', 'scripts/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      // `const { password_hash, ...safe } = user` (omit a field before
      // sending to the client) deliberately never reads `password_hash`.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
])
