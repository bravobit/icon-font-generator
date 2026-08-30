import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default tseslint.config(
    {
        ignores: ['dist/**', 'test/fixtures/**'],
    },
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': ['error', {fixStyle: 'inline-type-imports'}],
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-unnecessary-condition': ['error', {allowConstantLoopConditions: true}],
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            '@typescript-eslint/restrict-template-expressions': ['error', {allowNumber: true}],
            'no-console': 'error',
        },
    },
    {
        files: ['test/**/*.ts'],
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-floating-promises': [
                'error',
                {
                    allowForKnownSafeCalls: [
                        {
                            from: 'package',
                            package: 'node:test',
                            name: ['after', 'before', 'afterEach', 'beforeEach', 'describe', 'it', 'test'],
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['**/*.js'],
        extends: [tseslint.configs.disableTypeChecked],
    }
);
