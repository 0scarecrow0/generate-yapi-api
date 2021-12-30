// 为了让rollup识别commonjs类型的包,默认只支持导入ES6
import commonjs from 'rollup-plugin-commonjs';
// 为了支持import xx from 'xxx'
import nodeResolve from 'rollup-plugin-node-resolve';
// ts转js的编译器
import typescript2 from 'rollup-plugin-typescript2';
// 支持加载json文件
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';


export default {
  input: './src/index.ts',
  plugins: [

    typescript2({
      exclude: 'node_modules/**',
      useTsconfigDeclarationDir: false,
      tsconfig:'./tsconfig.json',
      tsconfigOverride: { compilerOptions : { module: 'es2015' } }
    }),
    json(),
    nodeResolve({jsnext: true,main: true}),
    commonjs({include: 'node_modules/**'}),
    terser()

  ],
  output: [
    {
      file: 'client/index.esm.js', // package.json 中 "module": "dist/index.esm.js"
      format: 'esm' // es module 形式的包， 用来import 导入， 可以tree shaking
    },
    {
      file: 'client/index.js', // package.json 中 "main": "dist/index.cjs.js",
      format: 'cjs' // commonjs 形式的包， require 导入
    }
    // {
    //   file: 'dist/index.umd.js',
    //   name: 'GLWidget',
    //   format: 'umd', // umd 兼容形式的包， 可以直接应用于网页 script
    //   sourcemap: true
    // }
  ]
};