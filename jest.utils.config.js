// Jest config for the plain-JS unit tests under src/utils (card R5-2).
// Runs in Node, no Svelte, no jsdom, no database.
//   npx jest -c jest.utils.config.js
// (The editor branch adds Vitest as `npm test`; these tests are plain
// test()/expect() so they run under either.)
module.exports = {
    testEnvironment: 'node',
    transform: { '^.+\\.js$': 'babel-jest' },
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/\\.claude/'],
    testMatch: ['<rootDir>/src/utils/**/*.test.js'],
};
