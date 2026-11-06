import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const registry = read('../src/layouts/workbenchPanels.config.js');
const renderer = read('../src/layouts/WorkbenchPanelRenderer.jsx');
const app = read('../src/App.jsx');
const properties = read('../src/components/SelectionPropertiesPanel.jsx');
for (const [id, feature] of [['explorer','ExplorerView'],['workbench','WorkbenchView'],['properties','PropertiesView'],['bottom','ConsoleView']]) {
  assert.ok(registry.includes(id + ': {'), 'Missing panel ' + id);
  assert.ok(registry.includes(feature), 'Missing view ' + feature);
  assert.ok(read('../src/layouts/studio/StudioLayout.jsx').includes('panelId="' + id + '"'), 'Missing StudioLayout composition ' + id);
}
assert.match(renderer, /panel\.views\.find\(/);
assert.match(renderer, /<View \{\.\.\.viewProps\}\/>/);
assert.doesNotMatch(renderer, /useEditorStore|useState|localStorage/);
assert.match(properties, /JourneyGuide/);
assert.match(properties, /ContextProperties/);
assert.match(properties, /onChangePlatform/);
assert.match(properties, /onChangeVendor/);
assert.match(properties, /issues\.filter/);
assert.match(app, /<StudioLayout/);
console.log('PASS: registry, renderer, and existing property settings');
