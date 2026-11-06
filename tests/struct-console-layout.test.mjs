import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(path)=>readFileSync(new URL(path, import.meta.url),'utf8');
const workbench=read('../src/components/types/TypeWorkbench.jsx');
const prop=read('../src/components/types/TypeProperties.jsx');
const context=read('../src/components/ContextProperties.jsx');
const app=read('../src/App.jsx') + '\n' + read('../src/components/BottomPanel.jsx');
const workspace=read('../src/components/WorkspaceWorkbench.jsx');
const preview=read('../preview/UMAA_Types_UML_Editor_v0.8.3.html');
assert.match(workbench,/className="struct-diagram"/);
assert.match(workbench,/uml-generalization-link/);
assert.match(workbench,/uml-parent-class/);
assert.match(workbench,/className="struct-members"/);
assert.match(workbench,/fieldName:field\.name/);
assert.match(workspace,/TypeWorkbench kind=\{kind\} id=\{id\}/);
assert.doesNotMatch(workspace,/Type Dependency Graph/);
assert.match(context,/return type \? <TypeProperties/);
assert.match(context,/useSelectionDetails/);
for (const key of ['applyTypeFieldEdit','updateTypeDefinition','restoreTypeOverride']) assert.match(prop,new RegExp(key));
assert.match(app,/log-only-panel/);
assert.match(app,/\bOUTPUT\b/);
assert.match(app,/\bCONSOLE\b/);
for(const extraneous of ["label: <span><ApartmentOutlined /> Autopilot", "label: <span><ApiOutlined /> ICD", "label: <span><ShareAltOutlined /> Mock Flow Simulation", "label: <span><DatabaseOutlined /> DDS Endpoint Matrix"]){
  assert.ok(!app.includes(extraneous),'Bottom panel must not contain detailed views');
}
assert.match(preview,/class="struct" id="struct"/);
assert.match(preview,/data-field=/);
assert.match(preview,/function saveField\(/);
assert.match(preview,/function saveType\(/); // selectable struct rows
assert.match(preview,/function renderLogs\(/);
assert.match(preview,/32 Message Types \+ 17 Common Data Types/);
console.log('PASS UML Generalization + editable Type Properties + Output/Console-only bottom panel');
