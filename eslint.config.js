const tseslint = require('typescript-eslint');
const vue = require('eslint-plugin-vue');
const vueParser = require('vue-eslint-parser');

module.exports = tseslint.config(
    {
        ignores: ['**/node_modules/', '**/dist/', 'electron/app/', 'mobile/www/', 'mobile/android/', 'mobile/ios/', 'scss/css/', '**/*.js', '**/*.mjs']
    },
    ...tseslint.configs.recommended,
    ...vue.configs['flat/vue2-recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {parser: tseslint.parser, extraFileExtensions: ['.vue']}
        }
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            'vue/multi-word-component-names': 'off',
            'vue/html-indent': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/html-self-closing': 'off',
            'vue/html-closing-bracket-newline': 'off',
            'vue/attributes-order': 'off',
            'vue/order-in-components': 'off',
            'vue/mustache-interpolation-spacing': 'off',
            'vue/html-closing-bracket-spacing': 'off',
            'vue/first-attribute-linebreak': 'off',
            'vue/attribute-hyphenation': 'off',
            'vue/v-slot-style': 'off',
            'vue/component-definition-name-casing': 'off',
            'vue/no-v-html': 'off',
            // Prop types come from `PropOptions<T>` assertions, which these rules cannot see.
            'vue/require-prop-types': 'off',
            'vue/require-default-prop': 'off',
            'vue/require-v-for-key': 'warn',
            // The site pages mutate nested fields of object props in place; tolerated until they get their own state.
            'vue/no-mutating-props': 'warn'
        }
    }
);
