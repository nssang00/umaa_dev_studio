/**
 * Static, no-runtime-server esbuild pipeline.
 * Mirrors the ea_react approach: index.html in project root and
 * a self-contained IIFE + extracted CSS in ./dist/.
 * No Vite, dev server, runtime CDN, API or Node runtime is needed to open index.html.
 */
import { build, context } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');
const options = {
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  outdir: 'dist',
  entryNames: '[name]',
  assetNames: 'assets/[name]-[hash]',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  minify: !watch,
  sourcemap: true,
  legalComments: 'none',
  loader: {
    '.woff': 'file', '.woff2': 'file', '.ttf': 'file',
    '.png': 'file', '.jpg': 'file', '.jpeg': 'file',
    '.gif': 'file', '.webp': 'file',
  },
  logLevel: 'info',
};

try {
  if (watch) {
    const ctx = await context(options);
    await ctx.watch();
    console.log('esbuild watch 실행 중 — 별도 웹 서버를 시작하지 않습니다.');
    console.log('로컬 브라우저에서 index.html을 직접 열어 확인하세요.');
    const stop = async () => { await ctx.dispose(); process.exit(0); };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } else {
    await build(options);
    console.log('정적 번들 생성 완료: index.html + dist/main.js + dist/main.css');
    console.log('서버 없이 index.html을 직접 열 수 있습니다.');
  }
} catch (error) {
  console.error('esbuild 빌드 실패:', error);
  process.exitCode = 1;
}
