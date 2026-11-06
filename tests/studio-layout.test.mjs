import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitStudioPanes, resizeStudioPane, STUDIO_PANE_LIMITS } from '../src/logic/studioLayout.js';

assert.deepEqual(fitStudioPanes(1440), { explorer: 274, properties: 292 });
assert.deepEqual(fitStudioPanes(1440, { explorer: 999, properties: -1 }), { explorer: 480, properties: 240 });
assert.deepEqual(fitStudioPanes(900, { explorer: 480, properties: 540 }), { explorer: 246, properties: 278 });
assert.deepEqual(fitStudioPanes(1440, { explorer: NaN, properties: Infinity }), { explorer: 274, properties: 292 });
const base = { explorer: 274, properties: 292 };
assert.deepEqual(resizeStudioPane(1100, base, 'explorer', 600), { explorer: 432, properties: 292 });
assert.deepEqual(resizeStudioPane(1100, base, 'properties', 600), { explorer: 274, properties: 450 });
assert.deepEqual(resizeStudioPane(1100, base, 'explorer', 10), { explorer: 210, properties: 292 });
assert.deepEqual(resizeStudioPane(1100, base, 'properties', 10), { explorer: 274, properties: 240 });
assert.deepEqual(resizeStudioPane(1100, base, 'unknown', 1000), base);
assert.ok(STUDIO_PANE_LIMITS.workbenchMin >= 360);
const shell = readFileSync(new URL('../src/layouts/studio/StudioShell.jsx', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../src/components/BottomPanel.jsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
for (const fragment of ['role="separator"', 'onPointerDown', 'onPointerMove', 'onPointerUp', 'onKeyDown', 'aria-valuenow', 'ResizeObserver', 'window.localStorage']) {
  assert.ok(shell.includes(fragment), `Missing accessible shell control: ${fragment}`);
}
for (const fragment of ['CaretUpOutlined', 'CaretDownOutlined', 'aria-expanded', 'OUTPUT', 'CONSOLE', 'log-only-panel']) {
  assert.ok(panel.includes(fragment), `Missing console control: ${fragment}`);
}
assert.match(app, /<StudioLayout/);
assert.match(readFileSync(new URL('../src/layouts/studio/StudioLayout.jsx', import.meta.url), 'utf8'), /bottomPanel=\{<WorkbenchPanelRenderer panelId="bottom" viewProps=\{consoleProps\}\/>\}/);
const registry = readFileSync(new URL("../src/layouts/workbenchPanels.config.js", import.meta.url), "utf8");
assert.match(registry, /ConsoleView/);
console.log('PASS resizable Explorer/Properties constraints + console caret + shell composition');
