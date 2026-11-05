import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { editStructDefinition } from '../src/model/typeEditing.js';
import { upgradeWorkspace } from '../src/model/workspaceSchema.js';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

const snapshot=structuredClone(seedWorkspace);
const source=snapshot.messages.find(t=>t.name==='GlobalPoseReportType');
const fields=source.fields.map(f=>({ ...f, _originalName:f.name, description:f.description??'', defaultValue:'' }));
fields[0].description='Original altitude sample';
fields[0].defaultValue='0.0';
const edited=editStructDefinition(snapshot,'message',source.id,{
  name:source.name, baseType:source.baseType, fields,
});
assert.ok(edited!==snapshot);
const stored=edited.messages.find(t=>t.id===source.id);
assert.equal(stored.fields[0].description,'Original altitude sample');
assert.equal(stored.fields[0].defaultValue,'0.0');
assert.equal(stored.projectOverride,true);
assert.deepEqual(stored.mockBaseline.fields,source.fields);
assert.equal(upgradeWorkspace(JSON.parse(JSON.stringify(edited))).messages.find(t=>t.id===source.id).fields[0].defaultValue,'0.0');

const noOp=editStructDefinition(edited,'message',source.id,{
  name:source.name,baseType:source.baseType,
  fields:stored.fields.map(f=>({...f,_originalName:f.name,description:f.description??'',defaultValue:f.defaultValue??''})),
});
assert.equal(noOp,edited,'opening/collapsing fields must not dirty workspace');
const invalid=fields.map(f=>({...f}));
invalid[0].description=42;
assert.equal(editStructDefinition(snapshot,'message',source.id,{
  name:'ShouldNotBeSaved',baseType:source.baseType,fields:invalid,
}),null);
assert.equal(snapshot.messages.find(t=>t.id===source.id).name,source.name);

const parent=read('../src/components/StructPropertiesEditor.jsx');
const list=read('../src/components/StructFieldAccordionList.jsx');
const field=read('../src/components/StructFieldEditor.jsx');
assert.match(parent,/StructFieldAccordionList/);
assert.match(parent,/Form.List name="fields"/);
assert.match(parent,/Struct 전체 저장/);
assert.match(list,/Collapse/);
assert.match(list,/forceRender: true/);
assert.match(list,/selectedFieldName/);
assert.match(list,/onClick=\{addExpanded\}/);
assert.match(field,/description/);
assert.match(field,/defaultValue/);
assert.match(field,/@key/);
assert.match(field,/@optional/);
console.log('PASS Struct field accordion, optional metadata save, full-Struct atomic transaction');
