// Separate Jest config for the REST API contract tests (card P0-5).
// Runs in plain Node against an in-memory MongoDB; no Svelte, no jsdom.
//   npm run test:api
module.exports = {
    testEnvironment: 'node',
    transform: { '^.+\\.js$': 'babel-jest' },
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/\\.claude/'],
    testMatch: ['<rootDir>/src/data/functions/**/*.contract.test.js'],
    // First run may download a MongoDB binary.
    testTimeout: 60000,
};
