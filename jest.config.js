//import { sass } from 'svelte-preprocess-sass';
//import css from "rollup-plugin-css-only";
let sassStuff = require('svelte-preprocess-sass')
let sass = sassStuff.sass



// https://stackoverflow.com/questions/60323002/svelte-3-could-not-import-modules-when-unit-testing


console.log('Loaded jest config!');
const svelteJestPreprocessor = () => ({
  // replace `import foo from 'foo'` -> `import * as foo from 'foo'`
    script: ({ content }) => {
        console.log('Preprocess',content);
        return {
    // process each line of code
      code: content.split('\n')
          .map(line => {
               // pass: no import, import with {}, import svelte component
               if ((!line.match(/\s*import/)) || (line.match(/{/)) || (line.match(/\.svelte/))) {
                   return line
               } else {
                   console.log('preprocess replace!',line,line.replace(/import/, 'import * as'));
                   return line.replace(/import/, 'import * as');
               }
          }).join('\n')
        }
    }
});

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
            preprocess: [                
                svelteJestPreprocessor(),
                {
                style: sass({}, { name: 'scss' }),
                },

            ],
        }],
        '^.+\\.js$' : 'babel-jest',
    },
    moduleFileExtensions : ['js','svelte'],
    //"preset": "@shelf/jest-mongodb"
}

