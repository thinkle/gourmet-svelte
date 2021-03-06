import svelte from "rollup-plugin-svelte";
import builtins from "rollup-plugin-node-builtins";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
// import { scss, coffeescript, pug } from 'svelte-preprocess'
// import { sass } from 'svelte-preprocess-sass';
import css from "rollup-plugin-css-only";
import autoPreprocess from "svelte-preprocess";
//import typescript from '@rollup/plugin-typescript';


//import smelte from "smelte/rollup-plugin-smelte"; //

const production = !process.env.ROLLUP_WATCH;

export default [
  // Main App
  {
    input: "src/webapp/main.js",
    output: {
      sourcemap: true,
      format: "iife",
      name: "app",
      file: "public/build/bundle.js",
    },
    plugins: [
      bundleDemos({
        target: "src/webapp/demos.js",
        root: "src",
        pathBase: "../",
      }),
      replace({
        DEV: !production,
        BUILD_TIME: () => new Date() + "",
        BUILD_MS: () => new Date().getTime(),
      }),
      //typescript(),
      //css({ output: "public/build/extra.css" }),
      svelte({
        // enable run-time checks when not in production
        preprocess: autoPreprocess(),
      }),
      css({ output: "public/build/bundle.css" }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration
      // consult the documentation for details:
      // https://github.com/rollup/plugins/tree/master/packages/commonjs
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      // babel({
      //     // exclude: 'node_modules/**', // only transpile our source code
      //     // plugins: ["@babel/plugin-transform-named-capturing-groups-regex"]
      // }),
      commonjs(),
      builtins(),
      !production && serve(),
      !production && livereload("public"),
      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser(),
    ],
    watch: {
      clearScreen: false,
    },
  },
  // Functions...
  {
    input: "src/data/functions/api.js",
    output: {
      sourcemap: true,
      format: "cjs",
      name: "functions",
      file: "functions/api.js",
    },
    plugins: [
      json(),
      production && replace({ MONGO_DB_NAME: "Gourmet" }),
      !production &&
        replace({
          MONGO_DB_NAME: "devtest",
        }),
      commonjs(),
      //typescript(),
    ],
  },
  {
    input: "src/extension/background.js",
    output: {
      sourcemap: true,
      format: "iife",
      name: "extension",
      file: "extension/background.js",
    },
    plugins: [
      replace({
        BUILD_TIME: () => new Date() + "",
        BUILD_MS: () => new Date().getTime(),
        DEV: !production,
      }),
    ],
  },
  {
    input: "src/extension/content.js",
    output: {
      sourcemap: true,
      format: "iife",
      name: "extension",
      file: "extension/content.js",
    },
    plugins: [
      replace({
        BUILD_TIME: () => new Date() + "",
        BUILD_MS: () => new Date().getTime(),
        DEV: !production,
      }),
      svelte({
        // enable run-time checks when not in production
        dev: !production,
        // we'll extract any component CSS out into
        // a separate file  better for performance
      }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      // babel({
      //     // exclude: 'node_modules/**', // only transpile our source code
      //     // plugins: ["@babel/plugin-transform-named-capturing-groups-regex"]
      // }),
      commonjs(),
      builtins(),
      // In dev mode, call `npm run start` once
      // the bundle has been generated

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      //!production && livereload('extension'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser(),
    ],
  },
  {
    input: "src/extension/embed.js",
    output: {
      sourcemap: true,
      format: "iife",
      name: "extension",
      file: "extension/embed.js",
    },
    plugins: [
      replace({
        DEV: !production,
        BUILD_TIME: () => new Date() + "",
        BUILD_MS: () => new Date().getTime(),
      }),
      svelte({
        // enable run-time checks when not in production
        dev: !production,
        // we'll extract any component CSS out into
        // a separate file  better for performance
      }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      commonjs(),
    ],
  },
];

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require("child_process").spawn("npm", ["run", "start", "--", "--dev"], {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        });
      }
    },
  };
}

import fs from "fs";
import path from "path";
import glob from "glob";

function bundleDemos(options) {
  console.log("called bundle...");

  return {
    generateBundle() {
      console.log("***BUNDLE DEMOS...*");
      let rootDirectory = options.root;
      let pathBase = options.pathBase || "./";
      let files = [];
      let globExpression = "*.demo.svelte";
      for (let level = 0; level < 5; level++) {
        files = [...files, ...glob.sync(globExpression)];
        globExpression = "*/" + globExpression;
      }
      let moduleNames = [];
      let importStatements = files
        .map((fn) => {
          let bn = path.basename(fn);
          let moduleName = bn.split(".")[0];
          let pathname = pathBase + fn.replace(/^[^/]+\//, "");
          moduleNames.push(moduleName);
          return `import ${moduleName} from "${pathname}";`;
        })
        .join("\n");

      let exportStatement = ` 
export default {
    ${moduleNames.join(",\n    ")}
} 
`;
      let currentContents = fs.readFileSync(options.target);
      let newContents = `${importStatements}\n\n${exportStatement}`;
      if (currentContents != newContents) {
        console.log("demos.js changed, rewriting!");
        fs.writeFileSync(options.target, newContents);
      }
    },
  };
}
