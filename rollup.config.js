import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import prettier from 'rollup-plugin-prettier';
import shebang from 'rollup-plugin-preserve-shebang';
import pkg from './package.json';

export default {
  input: {
    actions: 'src/actions.ts',
    expression: 'src/expression.ts',
    context: 'src/context.ts',
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  output: [
    {
      dir: 'lib/',
      entryFileNames: '[name].js',
      format: 'cjs',
      exports: 'named',
    },
    // {
    //   dir: 'lib/',
    //   entryFileNames: '[name].mjs',
    //   chunkFileNames: '[name]-[hash].mjs',
    //   format: 'es',
    // },
  ],
  external: [
    'fs',
    'path',
    'module',
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    shebang(),
    nodeResolve(),
    commonjs(),
    typescript({
      typescript: require('typescript'),
    }),
    prettier({
      tabWidth: 2,
      singleQuote: false,
      parser: 'babel',
    }),
  ],
};
