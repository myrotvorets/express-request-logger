import MyrotvoretsConfig from '@myrotvorets/eslint-config-myrotvorets-ts';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['dist/**'],
    },
    ...MyrotvoretsConfig,
    {
        files: ['test/**.mts'],
        rules: {
            'sonarjs/assertions-in-tests': 'off',
            'sonarjs/no-hardcoded-ip': 'off',
        },
    },
];
