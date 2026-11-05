import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const source = readFileSync(resolve(root, 'src/repository/mockRepository.js'), 'utf8');
const buildScript = readFileSync(resolve(root, 'scripts/build.mjs'), 'utf8');
const diagram = readFileSync(resolve(root, 'src/components/Diagram.jsx'), 'utf8');
const dagreLayout = readFileSync(resolve(root, 'src/logic/layout.js'), 'utf8');
const editorStore = readFileSync(resolve(root, 'src/stores/useEditorStore.js'), 'utf8');
const tests = [
  ['정적 HTML의 JS 번들 경로', html.includes('src="./dist/main.js"')],
  ['정적 HTML의 CSS 번들 경로', html.includes('href="./dist/main.css"')],
  ['브라우저 ESM import 없음', !/<script[^>]+type="module"/.test(html)],
  ['Vite 제거', !('vite' in pkg.devDependencies) && !existsSync(resolve(root,'vite.config.ts'))],
  ['esbuild 사용', Boolean(pkg.devDependencies.esbuild) && buildScript.includes("format: 'iife'")],
  ['런타임 서버 시작 없음', !/servedir|serve\(/.test(buildScript)],
  ['Mock Repository', source.includes('MockProjectRepository')],
  ['file:// 저장소 예외 처리', source.includes('volatileStorage')],
  ['React Flow v12 named import', diagram.includes('import { ReactFlow,') && diagram.includes("from '@xyflow/react'")],
  ['Dagre 의존성 등록', Boolean(pkg.dependencies['@dagrejs/dagre'])],
  ['Dagre LR 배치 사용', dagreLayout.includes("rankdir: 'LR'") && dagreLayout.includes('layout(graph)')],
  ['JavaScript JSX entry', buildScript.includes("entryPoints: ['src/main.jsx']")],
  ['TS/TSX 소스 없음', !existsSync(resolve(root,'src/main.tsx')) && !existsSync(resolve(root,'src/model/seed.ts'))],
  ['Zustand 자동 배치 액션', editorStore.includes('autoLayout()') && editorStore.includes('updateTopology')],
];
for (const [name, ok] of tests) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
if (tests.some(([, ok]) => !ok)) process.exitCode = 1;
