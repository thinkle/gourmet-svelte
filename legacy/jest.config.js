//import { sass } from 'svelte-preprocess-sass';
//import css from "rollup-plugin-css-only";
let sassStuff = require('svelte-preprocess-sass')
let sass = sassStuff.sass

module.exports = {
    "testEnvironment":"jest-environment-jsdom-fourteen",
    "setupFiles": [
    "./jest/globals.js"
    ],
    "moduleNameMapper": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
    },
    transform : {
        //'^.+\\.svelte$' : 'svelte-jester',
        '^.+\\.svelte$' : ['jest-transform-svelte', {
            preprocess: {
                style: sass({}, { name: 'scss' }),
            },
        }],
        '^.+\\.js$' : 'babel-jest',
    },
    moduleFileExtensions : ['js','svelte'],
    "preset": "@shelf/jest-mongodb"
}
