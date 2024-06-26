import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'

import pkg from './package.json'

const libraryName = 'sdk'

export default {
  input: `src/index.ts`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    replace({
      PACKAGE_NAME: pkg.name,
      PACKAGE_VERSION: pkg.version,
      preventAssignment: true,
    }),

    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript(),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({
      namedExports: {
        phoenix: ['Socket', 'Channel', 'Presence'],
      },
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),

    // Resolve source maps to the original source
    sourceMaps(),

    terser(),
  ],
}
