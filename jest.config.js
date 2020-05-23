module.exports = {
    "setupFiles": [
    "./jest/globals.js"
    ],
    transform : {
        '^.+\\.svelte$' : 'svelte-jester',
        '^.+\\.js$' : 'babel-jest',
    },
    moduleFileExtensions : ['js','svelte'],
    "preset": "@shelf/jest-mongodb"
}
