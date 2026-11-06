import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const prefix='../src/layouts/studio/';
const app=read('../src/App.jsx');
const layout=read(prefix+'StudioLayout.jsx');
const shell=read(prefix+'StudioShell.jsx');
const registry=read('../src/layouts/workbenchPanels.config.js');

assert.match(app,/import \{ StudioLayout \}/);
assert.doesNotMatch(app,/WorkbenchPanelRenderer|<StudioShell/);
assert.match(layout,/import \{ StudioShell \}/);
assert.match(layout,/import \{ WorkbenchPanelRenderer \}/);
assert.doesNotMatch(layout,/useEditorStore|localStorage|\.\/\.\/model|\.\/\.\/logic/);
for(const id of ['explorer','workbench','properties','bottom'])
  assert.ok(layout.includes('panelId="'+id+'"'));
for(const prop of ['explorerProps','workbenchProps','propertiesProps','consoleProps'])
  assert.ok(layout.includes(prop));
assert.match(shell,/ResizeObserver/);
assert.match(shell,/\.\.\/\.\.\/logic\/studioLayout/);
const views=[
  ['ExplorerView','StudioNavigator'],
  ['WorkbenchView','WorkspaceWorkbench'],
  ['PropertiesView','SelectionPropertiesPanel'],
  ['ConsoleView','BottomPanel'],
];
for(const [view,component] of views) {
  const source=read(prefix+'views/'+view+'.jsx');
  assert.ok(registry.includes('component: '+view),view+' not registered');
  assert.ok(source.includes('import { '+component+' }'),view+' missing component');
  assert.ok(source.includes('<'+component),view+' not composed from component');
  assert.doesNotMatch(source,/\.\.\/model\/|\.\.\/logic\/|\.\.\/repository\//);
}
assert.match(read('../src/components/StudioShell.jsx'),/export \{ StudioShell \}/);
console.log('PASS StudioLayout -> panel Views -> feature Components; pure layout geometry, no store logic');
